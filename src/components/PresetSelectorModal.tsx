import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Coffee, Sparkles, ShoppingBag, Palette, Dumbbell, Check } from 'lucide-react';
import { PRESET_BUSINESSES, PresetBusiness } from '../data/presets';
import { useLanguage } from '../i18n/LanguageContext';

interface PresetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: PresetBusiness) => void;
  activePresetId?: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Coffee: <Coffee className="w-5 h-5 text-amber-600" />,
  Sparkles: <Sparkles className="w-5 h-5 text-fuchsia-600" />,
  ShoppingBag: <ShoppingBag className="w-5 h-5 text-emerald-600" />,
  Palette: <Palette className="w-5 h-5 text-indigo-600" />,
  Dumbbell: <Dumbbell className="w-5 h-5 text-sky-600" />,
};

export const PresetSelectorModal: React.FC<PresetSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
  activePresetId,
}) => {
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  {t.presetModal.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.presetModal.subtitle}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Presets List */}
            <div className="p-6 overflow-y-auto space-y-3.5">
              {PRESET_BUSINESSES.map((preset) => {
                const isActive = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      onSelectPreset(preset);
                      onClose();
                    }}
                    className={`w-full text-left ltr:text-left rtl:text-right p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 ${
                      isActive
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20 shadow-xs'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 shadow-xs">
                      {ICON_MAP[preset.iconName] || <Sparkles className="w-5 h-5 text-indigo-600" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          {preset.label}
                          {isActive && (
                            <span className="text-xs text-indigo-700 bg-indigo-100 font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Check className="w-3 h-3" /> {t.presetModal.selected}
                            </span>
                          )}
                        </h4>
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {preset.category}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {preset.profile.description}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-2 text-[11px] text-slate-500">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                          📍 {preset.profile.location}
                        </span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                          ✨ {preset.profile.brandTone}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
              <span>{t.presetModal.footerText}</span>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {t.presetModal.close}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
