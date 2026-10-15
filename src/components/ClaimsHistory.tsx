import React, { useState } from 'react';
import {
  FileText,
  Download,
  Trash2,
  Eye,
  Building2,
  User,
  Calendar,
  Layers,
  Search,
  Filter,
} from 'lucide-react';
import { ScannedReceiptRecord } from '../types';
import { generateSingleReceiptPdf, generateConsolidatedClaimsPdf } from '../utils/pdfGenerator';
import { PdfPreviewModal } from './PdfPreviewModal';
import jsPDF from 'jspdf';

interface ClaimsHistoryProps {
  records: ScannedReceiptRecord[];
  onSelectRecord: (record: ScannedReceiptRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
}

export const ClaimsHistory: React.FC<ClaimsHistoryProps> = ({
  records,
  onSelectRecord,
  onDeleteRecord,
  onClearAll,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [previewPdf, setPreviewPdf] = useState<{ doc: jsPDF; filename: string } | null>(null);

  if (records.length === 0) {
    return null;
  }

  const filteredRecords = records.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.data.patientName?.toLowerCase().includes(q) ||
      r.data.clinicName?.toLowerCase().includes(q) ||
      r.data.receiptNumber?.toLowerCase().includes(q)
    );
  });

  const totalSpentAfterGst = records.reduce((sum, r) => sum + (r.data.afterGstAmount || 0), 0);
  const totalGstPaid = records.reduce((sum, r) => sum + (r.data.gstAmount || 0), 0);
  const currency = records[0]?.data.currency || 'SGD';

  const handleExportConsolidatedPdf = () => {
    const doc = generateConsolidatedClaimsPdf(records);
    doc.save(`MediScan_Consolidated_Claims_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handlePreviewConsolidatedPdf = () => {
    const doc = generateConsolidatedClaimsPdf(records);
    setPreviewPdf({
      doc,
      filename: `MediScan_Consolidated_Claims_${new Date().toISOString().slice(0, 10)}.pdf`,
    });
  };

  const handleDownloadSinglePdf = (record: ScannedReceiptRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const doc = generateSingleReceiptPdf(record);
    doc.save(
      `MediScan_${(record.data.patientName || 'Patient').replace(/\s+/g, '_')}_${(record.data.clinicName || 'Clinic').slice(0, 15).replace(/\s+/g, '_')}.pdf`
    );
  };

  return (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-6">
      {/* Header and Aggregate Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Claims Log ({records.length} {records.length === 1 ? 'Receipt' : 'Receipts'})
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            Scanned Medical Receipts Schedule
          </h3>
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handlePreviewConsolidatedPdf}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-slate-600" />
            Preview Consolidated PDF
          </button>

          <button
            type="button"
            onClick={handleExportConsolidatedPdf}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            Export All to Consolidated PDF
          </button>

          <button
            type="button"
            onClick={onClearAll}
            className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
            title="Clear all saved receipts"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Aggregate Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Receipts Scanned
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {records.length}
          </div>
          <span className="text-xs text-slate-400">
            Across {new Set(records.map((r) => r.data.clinicName)).size} healthcare clinics
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total GST Claimable
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {currency} {totalGstPaid.toFixed(2)}
          </div>
          <span className="text-xs text-slate-400">
            Audited Goods &amp; Services Tax
          </span>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Total Spent (After GST)
          </span>
          <div className="text-2xl font-extrabold text-emerald-900 mt-1">
            {currency} {totalSpentAfterGst.toFixed(2)}
          </div>
          <span className="text-xs text-emerald-700">
            Grand total claimable amount
          </span>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by patient name, clinic, or invoice number..."
          className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-500 bg-slate-50/50"
        />
      </div>

      {/* Receipts Table / List */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Receipt Proof</th>
              <th className="py-3 px-4">Patient Name</th>
              <th className="py-3 px-4">Clinic / Provider</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">GST Amount</th>
              <th className="py-3 px-4 text-right font-bold text-emerald-800">After GST Total</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.map((record) => (
              <tr
                key={record.id}
                onClick={() => onSelectRecord(record)}
                className="hover:bg-emerald-50/40 transition-colors cursor-pointer group"
              >
                <td className="py-3 px-4">
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                    <img
                      src={record.imageUrl}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </td>
                <td className="py-3 px-4 font-bold text-slate-900">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    {record.data.patientName || 'Not Stated'}
                  </div>
                  {record.data.patientIdOrRef && (
                    <span className="text-[10px] text-slate-400 font-mono pl-5">
                      {record.data.patientIdOrRef}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 font-medium text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-purple-500" />
                    <span className="truncate max-w-[200px]">{record.data.clinicName}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 pl-5">
                    Inv: {record.data.receiptNumber || 'N/A'}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {record.data.date || 'Recent'}
                  </div>
                </td>
                <td className="py-3 px-4 text-right text-slate-600 font-medium">
                  {record.data.currency || currency} {(record.data.gstAmount || 0).toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right font-extrabold text-emerald-700 text-sm">
                  {record.data.currency || currency} {(record.data.afterGstAmount || 0).toFixed(2)}
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleDownloadSinglePdf(record, e)}
                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Download PDF Summary"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRecord(record.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {previewPdf && (
        <PdfPreviewModal
          isOpen={Boolean(previewPdf)}
          onClose={() => setPreviewPdf(null)}
          pdfDoc={previewPdf.doc}
          filename={previewPdf.filename}
        />
      )}
    </div>
  );
};
