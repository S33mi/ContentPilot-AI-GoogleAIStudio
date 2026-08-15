import React from 'react';
import { GenerationMode } from '../types';
import { Calendar, ShoppingBag, MessageSquareText, Sparkles, ArrowDown, Check, Zap } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface GenerationModeSelectorProps {
  activeMode: GenerationMode;
  onSelectMode: (mode: GenerationMode) => void;
}

export const GenerationModeSelector: React.FC<GenerationModeSelectorProps> = ({
  activeMode,
  onSelectMode,
}) => {
  const { t } = useLanguage();

  const options = [
    {
      id: 'social' as GenerationMode,
      title: t.modeSelector.socialTitle,
      subtitle: t.modeSelector.socialSubtitle,
      description: t.modeSelector.socialDesc,
      icon: <Calendar className="w-6 h-6" />,
      badge: t.modeSelector.socialBadge,
      badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      activeColor: 'from-indigo-600 via-indigo-700 to-violet-700',
      activeBorder: 'border-indigo-600 ring-2 ring-indigo-500/30',
      btnBg: 'bg-indigo-600 text-white hover:bg-indigo-700',
    },
    {
      id: 'product' as GenerationMode,
      title: t.modeSelector.productTitle,
      subtitle: t.modeSelector.productSubtitle,
      description: t.modeSelector.productDesc,
      icon: <ShoppingBag className="w-6 h-6" />,
      badge: t.modeSelector.productBadge,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      activeColor: 'from-emerald-600 via-teal-600 to-emerald-700',
      activeBorder: 'border-emerald-600 ring-2 ring-emerald-500/30',
      btnBg: 'bg-emerald-600 text-white hover:bg-emerald-700',
    },
    {
      id: 'reply' as GenerationMode,
      title: t.modeSelector.replyTitle,
      subtitle: t.modeSelector.replySubtitle,
      description: t.modeSelector.replyDesc,
      icon: <MessageSquareText className="w-6 h-6" />,
      badge: t.modeSelector.replyBadge,
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
      activeColor: 'from-sky-600 via-blue-600 to-indigo-700',
      activeBorder: 'border-sky-600 ring-2 ring-sky-500/30',
      btnBg: 'bg-sky-600 text-white hover:bg-sky-700',
    },
  ];

  const handleSelect = (mode: GenerationMode) => {
    onSelectMode(mode);
    const el = document.getElementById('active-generator-workspace');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-slate-900 to-indigo-950 p-4 rounded-2xl text-white shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
            <Zap className="w-4 h-4 fill-amber-300" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>{t.modeSelector.title}</span>
            </h2>
            <p className="text-xs text-slate-300">
              {t.modeSelector.subtitle}
            </p>
          </div>
        </div>

        <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5 self-end sm:self-center">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{t.modeSelector.selectToStart}</span>
        </div>
      </div>

      {/* 3 Prominent Generator Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map((option) => {
          const isActive = activeMode === option.id;
          return (
            <div
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between overflow-hidden group ${
                isActive
                  ? `bg-white ${option.activeBorder} shadow-lg scale-[1.01]`
                  : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-md hover:scale-[1.005]'
              }`}
            >
              {/* Top Accent Strip */}
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${option.activeColor} ${
                  isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'
                } transition-opacity`}
              />

              <div>
                {/* Header Row: Icon & Badge */}
                <div className="flex items-start justify-between gap-3 mb-3 pt-1">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                      isActive
                        ? `bg-gradient-to-br ${option.activeColor} text-white shadow-sm`
                        : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                    }`}
                  >
                    {option.icon}
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${option.badgeColor}`}
                  >
                    {option.badge}
                  </span>
                </div>

                {/* Title & Subtitle */}
                <h3
                  className={`text-base font-extrabold tracking-tight ${
                    isActive ? 'text-slate-950' : 'text-slate-900 group-hover:text-indigo-700'
                  }`}
                >
                  {option.title}
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5 mb-2">
                  {option.subtitle}
                </p>

                {/* Detailed Description */}
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {option.description}
                </p>
              </div>

              {/* Action Button CTA Bar */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                {isActive ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200/80 w-full justify-center">
                    <Check className="w-4 h-4 text-indigo-600" />
                    <span>{t.modeSelector.activeGenerator}</span>
                    <ArrowDown className="w-3.5 h-3.5 ml-1 text-indigo-500 animate-bounce" />
                  </span>
                ) : (
                  <button
                    type="button"
                    className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer w-full flex items-center justify-center gap-1.5 ${option.btnBg}`}
                  >
                    <span>{t.modeSelector.selectAndOpen}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

