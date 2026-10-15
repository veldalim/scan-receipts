import React from 'react';
import { X, Download, Printer } from 'lucide-react';
import jsPDF from 'jspdf';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfDoc: jsPDF | null;
  filename: string;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  pdfDoc,
  filename,
}) => {
  if (!isOpen || !pdfDoc) return null;

  const pdfBlobUrl = pdfDoc.output('bloburl').toString();

  const handleDownload = () => {
    pdfDoc.save(filename);
  };

  const handlePrint = () => {
    const blob = pdfDoc.output('blob');
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative flex flex-col w-full max-w-4xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <h3 className="font-semibold text-base tracking-tight">PDF Summary Preview</h3>
              <p className="text-xs text-slate-400">{filename}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={handleDownload}
              type="button"
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2"
              aria-label="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal PDF Frame */}
        <div className="flex-1 bg-slate-100 p-2 sm:p-4 overflow-hidden">
          <iframe
            src={pdfBlobUrl}
            title="PDF Preview"
            className="w-full h-full rounded-lg shadow-inner border border-slate-300 bg-white"
          />
        </div>
      </div>
    </div>
  );
};
