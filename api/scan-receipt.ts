import type { Request, Response } from 'express';

// Gemini REST API endpoint for gemini-3.8-flash serverless execution
const GEMINI_API_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent';

/**
 * Serverless handler to scan clinic receipts and extract:
 * 1. Patient Name
 * 2. Clinic / Healthcare Provider
 * 3. After GST Amount
 * using direct serverless connection to Gemini REST API.
 */
export default async function handler(req: Request, res: Response) {
  // Support both POST requests and preflight checks
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({
        error: 'Missing imageBase64 in request body.',
      });
    }

    // Never hardcode API key. Read securely from serverless environment variables.
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error:
          'GEMINI_API_KEY environment variable is not configured. Please set GEMINI_API_KEY in your environment.',
      });
    }

    // Strip data URL scheme prefix if included
    const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');

    const prompt = `You are a medical receipt and tax invoice OCR specialist.
Extract the key healthcare and tax billing details from this receipt image:
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
      "category": "Consultation | Medication | Procedure | Diagnostic | Consumable | Other",
      "quantity": number,
      "unitPrice": number,
      "amount": number,
      "isGstApplicable": boolean
    }
  ]
}`;

    // Direct HTTP call to Google Gemini REST endpoint
    const response = await fetch(GEMINI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini REST API error response:', response.status, errorText);
      return res.status(response.status).json({
        error: `Gemini API returned status ${response.status}: ${errorText}`,
      });
    }

    const data = await response.json();

    // Extract text from Gemini candidates
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) {
      return res.status(500).json({
        error: 'No text content returned from Gemini model.',
      });
    }

    // Clean JSON string (remove possible markdown code blocks)
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
    return res.status(500).json({
      error: message,
    });
  }
}
