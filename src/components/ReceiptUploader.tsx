import React, { useRef, useState } from 'react';
import { UploadCloud, Camera, Sparkles, FileText, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { SAMPLE_RECEIPTS, generateSampleReceiptImage, SampleReceiptOption } from '../utils/sampleReceipts';
import { CameraModal } from './CameraModal';

interface ReceiptUploaderProps {
  onScanReceipt: (imageBase64: string, presetSample?: SampleReceiptOption) => Promise<void>;
  isScanning: boolean;
  scanningStepText: string;
}

export const ReceiptUploader: React.FC<ReceiptUploaderProps> = ({
  onScanReceipt,
  isScanning,
  scanningStepText,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleFileSelect = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert('Please select an image file (JPG, PNG, WEBP) or PDF scan.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      onScanReceipt(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleSelectSample = (sample: SampleReceiptOption) => {
    const sampleImage = generateSampleReceiptImage(sample);
    onScanReceipt(sampleImage, sample);
  };

  return (
    <div className="w-full">
      {/* Upload Box */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative rounded-3xl border-2 transition-all overflow-hidden ${
          isDragOver
            ? 'border-emerald-500 bg-emerald-50/50 scale-[1.005]'
            : 'border-dashed border-slate-300 hover:border-slate-400 bg-white/80 shadow-sm'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
        />

        {isScanning ? (
          <div className="py-16 px-6 flex flex-col items-center justify-center text-center">
            {/* Animated Scanner Radar */}
            <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-200 animate-ping opacity-60" />
              <div className="absolute inset-2 rounded-full border-2 border-emerald-400 animate-spin border-t-transparent" />
              <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Sparkles className="w-7 h-7 text-white animate-pulse" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Scanning Medical Receipt...
            </h3>
            <p className="text-sm text-slate-600 max-w-md font-medium">
              {scanningStepText || 'Extracting patient name, clinic provider, and after-GST total amount...'}
            </p>

            <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-semibold text-emerald-800">
                AI Vision Processing Powered by Gemini
              </span>
            </div>
          </div>
        ) : (
          <div className="p-8 sm:p-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 border border-emerald-100 shadow-inner">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2">
              Scan Clinic Receipt or Tax Invoice
            </h2>
            <p className="text-sm text-slate-500 max-w-lg mb-6 leading-relaxed">
              Upload your medical invoice or snap a receipt photo. MediScan automatically extracts the{' '}
              <strong className="text-emerald-700 font-semibold">patient name</strong>,{' '}
              <strong className="text-emerald-700 font-semibold">clinic name</strong>, and{' '}
              <strong className="text-emerald-700 font-semibold">total amount after GST</strong>, then summarizes everything into an audited PDF.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                Upload Receipt Image
              </button>

              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold text-sm rounded-xl shadow-md shadow-slate-900/10 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-emerald-400" />
                Use Live Camera
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-4">
              Supports JPG, PNG, WEBP, or scanned PDFs. Up to 25MB.
            </p>
          </div>
        )}
      </div>

      {/* One-click Sample Medical Receipts section */}
      {!isScanning && (
        <div className="mt-6 bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Instant Test: Try Built-in Medical Receipts
              </span>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              1-click test with real clinic invoice simulations
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SAMPLE_RECEIPTS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className="group flex flex-col p-3.5 bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all shadow-2xs hover:shadow-sm cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-800">
                    {sample.title}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    ${sample.totalAfterGst.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-600 truncate mb-1">
                  {sample.clinic}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-auto pt-2 border-t border-slate-100">
                  <span>Patient: <strong className="text-slate-600 font-semibold">{sample.patient}</strong></span>
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                    Scan <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Camera Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(base64) => onScanReceipt(base64)}
      />
    </div>
  );
};
