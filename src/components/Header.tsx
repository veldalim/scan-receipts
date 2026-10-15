import React from 'react';
import { Stethoscope, FileText, Sparkles, ShieldCheck, HelpCircle } from 'lucide-react';

interface HeaderProps {
  onNewScan: () => void;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onNewScan, savedCount }) => {
  return (
    <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                MediScan
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                GST Scanner
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Clinic &amp; Medical Expense OCR to Audited PDF
            </p>
          </div>
        </div>

        {/* Right Info & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 text-slate-700 text-xs font-medium border border-slate-200/60">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Identifies Patient &bull; Clinic &bull; After-GST</span>
          </div>

          <button
            type="button"
            onClick={onNewScan}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>New Scan</span>
          </button>
        </div>
      </div>
    </header>
  );
};
