import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ScannedReceiptRecord, ExtractedReceiptData } from '../types';

/**
 * Generates an executive single-receipt Medical Expense & Tax Summary PDF report.
 */
export function generateSingleReceiptPdf(record: ScannedReceiptRecord): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const { data, imageUrl } = record;
  const currency = data.currency || 'SGD';

  // Palette
  const primaryColor = [15, 76, 129]; // Medical Slate Blue
  const accentEmerald = [5, 150, 105]; // Emerald highlight for Total After GST
  const darkSlate = [30, 41, 59];
  const lightGrey = [241, 245, 249];
  const mutedText = [100, 116, 139];

  // Header Bar
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('MEDISCAN CLAIM SUMMARY REPORT', 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 196, 15, { align: 'right' });

  // Document Sub-banner
  let curY = 32;

  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Medical & Clinic Tax Invoice Summary', 14, curY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text(`Report Ref: CLAIM-${record.id.slice(0, 8).toUpperCase()} | Receipt No: ${data.receiptNumber || 'N/A'}`, 14, curY + 5);

  curY += 12;

  // KEY IDENTIFICATION CALLOUT BOXES (The 3 main user priorities: Patient Name, Clinic, After GST Amount)
  const cardWidth = 58;
  const cardHeight = 28;
  const cardY = curY;

  // 1. Patient Name Card
  doc.setFillColor(lightGrey[0], lightGrey[1], lightGrey[2]);
  doc.roundedRect(14, cardY, cardWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, cardY, cardWidth, cardHeight, 2, 2, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('PATIENT NAME', 18, cardY + 7);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  const patientLines = doc.splitTextToSize(data.patientName || 'Not Stated', cardWidth - 8);
  doc.text(patientLines, 18, cardY + 15);

  if (data.patientIdOrRef) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
    doc.text(`ID: ${data.patientIdOrRef}`, 18, cardY + 23);
  }

  // 2. Clinic Name Card
  const col2X = 14 + cardWidth + 5;
  doc.setFillColor(lightGrey[0], lightGrey[1], lightGrey[2]);
  doc.roundedRect(col2X, cardY, cardWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(col2X, cardY, cardWidth, cardHeight, 2, 2, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('CLINIC / HEALTHCARE PROVIDER', col2X + 4, cardY + 7);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  const clinicLines = doc.splitTextToSize(data.clinicName || 'Not Stated', cardWidth - 8);
  doc.text(clinicLines, col2X + 4, cardY + 14);

  if (data.clinicGstRegNo) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
    doc.text(`GST: ${data.clinicGstRegNo}`, col2X + 4, cardY + 24);
  }

  // 3. After GST Amount Card (Prominent Highlight)
  const col3X = col2X + cardWidth + 5;
  doc.setFillColor(236, 253, 245); // light emerald
  doc.roundedRect(col3X, cardY, cardWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(accentEmerald[0], accentEmerald[1], accentEmerald[2]);
  doc.setLineWidth(0.6);
  doc.roundedRect(col3X, cardY, cardWidth, cardHeight, 2, 2, 'S');
  doc.setLineWidth(0.2);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accentEmerald[0], accentEmerald[1], accentEmerald[2]);
  doc.text('TOTAL AMOUNT (AFTER GST)', col3X + 4, cardY + 7);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(4, 120, 87);
  doc.text(`${currency} ${(data.afterGstAmount || 0).toFixed(2)}`, col3X + 4, cardY + 16);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  const gstDetail = data.gstRate ? `Incl. ${data.gstRate}% GST (${currency} ${(data.gstAmount || 0).toFixed(2)})` : 'GST Included';
  doc.text(gstDetail, col3X + 4, cardY + 23);

  curY = cardY + cardHeight + 8;

  // Metadata Grid Table (Visit Date, Doctor, Payment Method, UEN)
  const metaBody = [
    [
      { content: 'Date of Visit:', styles: { fontStyle: 'bold' as const } },
      data.date ? `${data.date} ${data.time || ''}` : 'N/A',
      { content: 'Tax Invoice / Receipt #:', styles: { fontStyle: 'bold' as const } },
      data.receiptNumber || 'N/A',
    ],
    [
      { content: 'Attending Doctor:', styles: { fontStyle: 'bold' as const } },
      data.doctorName || 'General Practitioner',
      { content: 'Payment Mode:', styles: { fontStyle: 'bold' as const } },
      data.paymentMethod || 'Settled in Full',
    ],
    [
      { content: 'Clinic Address:', styles: { fontStyle: 'bold' as const } },
      data.clinicAddress || 'Refer to scanned receipt',
      { content: 'Clinic Contact:', styles: { fontStyle: 'bold' as const } },
      data.clinicPhone || 'N/A',
    ],
  ];

  autoTable(doc, {
    startY: curY,
    body: metaBody,
    theme: 'plain',
    styles: {
      fontSize: 8.5,
      cellPadding: 1.6,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 32, textColor: [15, 23, 42] },
      1: { cellWidth: 64 },
      2: { cellWidth: 42, textColor: [15, 23, 42] },
      3: { cellWidth: 54 },
    },
    margin: { left: 14, right: 14 },
  });

  const lastTableInfo = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable;
  curY = (lastTableInfo ? lastTableInfo.finalY : curY + 24) + 6;

  // Line items section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('Itemized Consultation, Procedures & Medication Breakdown', 14, curY);

  curY += 2;

  // Prepare table data
  const tableRows = (data.items && data.items.length > 0)
    ? data.items.map((item, idx) => [
        String(idx + 1),
        item.description,
        item.category || 'General',
        String(item.quantity || 1),
        `${currency} ${(item.unitPrice || item.amount).toFixed(2)}`,
        `${currency} ${item.amount.toFixed(2)}`,
      ])
    : [
        ['1', 'Medical Services & Dispensed Medication (Consolidated)', 'Medical', '1', `${currency} ${(data.beforeGstAmount || data.afterGstAmount).toFixed(2)}`, `${currency} ${(data.beforeGstAmount || data.afterGstAmount).toFixed(2)}`],
      ];

  autoTable(doc, {
    startY: curY,
    head: [['#', 'Item / Service Description', 'Category', 'Qty', 'Unit Price', 'Amount']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor as [number, number, number],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 26 },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 26, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  const afterItemsTable = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable;
  curY = (afterItemsTable ? afterItemsTable.finalY : curY + 30) + 4;

  // Financial Summary Box (Right aligned)
  const summaryBoxWidth = 84;
  const summaryBoxX = 210 - 14 - summaryBoxWidth;

  const financialRows = [
    ['Subtotal (Before GST):', `${currency} ${(data.beforeGstAmount ?? (data.afterGstAmount - (data.gstAmount || 0))).toFixed(2)}`],
    [`Goods & Services Tax (GST ${data.gstRate ? `${data.gstRate}%` : ''}):`, `${currency} ${(data.gstAmount ?? (data.afterGstAmount - (data.beforeGstAmount || 0))).toFixed(2)}`],
    ['TOTAL AMOUNT (AFTER GST):', `${currency} ${(data.afterGstAmount || 0).toFixed(2)}`],
  ];

  autoTable(doc, {
    startY: curY,
    body: financialRows,
    theme: 'plain',
    margin: { left: summaryBoxX, right: 14 },
    styles: {
      fontSize: 8.5,
      cellPadding: 1.8,
    },
    columnStyles: {
      0: { cellWidth: 50, halign: 'left' },
      1: { cellWidth: 34, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (dataCell) => {
      if (dataCell.row.index === 2) {
        dataCell.cell.styles.fillColor = [236, 253, 245];
        dataCell.cell.styles.textColor = [4, 120, 87];
        dataCell.cell.styles.fontSize = 9.5;
        dataCell.cell.styles.fontStyle = 'bold';
      }
    },
  });

  const afterFinTable = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable;
  curY = (afterFinTable ? afterFinTable.finalY : curY + 25) + 6;

  // Visit Summary / Clinical Notes
  if (data.summary) {
    doc.setFillColor(lightGrey[0], lightGrey[1], lightGrey[2]);
    doc.roundedRect(14, curY, 182, 16, 1.5, 1.5, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
    doc.text('VISIT SUMMARY & CLINICAL NOTES:', 18, curY + 5);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    const summaryLines = doc.splitTextToSize(data.summary, 174);
    doc.text(summaryLines, 18, curY + 10);

    curY += 20;
  }

  // Claim Certification Sign-off Section
  doc.setDrawColor(226, 232, 240);
  doc.line(14, curY, 196, curY);
  curY += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('VERIFICATION & CLAIM DECLARATION', 14, curY);

  curY += 4;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('I hereby certify that the above expenses were incurred for official medical consultation and treatment as billed by the healthcare provider.', 14, curY);

  curY += 12;
  // Sign-off lines
  doc.line(14, curY, 80, curY);
  doc.line(130, curY, 196, curY);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Patient / Claimant Signature (${data.patientName || 'Claimant'})`, 14, curY + 4);
  doc.text('HR / Insurer / Approving Officer Stamp & Date', 130, curY + 4);

  // If receipt image is available, add Page 2 with Scanned Receipt Image attachment
  if (imageUrl) {
    doc.addPage();

    // Page 2 Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 16, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('APPENDIX: ORIGINAL SCANNED CLINIC RECEIPT ATTACHMENT', 14, 11);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Receipt Ref: ${data.receiptNumber || 'N/A'} | Patient: ${data.patientName || 'N/A'}`, 196, 11, { align: 'right' });

    // Details summary strip
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 22, 182, 12, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, 22, 182, 12, 'S');

    doc.setFontSize(8);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`Clinic: ${data.clinicName}  |  Total After GST: ${currency} ${(data.afterGstAmount || 0).toFixed(2)}  |  Date: ${data.date || 'N/A'}`, 18, 30);

    // Embed scanned receipt image safely
    try {
      doc.addImage(imageUrl, 'PNG', 20, 38, 170, 235, undefined, 'FAST');
    } catch {
      // In case image format needs JPEG or fallback
      try {
        doc.addImage(imageUrl, 'JPEG', 20, 38, 170, 235, undefined, 'FAST');
      } catch (imgErr) {
        console.warn('Could not embed raw receipt image onto PDF page 2:', imgErr);
        doc.setTextColor(150, 0, 0);
        doc.text('Image attachment preview unavailable or format unsupported.', 20, 60);
      }
    }
  }

  return doc;
}

/**
 * Generates an aggregated Multi-Receipt Consolidated Claims Summary Report PDF.
 */
export function generateConsolidatedClaimsPdf(records: ScannedReceiptRecord[]): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [15, 76, 129];
  const accentEmerald = [5, 150, 105];
  const darkSlate = [30, 41, 59];
  const mutedText = [100, 116, 139];

  // Top banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('CONSOLIDATED MEDICAL CLAIMS SUMMARY', 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 196, 15, { align: 'right' });

  let curY = 32;

  // Header Title
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('Aggregated Healthcare & GST Expense Schedule', 14, curY);

  curY += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text(`Total Scanned Receipts: ${records.length}  |  Audited Tax Invoice Records`, 14, curY);

  curY += 8;

  // Compute Grand Totals
  const totalAfterGst = records.reduce((sum, r) => sum + (r.data.afterGstAmount || 0), 0);
  const totalBeforeGst = records.reduce((sum, r) => sum + (r.data.beforeGstAmount || (r.data.afterGstAmount - (r.data.gstAmount || 0))), 0);
  const totalGst = records.reduce((sum, r) => sum + (r.data.gstAmount || (r.data.afterGstAmount - (r.data.beforeGstAmount || 0))), 0);
  const currency = records[0]?.data.currency || 'SGD';

  // 3 Summary Cards
  const cardW = 58;
  const cardH = 22;

  // 1. Total Claims
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, curY, cardW, cardH, 2, 2, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('RECEIPTS AUDITED', 18, curY + 6);
  doc.setFontSize(13);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(`${records.length} Invoices`, 18, curY + 15);

  // 2. Total GST Paid
  const card2X = 14 + cardW + 5;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(card2X, curY, cardW, cardH, 2, 2, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('TOTAL GST PAID', card2X + 4, curY + 6);
  doc.setFontSize(13);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(`${currency} ${totalGst.toFixed(2)}`, card2X + 4, curY + 15);

  // 3. Total After GST (Grand Total)
  const card3X = card2X + cardW + 5;
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(card3X, curY, cardW, cardH, 2, 2, 'F');
  doc.setDrawColor(accentEmerald[0], accentEmerald[1], accentEmerald[2]);
  doc.roundedRect(card3X, curY, cardW, cardH, 2, 2, 'S');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accentEmerald[0], accentEmerald[1], accentEmerald[2]);
  doc.text('TOTAL REIMBURSEMENT (AFTER GST)', card3X + 4, curY + 6);
  doc.setFontSize(14);
  doc.setTextColor(4, 120, 87);
  doc.text(`${currency} ${totalAfterGst.toFixed(2)}`, card3X + 4, curY + 16);

  curY += cardH + 8;

  // Master Table of Receipts
  const tableRows = records.map((rec, index) => [
    String(index + 1),
    rec.data.date || 'N/A',
    rec.data.patientName || 'N/A',
    rec.data.clinicName || 'N/A',
    rec.data.receiptNumber || 'N/A',
    `${rec.data.currency || currency} ${(rec.data.gstAmount || 0).toFixed(2)}`,
    `${rec.data.currency || currency} ${(rec.data.afterGstAmount || 0).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: curY,
    head: [['#', 'Date', 'Patient Name', 'Clinic / Provider', 'Receipt #', 'GST', 'After GST Total']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor as [number, number, number],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20 },
      2: { cellWidth: 38 },
      3: { cellWidth: 50 },
      4: { cellWidth: 26 },
      5: { cellWidth: 18, halign: 'right' },
      6: { cellWidth: 24, halign: 'right', fontStyle: 'bold', textColor: [4, 120, 87] },
    },
    margin: { left: 14, right: 14 },
  });

  const lastTable = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable;
  curY = (lastTable ? lastTable.finalY : curY + 40) + 12;

  // Certification section
  doc.setDrawColor(226, 232, 240);
  doc.line(14, curY, 196, curY);
  curY += 6;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('CONSOLIDATED DECLARATION & HR SUBMISSION', 14, curY);

  curY += 15;
  doc.line(14, curY, 80, curY);
  doc.line(130, curY, 196, curY);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Claimant Signature & Date', 14, curY + 4);
  doc.text('Finance / Payroll Approval Signature & Date', 130, curY + 4);

  return doc;
}
