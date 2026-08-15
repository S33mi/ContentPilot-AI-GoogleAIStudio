import React, { useState } from 'react';
import { Sparkles, HelpCircle, X, CheckCircle2, Edit3, Grid, Copy } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export const HowItWorks: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(false);
  const { t } = useLanguage();

  if (isDismissed) {
    return (
      <div className="flex justify-end">
        <button
          onClick={() => setIsDismissed(false)}
          className="inline-flex items-center gap-1.5 text-xs text-indigo-700 font-semibold hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full border border-indigo-200 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{t.howItWorks.btnLabel}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-purple-50 border border-indigo-200/80 rounded-2xl p-4 sm:p-5 shadow-xs relative transition-all">
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-indigo-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <span>{t.howItWorks.title}</span>
            <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
              {t.howItWorks.badge}
            </span>
          </h3>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          title="Dismiss guide"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Step 1 */}
        <div className="bg-white/90 p-3.5 rounded-xl border border-indigo-100/80 flex items-start gap-3 shadow-2xs">
          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center justify-center shrink-0">
            1
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-900">
              <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t.howItWorks.step1Title}</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
              {t.howItWorks.step1Desc}
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white/90 p-3.5 rounded-xl border border-indigo-100/80 flex items-start gap-3 shadow-2xs">
          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center justify-center shrink-0">
            2
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-900">
              <Grid className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t.howItWorks.step2Title}</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
              {t.howItWorks.step2Desc}
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white/90 p-3.5 rounded-xl border border-indigo-100/80 flex items-start gap-3 shadow-2xs">
          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center justify-center shrink-0">
            3
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-900">
              <Copy className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t.howItWorks.step3Title}</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
              {t.howItWorks.step3Desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

