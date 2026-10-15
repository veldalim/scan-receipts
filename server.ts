import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Support image payloads up to 30MB
  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));

  // Initialize Gemini client on server side with User-Agent header
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // Scan Medical / Clinic Receipt endpoint
  app.post('/api/scan-receipt', async (req: Request, res: Response) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg' } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: 'Image data (imageBase64) is required.' });
      }

      // Clean base64 string if data url prefix is present
      const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY is not configured on the server. Please verify your environment.',
        });
      }

      const prompt = `You are a medical receipt and clinic tax invoice OCR extraction specialist.
Analyze this medical / clinic receipt image in detail.
Extract the key healthcare and tax invoice information with high precision:
1. Patient Name: Full name of the patient (individual receiving treatment or billed).
2. Clinic / Healthcare Provider Name: The medical clinic, dental clinic, hospital, or specialist center.
3. After GST Amount: The final total payable amount INCLUDING Goods and Services Tax (GST / VAT). This is the grand total billed or paid.
4. Before GST Amount: The subtotal before tax is applied.
5. GST Rate: The GST percentage (e.g. 9 for 9%, 8 for 8%, 7 for 7%).
6. GST Amount: The exact tax amount in dollars/cents.
7. Currency: Detect the currency (e.g., SGD, $, AUD, USD, MYR, GBP, EUR). Default to 'SGD' if in Singapore format (e.g. 9% GST, UEN).
8. Clinic Details: Address, Contact Phone, GST Registration Number / UEN (Business Registration number).
9. Invoice / Receipt Metadata: Tax invoice / Receipt number, Date (YYYY-MM-DD), Time of visit.
10. Attending Doctor / Physician: Name of the doctor if printed (e.g. Dr. Tan).
11. Patient Identification: Patient ID, MRN, or masked NRIC/ID if present.
12. Payment Method: Cash, Credit Card, NETS, PayNow, Medisave, Insurance, etc.
13. Line Items: All itemized lines (consultation, medications, diagnostic tests, treatments) with item description, category, quantity, unit price, and line amount.

Be accurate with names and figures. Do not guess or fabricate information. If a field is not found in the image, return empty string or null.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              patientName: {
                type: Type.STRING,
                description: 'Full name of the patient on the receipt',
              },
              clinicName: {
                type: Type.STRING,
                description: 'Name of the clinic, medical centre, or healthcare provider',
              },
              afterGstAmount: {
                type: Type.NUMBER,
                description: 'Total payable amount after GST / Tax',
              },
              beforeGstAmount: {
                type: Type.NUMBER,
                description: 'Subtotal amount before GST is applied',
              },
              gstRate: {
                type: Type.NUMBER,
                description: 'GST tax rate in percentage (e.g., 9 for 9%)',
              },
              gstAmount: {
                type: Type.NUMBER,
                description: 'Total GST dollar amount charged',
              },
              currency: {
                type: Type.STRING,
                description: 'Currency code or symbol, e.g. SGD, $, AUD, USD, MYR',
              },
              clinicAddress: {
                type: Type.STRING,
                description: 'Physical address of the clinic',
              },
              clinicPhone: {
                type: Type.STRING,
                description: 'Phone number of the clinic',
              },
              clinicGstRegNo: {
                type: Type.STRING,
                description: 'GST registration number or UEN of the clinic',
              },
              receiptNumber: {
                type: Type.STRING,
                description: 'Tax Invoice or Receipt Number',
              },
              date: {
                type: Type.STRING,
                description: 'Date of visit/receipt in YYYY-MM-DD format',
              },
              time: {
                type: Type.STRING,
                description: 'Time of visit/receipt (e.g. 14:30)',
              },
              doctorName: {
                type: Type.STRING,
                description: 'Name of the attending doctor or physician',
              },
              patientIdOrRef: {
                type: Type.STRING,
                description: 'Patient ID, MRN, or masked identification number',
              },
              paymentMethod: {
                type: Type.STRING,
                description: 'Payment method used (e.g., NETS, VISA, Cash, PayNow)',
              },
              summary: {
                type: Type.STRING,
                description: 'Short summary of the medical consultation and medications',
              },
              confidenceNotes: {
                type: Type.STRING,
                description: 'Brief notes on text clarity or verification observations',
              },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    description: { type: Type.STRING },
                    category: {
                      type: Type.STRING,
                      description: 'Category such as Consultation, Medication, Diagnostic, Procedure, or Consumable',
                    },
                    quantity: { type: Type.NUMBER },
                    unitPrice: { type: Type.NUMBER },
                    amount: { type: Type.NUMBER },
                    isGstApplicable: { type: Type.BOOLEAN },
                  },
                  required: ['description', 'amount'],
                },
              },
            },
            required: ['patientName', 'clinicName', 'afterGstAmount'],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        return res.status(500).json({ error: 'Empty response returned from AI analysis.' });
      }

      const parsedData = JSON.parse(responseText);

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (err: unknown) {
      console.error('Error scanning receipt with Gemini:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to scan receipt';
      return res.status(500).json({
        error: errorMessage,
      });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MediScan Server] running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
