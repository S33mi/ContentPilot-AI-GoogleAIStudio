import React, { useState } from 'react';
import { BusinessProfile } from '../types';
import { Building2, MapPin, Users, Volume2, Clock, FileText, ChevronDown, ChevronUp, Sparkles, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface BusinessFormProps {
  business: BusinessProfile;
  onChange: (updated: BusinessProfile) => void;
  onOpenPresets: () => void;
}

const TONE_OPTIONS = [
  'Friendly & Warm',
  'Professional & Trustworthy',
  'Fun, Upbeat & Energetic',
  'Luxury & Elegant',
  'Trendy, Chic & Modern',
  'Bold & Authoritative',
];

const TYPE_SUGGESTIONS = [
  'Coffee Shop & Bakery',
  'Beauty Salon & Spa',
  'Clothing & Apparel Boutique',
  'Freelance Web/Brand Designer',
  'Fitness Studio',
  'Local Restaurant / Bistro',
];

export const BusinessForm: React.FC<BusinessFormProps> = ({
  business,
  onChange,
  onOpenPresets,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useLanguage();

  const isFormValid = Boolean(
    business.name.trim() && business.type.trim() && business.description.trim()
  );

  const handleChange = (field: keyof BusinessProfile, value: string) => {
    onChange({
      ...business,
      [field]: value,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all">
      {/* Header bar */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                {t.businessForm.title}
              </h2>
              {isFormValid && (
                <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" /> {t.businessForm.readyBadge}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {t.businessForm.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenPresets}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" /> {t.businessForm.samplePresets}
          </button>
          
          {isFormValid && (
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand profile form' : 'Collapse profile form'}
            >
              {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Collapsed summary view */}
      {isCollapsed && isFormValid ? (
        <div className="p-5 bg-slate-50 flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-700 font-medium">
            <span className="font-bold text-slate-900 text-sm">{business.name}</span>
            <span className="bg-slate-200/80 px-2.5 py-1 rounded-md text-slate-800 font-semibold">{business.type}</span>
            {business.location && (
              <span className="flex items-center gap-1 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {business.location}
              </span>
            )}
            <span className="flex items-center gap-1 text-slate-600">
              <Volume2 className="w-3.5 h-3.5 text-slate-400" /> {business.brandTone}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline shrink-0 cursor-pointer"
          >
            {t.businessForm.editProfile}
          </button>
        </div>
      ) : (
        /* Full Form View */
        <div className="p-6 space-y-5">
          {/* Row 1: Name & Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                {t.businessForm.businessName} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={business.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder={t.businessForm.businessNamePlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                {t.businessForm.businessType} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={business.type}
                onChange={(e) => handleChange('type', e.target.value)}
                placeholder={t.businessForm.businessTypePlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
              />
              {/* Type suggestion chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] text-slate-400 self-center mr-1">{t.businessForm.quickPicks}</span>
                {TYPE_SUGGESTIONS.slice(0, 4).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleChange('type', type)}
                    className="text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/80 transition-colors cursor-pointer"
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Location & Working Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                {t.businessForm.location}
              </label>
              <input
                type="text"
                value={business.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder={t.businessForm.locationPlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                {t.businessForm.workingHours}
              </label>
              <input
                type="text"
                value={business.workingHours}
                onChange={(e) => handleChange('workingHours', e.target.value)}
                placeholder={t.businessForm.workingHoursPlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
              />
            </div>
          </div>

          {/* Row 3: Description */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              {t.businessForm.description} <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={business.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder={t.businessForm.descriptionPlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all resize-none"
            />
          </div>

          {/* Row 4: Target Audience & Brand Tone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                {t.businessForm.targetAudience}
              </label>
              <input
                type="text"
                value={business.targetAudience}
                onChange={(e) => handleChange('targetAudience', e.target.value)}
                placeholder={t.businessForm.targetAudiencePlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                {t.businessForm.brandTone}
              </label>
              <input
                type="text"
                value={business.brandTone}
                onChange={(e) => handleChange('brandTone', e.target.value)}
                placeholder={t.businessForm.brandTonePlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {TONE_OPTIONS.map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => handleChange('brandTone', tone)}
                    className={`text-[11px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                      business.brandTone === tone
                        ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {!isFormValid && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2">
              {t.businessForm.noteIncomplete}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

