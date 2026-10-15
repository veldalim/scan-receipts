export interface ReceiptItem {
  id: string;
  description: string;
  category?: 'Consultation' | 'Medication' | 'Procedure' | 'Diagnostic' | 'Consumable' | 'Other';
  quantity?: number;
  unitPrice?: number;
  amount: number;
  isGstApplicable?: boolean;
}

export interface ExtractedReceiptData {
  // Key three user criteria
  patientName: string;
  clinicName: string;
  afterGstAmount: number;

  // Detailed medical & tax fields
  beforeGstAmount?: number;
  gstRate?: number; // e.g. 9%
  gstAmount?: number;
  currency: string;
  clinicAddress?: string;
  clinicPhone?: string;
  clinicGstRegNo?: string;
  receiptNumber?: string;
  date?: string; // YYYY-MM-DD
  time?: string;
  doctorName?: string;
  patientIdOrRef?: string;
  paymentMethod?: string;
  summary?: string;
  confidenceNotes?: string;
  items: ReceiptItem[];
}

export interface ScannedReceiptRecord {
  id: string;
  timestamp: number;
  imageUrl: string;
  fileName?: string;
  status: 'extracted' | 'verified';
  data: ExtractedReceiptData;
  notes?: string;
}
