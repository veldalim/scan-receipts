import React, { useState } from 'react';
import {
  FileText,
  Download,
  Eye,
  CheckCircle,
  Plus,
  Trash2,
  Calendar,
  Building2,
  User,
  DollarSign,
  Receipt,
  Stethoscope,
  CreditCard,
  ZoomIn,
  RefreshCw,
  ExternalLink,
  Percent,
} from 'lucide-react';
import { ExtractedReceiptData, ReceiptItem, ScannedReceiptRecord } from '../types';
import { generateSingleReceiptPdf } from '../utils/pdfGenerator';
import { PdfPreviewModal } from './PdfPreviewModal';

interface ReceiptDetailsEditorProps {
  receiptRecord: ScannedReceiptRecord;
  onUpdateRecord: (updated: ScannedReceiptRecord) => void;
  onScanAnother: () => void;
  onSaveToClaims: () => void;
}

export const ReceiptDetailsEditor: React.FC<ReceiptDetailsEditorProps> = ({
  receiptRecord,
  onUpdateRecord,
  onScanAnother,
  onSaveToClaims,
}) => {
  const [data, setData] = useState<ExtractedReceiptData>(receiptRecord.data);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'items' | 'notes'>('editor');
  const [isSaved, setIsSaved] = useState(false);

  // Auto recalculate GST amounts if afterGstAmount or beforeGstAmount or gstRate changes
  const handleFieldChange = <K extends keyof ExtractedReceiptData>(
    field: K,
    value: ExtractedReceiptData[K]
  ) => {
    const updated = { ...data, [field]: value };

    // Auto calculate if rates and totals are provided
    if (field === 'afterGstAmount') {
      const numAfter = Number(value) || 0;
      const rate = updated.gstRate || 9;
      // after = before * (1 + rate/100) => before = after / (1 + rate/100)
      const calculatedBefore = Number((numAfter / (1 + rate / 100)).toFixed(2));
      const calculatedGst = Number((numAfter - calculatedBefore).toFixed(2));
      updated.beforeGstAmount = calculatedBefore;
      updated.gstAmount = calculatedGst;
    } else if (field === 'beforeGstAmount') {
      const numBefore = Number(value) || 0;
      const rate = updated.gstRate || 9;
      const calculatedGst = Number((numBefore * (rate / 100)).toFixed(2));
      const calculatedAfter = Number((numBefore + calculatedGst).toFixed(2));
      updated.gstAmount = calculatedGst;
      updated.afterGstAmount = calculatedAfter;
    } else if (field === 'gstRate') {
      const rate = Number(value) || 0;
      if (updated.beforeGstAmount) {
        const calculatedGst = Number((updated.beforeGstAmount * (rate / 100)).toFixed(2));
        updated.gstAmount = calculatedGst;
        updated.afterGstAmount = Number((updated.beforeGstAmount + calculatedGst).toFixed(2));
      }
    }

    setData(updated);
    onUpdateRecord({
      ...receiptRecord,
      data: updated,
    });
    setIsSaved(false);
  };

  const handleItemChange = (index: number, key: keyof ReceiptItem, val: string | number | boolean) => {
    const newItems = [...(data.items || [])];
    newItems[index] = { ...newItems[index], [key]: val };

    // Recalculate item amount if qty or unitPrice changed
    if (key === 'quantity' || key === 'unitPrice') {
      const qty = key === 'quantity' ? Number(val) : (newItems[index].quantity || 1);
      const price = key === 'unitPrice' ? Number(val) : (newItems[index].unitPrice || newItems[index].amount);
      newItems[index].amount = Number((qty * price).toFixed(2));
    }

    const updated = { ...data, items: newItems };
    setData(updated);
    onUpdateRecord({
      ...receiptRecord,
      data: updated,
    });
    setIsSaved(false);
  };

  const addItem = () => {
    const newItem: ReceiptItem = {
      id: `item-${Date.now()}`,
      description: 'New Consultation / Service / Medication',
      category: 'Consultation',
      quantity: 1,
      unitPrice: 30.0,
      amount: 30.0,
      isGstApplicable: true,
    };
    const updated = { ...data, items: [...(data.items || []), newItem] };
    setData(updated);
    onUpdateRecord({
      ...receiptRecord,
      data: updated,
    });
  };

  const removeItem = (index: number) => {
    const newItems = [...(data.items || [])];
    newItems.splice(index, 1);
    const updated = { ...data, items: newItems };
    setData(updated);
    onUpdateRecord({
      ...receiptRecord,
      data: updated,
    });
  };

  const handleDownloadPdf = () => {
    const doc = generateSingleReceiptPdf({
      ...receiptRecord,
      data,
    });
    const filename = `MediScan_${(data.patientName || 'Patient').replace(/\s+/g, '_')}_${(data.clinicName || 'Clinic').slice(0, 15).replace(/\s+/g, '_')}_${data.date || 'Receipt'}.pdf`;
    doc.save(filename);
  };

  const handleSaveClaim = () => {
    onSaveToClaims();
    setIsSaved(true);
  };

  const currentPdfDoc = generateSingleReceiptPdf({
    ...receiptRecord,
    data,
  });

  return (
    <div className="w-full space-y-6">
      {/* Top Banner with 3 Key Extracted Entities (User Prompt Core Requirements) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <CheckCircle className="w-3.5 h-3.5" />
                OCR Extraction Complete
              </span>
              <span className="text-xs text-slate-400">
                Receipt #{data.receiptNumber || 'N/A'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Scanned Clinic Receipt Summary
            </h2>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-slate-600" />
              Preview PDF
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download PDF Summary
            </button>

            <button
              type="button"
              onClick={handleSaveClaim}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
                isSaved
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              {isSaved ? 'Saved to Claims' : 'Save to Claims'}
            </button>

            <button
              type="button"
              onClick={onScanAnother}
              className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Scan Another
            </button>
          </div>
        </div>

        {/* 3 Prominent User-Identified Highlight Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Patient Name */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 relative overflow-hidden group">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              Patient Name
            </div>
            <p className="text-lg font-bold text-slate-900 truncate">
              {data.patientName || 'Not Stated'}
            </p>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
              <span>Ref / ID: <span className="font-medium text-slate-700">{data.patientIdOrRef || 'Standard'}</span></span>
              <span className="text-[11px] text-blue-600 font-medium">Verified</span>
            </div>
          </div>

          {/* 2. Clinic Name */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 relative overflow-hidden group">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-600" />
              Clinic / Healthcare Provider
            </div>
            <p className="text-lg font-bold text-slate-900 truncate">
              {data.clinicName || 'Not Stated'}
            </p>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
              <span>GST UEN: <span className="font-mono font-medium text-slate-700">{data.clinicGstRegNo || 'N/A'}</span></span>
              <span className="text-[11px] text-purple-600 font-medium truncate max-w-[120px]">{data.receiptNumber || 'Tax Invoice'}</span>
            </div>
          </div>

          {/* 3. After GST Amount (Super Prominent) */}
          <div className="bg-linear-to-br from-emerald-500 to-emerald-700 text-white rounded-2xl p-4.5 shadow-md shadow-emerald-600/15 relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold tracking-wider uppercase text-emerald-100 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-200" />
                Total (After GST)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                Final Payable
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {data.currency} {(data.afterGstAmount || 0).toFixed(2)}
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-100 mt-2 pt-2 border-t border-emerald-400/40 font-medium">
              <span>Pre-GST: {data.currency} {(data.beforeGstAmount || 0).toFixed(2)}</span>
              <span>GST ({data.gstRate || 9}%): {data.currency} {(data.gstAmount || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column View: Receipt Visual on Left, Detailed Fields & Items on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Scanned Receipt Snapshot (5 columns) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-800">Scanned Receipt Proof</h3>
            </div>
            <a
              href={receiptRecord.imageUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
            >
              Open Full Image <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex-1 bg-slate-900/5 rounded-2xl overflow-hidden flex items-center justify-center p-2 min-h-[420px] max-h-[640px] border border-slate-200/60">
            <img
              src={receiptRecord.imageUrl}
              alt="Scanned Clinic Receipt"
              className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
            />
          </div>

          <p className="text-[11px] text-slate-400 text-center mt-3">
            This scanned image will be automatically attached as Appendix Page 2 in the generated PDF summary report.
          </p>
        </div>

        {/* Right: Data Verification & Detailed Form (7 columns) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-5">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Core Tax & Clinical Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('items')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'items'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Itemized Charges ({data.items?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'notes'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Clinical Summary & Notes
            </button>
          </div>

          {/* TAB 1: Core Tax & Clinical Details */}
          {activeTab === 'editor' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Patient Name input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Patient Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={data.patientName || ''}
                      onChange={(e) => handleFieldChange('patientName', e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium text-slate-900"
                      placeholder="e.g. Tan Wei Ming"
                    />
                  </div>
                </div>

                {/* Patient ID / MRN */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Patient ID / NRIC / MRN
                  </label>
                  <input
                    type="text"
                    value={data.patientIdOrRef || ''}
                    onChange={(e) => handleFieldChange('patientIdOrRef', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900"
                    placeholder="e.g. SXXXX821A"
                  />
                </div>

                {/* Clinic Name input */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Clinic / Healthcare Provider Name *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={data.clinicName || ''}
                      onChange={(e) => handleFieldChange('clinicName', e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium text-slate-900"
                      placeholder="e.g. Healthway Medical Clinic"
                    />
                  </div>
                </div>

                {/* Clinic GST Reg No / UEN */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Clinic GST Reg No / Tax UEN
                  </label>
                  <input
                    type="text"
                    value={data.clinicGstRegNo || ''}
                    onChange={(e) => handleFieldChange('clinicGstRegNo', e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:outline-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900"
                    placeholder="e.g. M90374182L"
                  />
                </div>

                {/* Tax Invoice / Receipt Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tax Invoice / Receipt No.
                  </label>
                  <input
                    type="text"
                    value={data.receiptNumber || ''}
                    onChange={(e) => handleFieldChange('receiptNumber', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono text-slate-900"
                    placeholder="e.g. INV-2026-04192"
                  />
                </div>

                {/* Date of Visit */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date of Visit
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="date"
                      value={data.date || ''}
                      onChange={(e) => handleFieldChange('date', e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900"
                    />
                  </div>
                </div>

                {/* Attending Doctor */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Attending Doctor / Physician
                  </label>
                  <div className="relative">
                    <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={data.doctorName || ''}
                      onChange={(e) => handleFieldChange('doctorName', e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900"
                      placeholder="e.g. Dr. Michael Chen"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={data.paymentMethod || ''}
                      onChange={(e) => handleFieldChange('paymentMethod', e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900"
                      placeholder="e.g. NETS / Credit Card / Cash"
                    />
                  </div>
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={data.currency || 'SGD'}
                    onChange={(e) => handleFieldChange('currency', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900 bg-white"
                  >
                    <option value="SGD">SGD (S$ - Singapore Dollar)</option>
                    <option value="AUD">AUD (A$ - Australian Dollar)</option>
                    <option value="USD">USD ($ - US Dollar)</option>
                    <option value="MYR">MYR (RM - Malaysian Ringgit)</option>
                    <option value="GBP">GBP (£ - British Pound)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                  </select>
                </div>
              </div>

              {/* GST Financial Breakdown Sub-Card */}
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-emerald-600" />
                    GST &amp; Financial Reconciliation
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Edits auto-recalculate tax
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Subtotal (Before GST)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={data.beforeGstAmount ?? ''}
                      onChange={(e) => handleFieldChange('beforeGstAmount', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-sm font-semibold border border-slate-300 rounded-lg text-slate-900 focus:outline-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      GST Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={data.gstRate ?? 9}
                      onChange={(e) => handleFieldChange('gstRate', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-sm font-semibold border border-slate-300 rounded-lg text-slate-900 focus:outline-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                      TOTAL (AFTER GST) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={data.afterGstAmount ?? ''}
                      onChange={(e) => handleFieldChange('afterGstAmount', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-sm font-bold border-2 border-emerald-500 bg-emerald-50/50 rounded-lg text-emerald-950 focus:outline-emerald-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Itemized Charges */}
          {activeTab === 'items' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Detailed Breakdown of Consultation, Medications &amp; Procedures
                </span>
                <button
                  type="button"
                  onClick={addItem}
                  className="px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Line Item
                </button>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {(data.items && data.items.length > 0) ? (
                  data.items.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs"
                    >
                      <div className="flex-1 w-full sm:w-auto">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Description"
                          className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white"
                        />
                      </div>

                      <div className="w-24">
                        <select
                          value={item.category || 'Consultation'}
                          onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                        >
                          <option value="Consultation">Consultation</option>
                          <option value="Medication">Medication</option>
                          <option value="Procedure">Procedure</option>
                          <option value="Diagnostic">Diagnostic</option>
                          <option value="Consumable">Consumable</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="w-16">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity || 1}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                          placeholder="Qty"
                          className="w-full px-2 py-1.5 text-xs text-center border border-slate-300 rounded-lg bg-white"
                        />
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          step="0.01"
                          value={item.amount}
                          onChange={(e) => handleItemChange(index, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="Amount"
                          className="w-full px-2 py-1.5 text-xs text-right font-semibold border border-slate-300 rounded-lg bg-white"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                        title="Delete item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No individual line items parsed. Click &quot;Add Line Item&quot; to add details.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Clinical Summary & Notes */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Visit Summary &amp; Treatment Notes
                </label>
                <textarea
                  rows={4}
                  value={data.summary || ''}
                  onChange={(e) => handleFieldChange('summary', e.target.value)}
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-emerald-500 text-slate-800"
                  placeholder="Summary of consultation diagnosis, symptoms, or dispensed medications..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  AI OCR Clarity / Confidence Notes
                </label>
                <textarea
                  rows={3}
                  value={data.confidenceNotes || ''}
                  onChange={(e) => handleFieldChange('confidenceNotes', e.target.value)}
                  className="w-full p-3 text-xs font-mono border border-slate-300 rounded-xl text-slate-600 bg-slate-50"
                  placeholder="OCR confidence notes..."
                />
              </div>
            </div>
          )}

          {/* Bottom Action CTA Strip */}
          <div className="mt-auto pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              Ready to create medical claim document
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                Preview PDF
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Generate &amp; Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      <PdfPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        pdfDoc={currentPdfDoc}
        filename={`MediScan_${(data.patientName || 'Patient').replace(/\s+/g, '_')}_${(data.clinicName || 'Clinic').slice(0, 15).replace(/\s+/g, '_')}.pdf`}
      />
    </div>
  );
};
