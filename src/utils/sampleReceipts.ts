import { ExtractedReceiptData } from '../types';

export interface SampleReceiptOption {
  id: string;
  title: string;
  clinic: string;
  patient: string;
  totalAfterGst: number;
  currency: string;
  description: string;
  presetData: ExtractedReceiptData;
}

export const SAMPLE_RECEIPTS: SampleReceiptOption[] = [
  {
    id: 'sample-1',
    title: 'Family GP Clinic Visit',
    clinic: 'Healthway Medical Clinic (Rivervale)',
    patient: 'Tan Wei Ming',
    totalAfterGst: 103.55,
    currency: 'SGD',
    description: 'GP consultation, Amoxicillin antibiotic & cough mixture with 9% GST',
    presetData: {
      patientName: 'Tan Wei Ming',
      clinicName: 'Healthway Medical Clinic (Rivervale)',
      afterGstAmount: 103.55,
      beforeGstAmount: 95.0,
      gstRate: 9,
      gstAmount: 8.55,
      currency: 'SGD',
      clinicAddress: '11 Rivervale Crescent #01-08 Rivervale Mall, Singapore 545082',
      clinicPhone: '+65 6881 2288',
      clinicGstRegNo: 'M90374182L',
      receiptNumber: 'INV-2026-04192',
      date: '2026-10-12',
      time: '10:45 AM',
      doctorName: 'Dr. Michael Chen MBBS (S\'pore)',
      patientIdOrRef: 'SXXXX821A',
      paymentMethod: 'NETS / Contactless',
      summary: 'General Practice consultation for acute upper respiratory tract infection. Dispensed antibiotics and symptomatic medication.',
      confidenceNotes: 'High clarity digital tax invoice. Patient name, clinic header, and after GST grand total verified.',
      items: [
        {
          id: 'item-1',
          description: 'Standard GP Consultation (Day)',
          category: 'Consultation',
          quantity: 1,
          unitPrice: 45.0,
          amount: 45.0,
          isGstApplicable: true,
        },
        {
          id: 'item-2',
          description: 'Amoxicillin 500mg Caps (20s)',
          category: 'Medication',
          quantity: 1,
          unitPrice: 28.0,
          amount: 28.0,
          isGstApplicable: true,
        },
        {
          id: 'item-3',
          description: 'Promethazine Cough Linctus 120ml',
          category: 'Medication',
          quantity: 1,
          unitPrice: 22.0,
          amount: 22.0,
          isGstApplicable: true,
        },
      ],
    },
  },
  {
    id: 'sample-2',
    title: 'Specialist Medical Centre',
    clinic: 'Raffles Medical Specialist Centre',
    patient: 'Elena Koh Shu Ting',
    totalAfterGst: 261.6,
    currency: 'SGD',
    description: 'Specialist consultation & resting 12-lead ECG with 9% GST',
    presetData: {
      patientName: 'Elena Koh Shu Ting',
      clinicName: 'Raffles Medical Specialist Centre',
      afterGstAmount: 261.6,
      beforeGstAmount: 240.0,
      gstRate: 9,
      gstAmount: 21.6,
      currency: 'SGD',
      clinicAddress: '585 North Bridge Road, Raffles Hospital Level 2, Singapore 188770',
      clinicPhone: '+65 6311 1111',
      clinicGstRegNo: '198900332W',
      receiptNumber: 'RH-TX-883019',
      date: '2026-10-14',
      time: '14:20 PM',
      doctorName: 'Dr. Jeremy Lim FAMS (Cardiology)',
      patientIdOrRef: 'TXXXX419C',
      paymentMethod: 'VISA PayWave',
      summary: 'Specialist cardiovascular outpatient consultation and resting electrocardiogram (ECG) screening.',
      confidenceNotes: 'Hospital tax invoice format. Clear patient MRN, clinic GST registration and 9% tax breakdown.',
      items: [
        {
          id: 'item-1',
          description: 'Specialist Consultation - Senior Consultant',
          category: 'Consultation',
          quantity: 1,
          unitPrice: 160.0,
          amount: 160.0,
          isGstApplicable: true,
        },
        {
          id: 'item-2',
          description: 'Resting 12-Lead Electrocardiogram (ECG)',
          category: 'Diagnostic',
          quantity: 1,
          unitPrice: 80.0,
          amount: 80.0,
          isGstApplicable: true,
        },
      ],
    },
  },
  {
    id: 'sample-3',
    title: 'Dental Surgery & Aesthetics',
    clinic: 'Novena Dental Surgery & Aesthetic Centre',
    patient: 'Marcus Lee Zhi Hao',
    totalAfterGst: 152.6,
    currency: 'SGD',
    description: 'Dental examination, scaling & polishing + topical fluoride',
    presetData: {
      patientName: 'Marcus Lee Zhi Hao',
      clinicName: 'Novena Dental Surgery & Aesthetic Centre',
      afterGstAmount: 152.6,
      beforeGstAmount: 140.0,
      gstRate: 9,
      gstAmount: 12.6,
      currency: 'SGD',
      clinicAddress: '10 Sinaran Drive, #09-15 Novena Medical Center, Singapore 307506',
      clinicPhone: '+65 6397 7000',
      clinicGstRegNo: '201509123D',
      receiptNumber: 'NDS-REC-5021',
      date: '2026-10-09',
      time: '11:15 AM',
      doctorName: 'Dr. Clarissa Goh BDS (Singapore)',
      patientIdOrRef: 'SXXXX991F',
      paymentMethod: 'PayNow QR (Instant)',
      summary: 'Routine 6-month preventive dental check-up, ultrasonic scaling, airflow polishing, and topical fluoride varnish.',
      confidenceNotes: 'Dental clinical receipt. Complete itemized fees and post-tax settlement identified.',
      items: [
        {
          id: 'item-1',
          description: 'Comprehensive Oral Examination & Charting',
          category: 'Procedure',
          quantity: 1,
          unitPrice: 40.0,
          amount: 40.0,
          isGstApplicable: true,
        },
        {
          id: 'item-2',
          description: 'Ultrasonic Scaling & Airflow Stain Removal',
          category: 'Procedure',
          quantity: 1,
          unitPrice: 80.0,
          amount: 80.0,
          isGstApplicable: true,
        },
        {
          id: 'item-3',
          description: 'Topical High-Potency Fluoride Treatment',
          category: 'Medication',
          quantity: 1,
          unitPrice: 20.0,
          amount: 20.0,
          isGstApplicable: true,
        },
      ],
    },
  },
];

/**
 * Generates an authentic thermal clinic receipt bitmap on an offscreen HTML5 canvas
 * and returns it as a data URL (image/png).
 */
export function generateSampleReceiptImage(preset: SampleReceiptOption): string {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 880;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - realistic off-white paper with slight subtle texture
  ctx.fillStyle = '#fbfbfa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border & subtle paper crease shadow
  ctx.strokeStyle = '#e2e2de';
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

  // Decorative top receipt serration pattern
  ctx.fillStyle = '#f0f0eb';
  for (let x = 16; x < canvas.width - 16; x += 16) {
    ctx.beginPath();
    ctx.arc(x + 8, 8, 4, 0, Math.PI);
    ctx.fill();
  }

  // Clinic Header
  ctx.textAlign = 'center';
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 20px "Courier New", Courier, monospace';
  ctx.fillText(preset.presetData.clinicName.toUpperCase(), 320, 52);

  ctx.font = '12px "Courier New", Courier, monospace';
  ctx.fillStyle = '#4b5563';
  ctx.fillText(preset.presetData.clinicAddress || '', 320, 74);
  ctx.fillText(`Tel: ${preset.presetData.clinicPhone || ''} | GST Reg: ${preset.presetData.clinicGstRegNo || ''}`, 320, 92);

  // Receipt divider line
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#9ca3af';
  ctx.beginPath();
  ctx.moveTo(30, 110);
  ctx.lineTo(610, 110);
  ctx.stroke();
  ctx.setLineDash([]);

  // Title: TAX INVOICE / OFFICIAL RECEIPT
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 15px "Courier New", Courier, monospace';
  ctx.fillText('*** TAX INVOICE & OFFICIAL RECEIPT ***', 320, 134);

  // Metadata Block
  ctx.textAlign = 'left';
  ctx.font = '13px "Courier New", Courier, monospace';
  ctx.fillStyle = '#1f2937';

  let y = 165;
  const leftCol = 40;
  const rightCol = 360;

  ctx.fillText(`Receipt No: ${preset.presetData.receiptNumber}`, leftCol, y);
  ctx.fillText(`Date: ${preset.presetData.date} ${preset.presetData.time}`, rightCol, y);

  y += 24;
  ctx.font = 'bold 14px "Courier New", Courier, monospace';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`PATIENT: ${preset.presetData.patientName.toUpperCase()}`, leftCol, y);
  ctx.font = '13px "Courier New", Courier, monospace';
  ctx.fillStyle = '#1f2937';
  ctx.fillText(`ID/NRIC: ${preset.presetData.patientIdOrRef}`, rightCol, y);

  y += 22;
  ctx.fillText(`Doctor: ${preset.presetData.doctorName || 'Dr. On Duty'}`, leftCol, y);
  ctx.fillText(`Payment: ${preset.presetData.paymentMethod}`, rightCol, y);

  // Table header divider
  y += 18;
  ctx.setLineDash([2, 2]);
  ctx.strokeStyle = '#9ca3af';
  ctx.beginPath();
  ctx.moveTo(40, y);
  ctx.lineTo(600, y);
  ctx.stroke();
  ctx.setLineDash([]);

  y += 20;
  ctx.font = 'bold 13px "Courier New", Courier, monospace';
  ctx.fillText('ITEM / DESCRIPTION', 40, y);
  ctx.textAlign = 'right';
  ctx.fillText('QTY', 430, y);
  ctx.fillText('PRICE', 500, y);
  ctx.fillText('AMT ($)', 600, y);

  // Table items
  ctx.font = '13px "Courier New", Courier, monospace';
  preset.presetData.items.forEach((item) => {
    y += 26;
    ctx.textAlign = 'left';
    ctx.fillText(item.description, 40, y);
    ctx.textAlign = 'right';
    ctx.fillText(String(item.quantity || 1), 430, y);
    ctx.fillText((item.unitPrice || item.amount).toFixed(2), 500, y);
    ctx.fillText(item.amount.toFixed(2), 600, y);
  });

  // Divider
  y += 24;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(40, y);
  ctx.lineTo(600, y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Subtotal & GST Calculations
  y += 24;
  ctx.textAlign = 'left';
  ctx.font = '13px "Courier New", Courier, monospace';
  ctx.fillText('Subtotal (Before GST):', 300, y);
  ctx.textAlign = 'right';
  ctx.fillText(`${preset.currency} ${(preset.presetData.beforeGstAmount || 0).toFixed(2)}`, 600, y);

  y += 22;
  ctx.textAlign = 'left';
  ctx.fillText(`GST (${preset.presetData.gstRate || 9}% Included):`, 300, y);
  ctx.textAlign = 'right';
  ctx.fillText(`${preset.currency} ${(preset.presetData.gstAmount || 0).toFixed(2)}`, 600, y);

  // Prominent AFTER GST AMOUNT BOX
  y += 28;
  ctx.fillStyle = '#047857';
  ctx.fillRect(280, y - 20, 325, 38);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px "Courier New", Courier, monospace';
  ctx.textAlign = 'left';
  ctx.fillText('TOTAL (AFTER GST):', 294, y + 4);
  ctx.textAlign = 'right';
  ctx.font = 'bold 17px "Courier New", Courier, monospace';
  ctx.fillText(`${preset.currency} ${preset.presetData.afterGstAmount.toFixed(2)}`, 592, y + 5);

  // Stamp / Barcode / Verification footer
  y += 65;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#065f46';
  ctx.font = 'bold 13px "Courier New", Courier, monospace';
  ctx.fillText('PAID IN FULL - THANK YOU', 320, y);

  // Simulated Barcode
  y += 24;
  const barcodeStart = 160;
  ctx.fillStyle = '#111827';
  for (let i = 0; i < 60; i++) {
    const barWidth = (i % 3 === 0 ? 3 : (i % 2 === 0 ? 1.5 : 2.5));
    const posX = barcodeStart + (i * 5.2);
    ctx.fillRect(posX, y, barWidth, 34);
  }

  y += 48;
  ctx.font = '11px "Courier New", Courier, monospace';
  ctx.fillStyle = '#6b7280';
  ctx.fillText(`* ${preset.presetData.receiptNumber} *`, 320, y);

  y += 18;
  ctx.fillText('Retain this tax invoice receipt for insurance or claims purposes.', 320, y);

  return canvas.toDataURL('image/png');
}
