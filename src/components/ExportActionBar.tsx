import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  Download,
  Copy,
  Check,
  Bookmark,
  ChevronDown,
  Sparkles,
  Cloud,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ExportActionBarProps {
  onExportPDF: () => void;
  onExportDocx: () => void;
  onExportXlsx: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onCopyAll: () => void;
  onSave: () => void;
  isSaved?: boolean;
  copied?: boolean;
  compact?: boolean;
}

export const ExportActionBar: React.FC<ExportActionBarProps> = ({
  onExportPDF,
  onExportDocx,
  onExportXlsx,
  onExportCSV,
  onExportJSON,
  onCopyAll,
  onSave,
  isSaved = false,
  copied = false,
  compact = false,
}) => {
  const { isPaidUser } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 text-white p-3 sm:p-4 rounded-2xl shadow-lg border border-slate-800">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
          <Download className="w-4 h-4 text-indigo-400" />
          <span>Export Options:</span>
        </span>
      </div>

      {/* Main Export Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {/* PDF */}
        <button
          onClick={onExportPDF}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-xs hover:shadow-rose-600/30 cursor-pointer"
          title="Download formatted document as PDF"
        >
          <FileText className="w-3.5 h-3.5 text-rose-200" />
          <span>PDF</span>
        </button>

        {/* Word (.docx) */}
        <button
          onClick={onExportDocx}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs hover:shadow-blue-600/30 cursor-pointer"
          title="Download as Microsoft Word document (.docx)"
        >
          <FileText className="w-3.5 h-3.5 text-blue-200" />
          <span>Word (.docx)</span>
        </button>

        {/* Excel (.xlsx) */}
        <button
          onClick={onExportXlsx}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs hover:shadow-emerald-600/30 cursor-pointer"
          title="Download structured spreadsheet (.xlsx)"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
          <span>Excel (.xlsx)</span>
        </button>

        {/* CSV */}
        <button
          onClick={onExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600/90 hover:bg-teal-600 text-white text-xs font-bold transition-all shadow-xs hover:shadow-teal-600/30 cursor-pointer"
          title="Download as Comma Separated Values (.csv)"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-teal-200" />
          <span>CSV</span>
        </button>

        {/* JSON */}
        <button
          onClick={onExportJSON}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
          title="Download raw data as JSON"
        >
          <FileCode className="w-3.5 h-3.5 text-slate-400" />
          <span>JSON</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-700 mx-1 hidden sm:block" />

        {/* Copy All */}
        <button
          onClick={onCopyAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
          title="Copy full text to clipboard"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Copy All'}</span>
        </button>

        {/* Save to Library */}
        <button
          onClick={onSave}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isSaved
              ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
              : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/30'
          }`}
          title="Save content to your library"
        >
          {isPaidUser ? (
            <Cloud className="w-3.5 h-3.5 text-indigo-400" />
          ) : (
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span>{isSaved ? 'Saved to Library' : 'Save to Library'}</span>
        </button>
      </div>
    </div>
  );
};
