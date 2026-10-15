import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ReceiptUploader } from './components/ReceiptUploader';
import { ReceiptDetailsEditor } from './components/ReceiptDetailsEditor';
import { ClaimsHistory } from './components/ClaimsHistory';
import { ExtractedReceiptData, ScannedReceiptRecord } from './types';
import { SAMPLE_RECEIPTS, generateSampleReceiptImage, SampleReceiptOption } from './utils/sampleReceipts';
import { AlertCircle, CheckCircle, FileCheck, Stethoscope, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'mediscan_saved_claims_v1';

export default function App() {
  const [currentRecord, setCurrentRecord] = useState<ScannedReceiptRecord | null>(null);
  const [savedRecords, setSavedRecords] = useState<ScannedReceiptRecord[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanningStepText, setScanningStepText] = useState('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Load saved claims from localStorage on mount, and populate initial demo receipt if empty
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedRecords(parsed);
          return;
        }
      }

      // Initial friendly seed with first sample receipt
      const initialSample = SAMPLE_RECEIPTS[0];
      const initialImage = generateSampleReceiptImage(initialSample);
      const initialRecord: ScannedReceiptRecord = {
        id: `claim-${Date.now()}-seed`,
        timestamp: Date.now(),
        imageUrl: initialImage,
        fileName: 'Healthway_Medical_TaxInvoice.png',
        status: 'verified',
        data: initialSample.presetData,
      };

      setSavedRecords([initialRecord]);
      // Also set as currently active record so user immediately sees the full review & PDF feature!
      setCurrentRecord(initialRecord);
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
    }
  }, []);

  // Save to localStorage when savedRecords change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedRecords));
    } catch (e) {
      console.warn('Error saving to localStorage:', e);
    }
  }, [savedRecords]);

  // Main scan action
  const handleScanReceipt = async (imageBase64: string, presetSample?: SampleReceiptOption) => {
    setIsScanning(true);
    setErrorNotice(null);

    // Step animation feedback
    setScanningStepText('Extracting clinic letterhead, patient name, and tax invoice items...');

    const stepTimer1 = setTimeout(() => {
      setScanningStepText('Identifying Patient Name & Healthcare Clinic...');
    }, 1200);

    const stepTimer2 = setTimeout(() => {
      setScanningStepText('Reconciling Goods & Services Tax (GST) and Total After GST...');
    }, 2400);

    try {
      // If user selected a preset sample, or if calling API
      let extractedData: ExtractedReceiptData;

      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType: imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
        }),
      });

      const responseText = await response.text();
      let json: { success?: boolean; data?: ExtractedReceiptData; error?: string } = {};
      try {
        json = JSON.parse(responseText);
      } catch (parseError) {
        console.warn('Non-JSON response from /api/scan-receipt:', responseText.slice(0, 150), parseError);
      }

      if (json && json.success && json.data) {
        extractedData = json.data;
      } else if (presetSample) {
        // Seamless fallback to rich sample preset data
        extractedData = presetSample.presetData;
      } else {
        throw new Error(json?.error || 'Failed to extract text from receipt. Please verify image clarity.');
      }

      // Ensure mandatory 3 fields are present and sanitized
      if (!extractedData.patientName) {
        extractedData.patientName = 'Patient (Unspecified)';
      }
      if (!extractedData.clinicName) {
        extractedData.clinicName = 'Medical Clinic';
      }
      if (typeof extractedData.afterGstAmount !== 'number' || isNaN(extractedData.afterGstAmount)) {
        extractedData.afterGstAmount = Number(extractedData.afterGstAmount) || 0;
      }

      const newRecord: ScannedReceiptRecord = {
        id: `claim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
        imageUrl: imageBase64,
        status: 'extracted',
        data: extractedData,
      };

      setCurrentRecord(newRecord);

      // Automatically add or update into saved claims
      setSavedRecords((prev) => [newRecord, ...prev]);

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      console.error('Receipt scanning failed:', err);
      const msg = err instanceof Error ? err.message : 'Failed to scan receipt image.';

      // If preset sample was clicked, still allow seamless usage
      if (presetSample) {
        const fallbackRecord: ScannedReceiptRecord = {
          id: `claim-${Date.now()}`,
          timestamp: Date.now(),
          imageUrl: imageBase64,
          status: 'verified',
          data: presetSample.presetData,
        };
        setCurrentRecord(fallbackRecord);
        setSavedRecords((prev) => [fallbackRecord, ...prev]);
      } else {
        setErrorNotice(`${msg}. You can review the details manually or try one of the built-in sample receipts below.`);
      }
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsScanning(false);
      setScanningStepText('');
    }
  };

  const handleUpdateRecord = (updated: ScannedReceiptRecord) => {
    setCurrentRecord(updated);
    setSavedRecords((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
  };

  const handleSelectRecord = (record: ScannedReceiptRecord) => {
    setCurrentRecord(record);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteRecord = (id: string) => {
    setSavedRecords((prev) => prev.filter((r) => r.id !== id));
    if (currentRecord?.id === id) {
      setCurrentRecord(null);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all saved receipt claims?')) {
      setSavedRecords([]);
      setCurrentRecord(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleNewScan = () => {
    setCurrentRecord(null);
    setErrorNotice(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Navigation Header */}
      <Header
        onNewScan={handleNewScan}
        savedCount={savedRecords.length}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Error Notification banner if any */}
        {errorNotice && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Scan Notice:</span> {errorNotice}
            </div>
            <button
              onClick={() => setErrorNotice(null)}
              className="text-rose-500 hover:text-rose-700 font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* View Mode: Either Uploader or Active Receipt Review */}
        {currentRecord ? (
          <div className="space-y-8">
            <ReceiptDetailsEditor
              receiptRecord={currentRecord}
              onUpdateRecord={handleUpdateRecord}
              onScanAnother={handleNewScan}
              onSaveToClaims={() => {
                // Flash confirmation
                const exists = savedRecords.some((r) => r.id === currentRecord.id);
                if (!exists) {
                  setSavedRecords((prev) => [currentRecord, ...prev]);
                }
              }}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Value Proposition Header */}
            <div className="text-center max-w-2xl mx-auto pt-2 pb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Medical Receipt OCR &bull; GST Verification &bull; PDF Claims Summary
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Scan Medical Receipts, Extract GST, and Summarise into PDF
              </h2>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Automatically identifies the <strong className="text-slate-900 font-bold">Patient Name</strong>,{' '}
                <strong className="text-slate-900 font-bold">Clinic / Healthcare Provider</strong>, and{' '}
                <strong className="text-emerald-700 font-bold">Total Amount After GST</strong> from your clinic bill.
              </p>
            </div>

            {/* Uploader Box */}
            <ReceiptUploader
              onScanReceipt={handleScanReceipt}
              isScanning={isScanning}
              scanningStepText={scanningStepText}
            />
          </div>
        )}

        {/* Saved Claims Schedule & Consolidated PDF Export */}
        <ClaimsHistory
          records={savedRecords}
          onSelectRecord={handleSelectRecord}
          onDeleteRecord={handleDeleteRecord}
          onClearAll={handleClearAll}
        />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">MediScan</span> &bull; Medical Receipt &amp; GST Audit to PDF
          </div>
          <div className="text-[11px] text-slate-400">
            Compliant with GST invoice standards &bull; High-resolution PDF generation with receipt proofs
          </div>
        </div>
      </footer>
    </div>
  );
}
