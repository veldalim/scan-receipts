import type { Request, Response } from 'express';

// Primary endpoint requested by user
const PRIMARY_MODEL = 'gemini-3.8-flash';
// Resilient fallback model when Google infrastructure returns 503 high demand
const FALLBACK_MODEL = 'gemini-3.1-flash-lite';

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

/**
 * Serverless handler to scan clinic receipts and extract:
 * 1. Patient Name
 * 2. Clinic / Healthcare Provider
 * 3. After GST Amount
 * using direct serverless REST connection to Gemini API.
 */
export default async function handler(req: Request, res: Response) {
  // Always guarantee JSON response header
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Please use POST.',
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY environment variable is not configured on the server.',
      });
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');

    const prompt = `You are an expert medical receipt and tax invoice OCR specialist.
Examine this clinic receipt image and extract all clinical and tax details with high precision:
1. Patient Name: Name of the individual patient receiving treatment or billed.
2. Clinic Name: Name of the medical clinic, dental clinic, hospital, or specialist center.
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

    const requestBody = {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: cleanBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    };

    // Helper to call Gemini REST API
    const callGeminiModel = async (model: string) => {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(15000),
      });

      const responseText = await resp.text();
      let parsedJson: GeminiResponse;
      try {
        parsedJson = JSON.parse(responseText);
      } catch {
        return {
          status: resp.status,
          ok: false,
          data: {
            error: {
              code: resp.status,
              message: responseText.slice(0, 200),
              status: 'INVALID_RESPONSE',
            },
          },
        };
      }

      return {
        status: resp.status,
        ok: resp.ok,
        data: parsedJson,
      };
    };

    // Attempt 1: Call PRIMARY_MODEL (gemini-3.8-flash)
    let result: { status: number; ok: boolean; data: GeminiResponse };
    try {
      result = await callGeminiModel(PRIMARY_MODEL);
    } catch (primaryErr) {
      console.warn(`Primary model ${PRIMARY_MODEL} network or timeout error:`, primaryErr);
      result = {
        status: 503,
        ok: false,
        data: {
          error: {
            code: 503,
            message: 'Primary model connection timeout or unavailable',
            status: 'UNAVAILABLE',
          },
        },
      };
    }

    // If 503 (high demand) or 429, fall back to FALLBACK_MODEL (gemini-3.1-flash-lite)
    if (!result.ok && (result.status === 503 || result.status === 429 || result.status === 404)) {
      console.warn(`Primary model returned ${result.status}. Executing fallback with ${FALLBACK_MODEL}...`);
      try {
        result = await callGeminiModel(FALLBACK_MODEL);
      } catch (fallbackErr) {
        console.error(`Fallback model ${FALLBACK_MODEL} error:`, fallbackErr);
      }
    }

    if (!result.ok) {
      const errorMsg = result.data.error?.message || `API error with status ${result.status}`;
      return res.status(200).json({
        success: false,
        error: errorMsg,
      });
    }

    const rawContent = result.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) {
      return res.status(200).json({
        success: false,
        error: 'No text content returned from Gemini model candidate.',
      });
    }

    // Clean JSON string of any markdown fences
    const cleanedJsonStr = rawContent
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
    console.error('Serverless scan-receipt error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error during receipt scan';
    return res.status(200).json({
      success: false,
      error: message,
    });
  }
}
