import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BusinessProfile, ProductDescriptionResponse } from '../types';
import { ShoppingBag, Sparkles, Copy, Check, RefreshCw, Bookmark, Tag, CheckCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ExportActionBar } from './ExportActionBar';
import { exportProductDescription } from '../lib/exportUtils';

interface ProductGeneratorProps {
  business: BusinessProfile;
  onShowToast: (msg: string) => void;
  onSaveItem: (title: string, content: any, type: 'product') => void;
  onOpenPricing: () => void;
  initialSampleProduct?: {
    productName: string;
    keyFeatures: string;
    priceOrPromo: string;
  };
}

export const ProductGenerator: React.FC<ProductGeneratorProps> = ({
  business,
  onShowToast,
  onSaveItem,
  onOpenPricing,
  initialSampleProduct,
}) => {
  const { language, t } = useLanguage();
  const { usageStatus, recordGeneration } = useAuth();

  const [productName, setProductName] = useState(initialSampleProduct?.productName || '');
  const [keyFeatures, setKeyFeatures] = useState(initialSampleProduct?.keyFeatures || '');
  const [priceOrPromo, setPriceOrPromo] = useState(initialSampleProduct?.priceOrPromo || '');

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProductDescriptionResponse | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const productLoadingSteps = [
    t.productGen.loadingStep1,
    t.productGen.loadingStep2,
    t.productGen.loadingStep3,
  ];

  useEffect(() => {
    if (!isLoading) {
      setLoadingStepIdx(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStepIdx((prev) => (prev + 1) % productLoadingSteps.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [isLoading, productLoadingSteps.length]);

  const handleGenerate = async () => {
    if (!business.name?.trim() || !business.type?.trim()) {
      setError(t.productGen.errorIncompleteProfile);
      return;
    }
    if (!productName.trim()) {
      setError(t.productGen.errorEmptyProductName);
      return;
    }

    if (!usageStatus.canGenerate) {
      setError(usageStatus.reason || 'Generation limit reached. Please upgrade to continue.');
      onOpenPricing();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business,
          product: { productName, keyFeatures, priceOrPromo },
          language: language.aiPromptName,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || t.productGen.errorApi);
      }

      const data: ProductDescriptionResponse = await response.json();
      setResult(data);
      await recordGeneration();
      onShowToast(t.productGen.toastSuccess);
    } catch (err: any) {
      setError(err.message || t.productGen.errorApi);
    } finally {
      setIsLoading(false);
    }
  };

  const copyFullCopy = () => {
    if (!result) return;
    const fullText = `${result.title}\n${result.tagline}\n\n${result.description}\n\nHighlights:\n${result.bulletBenefits.map((b) => `• ${b}`).join('\n')}\n\n${result.suggestedCallToAction}`;
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    onShowToast(t.productGen.toastFullCopied);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const wordCount = result?.description ? result.description.trim().split(/\s+/).length : 0;

  return (
    <div id="active-generator-workspace" className="space-y-6">
      {/* Form card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            {t.productGen.cardTitle || t.productGen.title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.productGen.cardSubtitle || t.productGen.subtitle}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              {t.productGen.productNameLabel || t.productGen.productName} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder={t.productGen.productNamePlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 text-sm text-slate-900 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                {t.productGen.featuresLabel || t.productGen.features}
              </label>
              <textarea
                rows={3}
                value={keyFeatures}
                onChange={(e) => setKeyFeatures(e.target.value)}
                placeholder={t.productGen.featuresPlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 text-sm text-slate-900 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                {t.productGen.priceLabel || t.productGen.price}
              </label>
              <input
                type="text"
                value={priceOrPromo}
                onChange={(e) => setPriceOrPromo(e.target.value)}
                placeholder={t.productGen.pricePlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 text-sm text-slate-900 outline-none mb-2"
              />
              <p className="text-[11px] text-slate-500">
                {t.productGen.priceHint || t.productGen.priceHelp}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-red-800">Note:</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className={`w-full py-4 px-6 rounded-xl font-bold text-sm text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
            isLoading
              ? 'bg-emerald-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/20 active:scale-[0.995]'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
              <span>{t.productGen.generatingBtn || t.productGen.btnGenerating}</span>
            </div>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{result ? (t.productGen.regenerateBtn || t.productGen.btnRegenerate) : (t.productGen.generateBtn || t.productGen.btnGenerate)}</span>
            </>
          )}
        </button>
      </div>

      {/* Loading banner */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 text-white rounded-2xl p-6 border border-emerald-500/30 shadow-lg space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white tracking-tight">
                {t.productGen.generatingBtn || t.productGen.btnGenerating}
              </h4>
              <p className="text-xs text-emerald-200 mt-0.5">
                {t.productGen.loadingSubtitle}
              </p>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-3.5 border border-white/10 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="text-xs font-semibold text-slate-200">
              {productLoadingSteps[loadingStepIdx]}
            </span>
          </div>
        </motion.div>
      )}

      {/* Result Display Card */}
      {result && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Export Action Bar */}
          <ExportActionBar
            onExportPDF={() => exportProductDescription(result, productName, 'pdf')}
            onExportDocx={() => exportProductDescription(result, productName, 'docx')}
            onExportXlsx={() => exportProductDescription(result, productName, 'xlsx')}
            onExportCSV={() => exportProductDescription(result, productName, 'csv')}
            onExportJSON={() => exportProductDescription(result, productName, 'json')}
            onCopyAll={copyFullCopy}
            onSave={() => {
              onSaveItem(`Product Description: ${result.title}`, result, 'product');
              onShowToast(t.productGen.toastSaved);
            }}
            copied={isCopied}
          />

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md p-6 space-y-5">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {t.productGen.benefitBadge || t.productGen.badge}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  ({wordCount} words)
                </span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mt-2">
                {result.title}
              </h4>
              <p className="text-xs font-semibold text-emerald-700 italic mt-0.5">
                "{result.tagline}"
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onSaveItem(`Product Description: ${result.title}`, result, 'product');
                  onShowToast(t.productGen.toastSaved);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-600" />
                {t.productGen.saveCopyBtn || t.productGen.saveCopy}
              </button>

              <button
                onClick={copyFullCopy}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {isCopied ? (t.productGen.copiedBtn || t.productGen.copied) : (t.productGen.copyAllBtn || t.productGen.copyAll)}
              </button>
            </div>
          </div>

          {/* Description Text */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
              {t.productGen.descHeader || t.productGen.descCopy}
            </h5>
            <p className="text-sm text-slate-800 leading-relaxed font-medium">
              {result.description}
            </p>
          </div>

          {/* Benefits Bullet Points */}
          <div>
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2.5">
              {t.productGen.highlightsHeader || t.productGen.highlights}
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {result.bulletBenefits.map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-xs font-medium text-slate-800">{bullet}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="p-3.5 rounded-xl bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold text-emerald-950">{t.productGen.ctaHeader || t.productGen.cta}:</span>
              <span className="text-xs text-emerald-900 font-semibold">{result.suggestedCallToAction}</span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(result.suggestedCallToAction);
                onShowToast(t.productGen.toastCtaCopied);
              }}
              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline shrink-0 cursor-pointer"
            >
              {t.productGen.copyCtaBtn || t.productGen.copyCta}
            </button>
          </div>
        </div>
      </motion.div>
    )}
  </div>
);
};

