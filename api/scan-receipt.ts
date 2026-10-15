import type { Request, Response } from 'express';

// Mistral API Endpoint
const MISTRAL_API_ENDPOINT = 'https://api.mistral.ai/v1/chat/completions';

// Primary model requested by the user
const PRIMARY_MODEL = 'mistral-small-latest';
// Fallback multimodal model in Mistral's suite
const VISION_MODEL = 'pixtral-12b-2409';

interface MistralChoice {
  index?: number;
  message?: {
    role?: string;
    content?: string | Array<{ type: string; text?: string }>;
  };
  finish_reason?: string;
}

interface MistralResponse {
  id?: string;
  choices?: MistralChoice[];
  message?: string;
  error?: {
    message?: string;
    type?: string;
    code?: string | number;
  };
}

/**
 * Serverless handler connecting to Mistral API
 * to extract:
 * 1. Patient Name
 * 2. Clinic / Healthcare Provider
 * 3. After GST Amount
 * from uploaded clinic receipts.
 */
export default async function handler(req: Request, res: Response) {
  // Always guarantee JSON response header
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    });
  }

  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'Missing imageBase64 in request body.',
      });
    }

    // Do not hardcode any key. Read dynamically from environment variables.
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        success: false,
        error:
          'MISTRAL_API_KEY is not configured in your environment. Please add MISTRAL_API_KEY to your environment variables.',
      });
    }

    // Prepare clean data URL
    const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
    const dataUrl = `data:${mimeType};base64,${cleanBase64}`;

    const prompt = `You are a medical receipt and tax invoice OCR extraction expert.
Analyze this clinical receipt image carefully. Extract the clinical and tax details with high precision:
1. Patient Name: Name of the individual patient receiving treatment or billed.
2. Clinic Name: Name of the medical clinic, dental clinic, hospital, or specialist practice.
3. After GST Amount: The final total payable amount INCLUDING Goods and Services Tax (GST / VAT).
4. Before GST Amount: The subtotal before GST is applied.
5. GST Rate: The GST tax percentage (e.g. 9 for 9%, 8 for 8%, 7 for 7%).
6. GST Amount: The dollar amount of GST tax charged.
7. Currency: Detect currency (e.g. SGD, AUD, USD, MYR). Default to 'SGD' if Singapore format (e.g. 9% GST, UEN).
8. Clinic Details: Address, Contact phone, GST Registration Number / UEN (Business registration number).
9. Invoice / Receipt Metadata: Tax invoice / Receipt number, Date (YYYY-MM-DD), Time of visit.
10. Attending Doctor: Doctor or physician name if printed.
11. Patient Identification: Patient ID / MRN / masked NRIC if present.
12. Payment Method: Cash, Credit Card, NETS, PayNow, Insurance, etc.
13. Line Items: Itemized charges with description, category, quantity, unit price, and total amount.

Return ONLY a valid JSON object matching this structure without Markdown backticks:
{
  "patientName": "string",
  "clinicName": "string",
  "afterGstAmount": number,
  "beforeGstAmount": number,
  "gstRate": number,
  "gstAmount": number,
  "currency": "string",
  "clinicAddress": "string",
  "clinicPhone": "string",
  "clinicGstRegNo": "string",
  "receiptNumber": "string",
  "date": "YYYY-MM-DD",
  "time": "string",
  "doctorName": "string",
  "patientIdOrRef": "string",
  "paymentMethod": "string",
  "summary": "string",
  "confidenceNotes": "string",
  "items": [
    {
      "description": "string",
      "category": "Consultation",
      "quantity": 1,
      "unitPrice": 0,
      "amount": 0,
      "isGstApplicable": true
    }
  ]
}`;

    // Helper to call Mistral Chat Completions API
    const callMistral = async (modelName: string) => {
      const payload = {
        model: modelName,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: dataUrl,
              },
            ],
          },
        ],
        response_format: {
          type: 'json_object',
        },
        temperature: 0.1,
      };

      const response = await fetch(MISTRAL_API_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000),
      });

      const rawText = await response.text();
      let json: MistralResponse;
      try {
        json = JSON.parse(rawText);
      } catch {
        return {
          ok: false,
          status: response.status,
          error: `Non-JSON response from Mistral API (${response.status}): ${rawText.slice(0, 150)}`,
        };
      }

      if (!response.ok) {
        const errorMsg = json.error?.message || json.message || `Mistral API returned status ${response.status}`;
        return {
          ok: false,
          status: response.status,
          error: errorMsg,
        };
      }

      return {
        ok: true,
        status: response.status,
        data: json,
      };
    };

    // First attempt with user requested model (mistral-small-latest)
    let result = await callMistral(PRIMARY_MODEL);

    // If model does not support image or returns model error, try vision-capable Pixtral
    if (!result.ok && result.error && (result.error.includes('image') || result.error.includes('vision') || result.error.includes('model') || result.status === 400 || result.status === 404)) {
      console.warn(`Model ${PRIMARY_MODEL} returned: ${result.error}. Retrying with Mistral vision model ${VISION_MODEL}...`);
      result = await callMistral(VISION_MODEL);
    }

    if (!result.ok || !result.data) {
      return res.status(200).json({
        success: false,
        error: result.error || 'Failed to scan receipt with Mistral API.',
      });
    }

    const content = result.data.choices?.[0]?.message?.content;
    let contentStr = '';
    if (typeof content === 'string') {
      contentStr = content;
    } else if (Array.isArray(content)) {
      contentStr = content.map((c) => c.text || '').join('');
    }

    if (!contentStr) {
      return res.status(200).json({
        success: false,
        error: 'Empty response returned from Mistral model.',
      });
    }

    // Clean JSON response (strip markdown wrappers if any)
    const cleanedJsonStr = contentStr
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsedData = JSON.parse(cleanedJsonStr);

    return res.status(200).json({
      success: true,
      data: parsedData,
    });
  } catch (err: unknown) {
    console.error('Serverless Mistral scan-receipt error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error during receipt scan';
    return res.status(200).json({
      success: false,
      error: message,
    });
  }
}
