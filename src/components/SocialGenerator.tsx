import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BusinessProfile, SocialMediaPackResponse } from '../types';
import { Calendar, Sparkles, Copy, Check, RefreshCw, Bookmark, Camera, Layers, Video, MessageCircle, HeartHandshake, Eye, Edit3, AlertCircle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ExportActionBar } from './ExportActionBar';
import { exportSocialPack } from '../lib/exportUtils';

interface SocialGeneratorProps {
  business: BusinessProfile;
  onShowToast: (msg: string) => void;
  onSaveItem: (title: string, content: any, type: 'social') => void;
  onOpenPricing: () => void;
}

const POST_TYPE_CONFIG: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  'Single Photo': { bg: 'bg-blue-50', text: 'text-blue-700', icon: <Camera className="w-3.5 h-3.5" /> },
  'Reel / Short Video': { bg: 'bg-purple-50', text: 'text-purple-700', icon: <Video className="w-3.5 h-3.5" /> },
  'Carousel Post': { bg: 'bg-amber-50', text: 'text-amber-700', icon: <Layers className="w-3.5 h-3.5" /> },
  'Story & Poll': { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <MessageCircle className="w-3.5 h-3.5" /> },
  'Behind The Scenes': { bg: 'bg-rose-50', text: 'text-rose-700', icon: <Eye className="w-3.5 h-3.5" /> },
  'Customer Review Spotlight': { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: <HeartHandshake className="w-3.5 h-3.5" /> },
};

export const SocialGenerator: React.FC<SocialGeneratorProps> = ({
  business,
  onShowToast,
  onSaveItem,
  onOpenPricing,
}) => {
  const { language, t } = useLanguage();
  const { usageStatus, recordGeneration } = useAuth();

  const [customGoal, setCustomGoal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pack, setPack] = useState<SocialMediaPackResponse | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingDay, setEditingDay] = useState<number | null>(null);

  const loadingSteps = [
    t.socialGen.loadingStep1,
    t.socialGen.loadingStep2,
    t.socialGen.loadingStep3,
    t.socialGen.loadingStep4,
  ];

  // Cycle loading status text
  useEffect(() => {
    if (!isLoading) {
      setLoadingStepIdx(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingStepIdx((prev) => (prev + 1) % loadingSteps.length);
    }, 2200);

    return () => clearInterval(interval);
  }, [isLoading, loadingSteps.length]);

  const handleGenerate = async () => {
    if (!business.name?.trim() || !business.type?.trim()) {
      setError(t.socialGen.errorIncompleteProfile);
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
      const response = await fetch('/api/generate/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business,
          customGoal,
          language: language.aiPromptName,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || t.socialGen.errorApi);
      }

      const data: SocialMediaPackResponse = await response.json();
      setPack(data);
      await recordGeneration();
      onShowToast(t.socialGen.toastSuccess);
    } catch (err: any) {
      setError(err.message || t.socialGen.errorApi);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, idKey: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idKey);
    onShowToast(`📋 ${label} ${t.socialGen.toastCopied}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCaptionChange = (dayNum: number, newCaption: string) => {
    if (!pack) return;
    const updatedPosts = pack.posts.map((p) =>
      p.dayNumber === dayNum ? { ...p, caption: newCaption } : p
    );
    setPack({ ...pack, posts: updatedPosts });
  };

  const handleSavePack = () => {
    if (!pack) return;
    onSaveItem(
      `7-Day Social Pack: ${pack.weeklyTheme || business.name}`,
      pack,
      'social'
    );
    onShowToast(t.socialGen.toastSaved);
  };

  const handleCopyAll = () => {
    if (!pack) return;
    const fullText =
      `SOCIAL MEDIA CONTENT PACK: ${pack.weeklyTheme}\nBusiness: ${business.name}\n\n` +
      pack.posts
        .map(
          (p) =>
            `--- DAY ${p.dayNumber}: ${p.dayName} (${p.postType}) ---\nHook: ${p.hook}\n\nCaption:\n${p.caption}\n\nHashtags: ${
              Array.isArray(p.hashtags) ? p.hashtags.join(' ') : p.hashtags
            }\nCTA: ${p.callToAction}\nVisual Idea: ${p.visualIdea}`
        )
        .join('\n\n========================================\n\n');
    copyToClipboard(fullText, 'full_pack', 'Entire Social Pack');
  };

  const filteredPosts = pack
    ? selectedDay === 'all'
      ? pack.posts
      : pack.posts.filter((p) => p.dayNumber === selectedDay)
    : [];

  return (
    <div id="active-generator-workspace" className="space-y-6">
      {/* Input controls card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              {t.socialGen.cardTitle || t.socialGen.title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {(t.socialGen.cardSubtitle || t.socialGen.subtitle || 'Gemini creates a full week of strategic, ready-to-post content tailored for {businessName}.').replace('{businessName}', business.name || 'your business')}
            </p>
          </div>
        </div>

        {/* Custom goal optional input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t.socialGen.campaignGoalLabel || t.socialGen.goalLabel}
          </label>
          <input
            type="text"
            value={customGoal}
            onChange={(e) => setCustomGoal(e.target.value)}
            placeholder={t.socialGen.campaignGoalPlaceholder || t.socialGen.goalPlaceholder}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 text-sm text-slate-900 placeholder-slate-400 outline-none"
          />
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

        {/* Action Button */}
        <div className="pt-1">
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className={`w-full py-4 px-6 rounded-xl font-bold text-sm text-white shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
              isLoading
                ? 'bg-indigo-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-sky-600 hover:from-indigo-700 hover:to-sky-700 shadow-indigo-500/20 active:scale-[0.995]'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                <span>{t.socialGen.generatingBtn || t.socialGen.btnGenerating}</span>
              </div>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{pack ? (t.socialGen.regenerateBtn || t.socialGen.btnRegenerate) : (t.socialGen.generateBtn || t.socialGen.btnGenerate)}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Prominent Loading Status Banner when Generating */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 border border-indigo-500/30 shadow-lg space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white tracking-tight">
                {t.socialGen.generatingBtn || t.socialGen.btnGenerating || t.socialGen.bannerTitle}
              </h4>
              <p className="text-xs text-indigo-200 mt-0.5">
                {t.socialGen.loadingSubtitle || t.socialGen.bannerSubtitle}
              </p>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-3.5 border border-white/10 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span className="text-xs font-semibold text-slate-200 transition-all">
              {loadingSteps[loadingStepIdx]}
            </span>
          </div>
        </motion.div>
      )}

      {/* Generated Content Results */}
      {pack && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Export Action Bar */}
          <ExportActionBar
            onExportPDF={() => exportSocialPack(pack, business.name, 'pdf')}
            onExportDocx={() => exportSocialPack(pack, business.name, 'docx')}
            onExportXlsx={() => exportSocialPack(pack, business.name, 'xlsx')}
            onExportCSV={() => exportSocialPack(pack, business.name, 'csv')}
            onExportJSON={() => exportSocialPack(pack, business.name, 'json')}
            onCopyAll={handleCopyAll}
            onSave={handleSavePack}
            copied={copiedId === 'full_pack'}
          />

          {/* Strategy Theme Header */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-400/20">
                {t.socialGen.campaignStrategyLabel || t.socialGen.strategyTitle}
              </span>
              <h4 className="text-lg font-bold mt-2 text-white">
                {pack.weeklyTheme}
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                {t.socialGen.strategySubtitle}
              </p>
            </div>

            <button
              onClick={handleSavePack}
              className="self-start md:self-center flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold transition-colors cursor-pointer shrink-0"
            >
              <Bookmark className="w-4 h-4 text-amber-300" />
              {t.socialGen.saveEntirePack}
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedDay('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedDay === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {t.socialGen.all7Days}
            </button>
            {pack.posts.map((p) => (
              <button
                key={p.dayNumber}
                onClick={() => setSelectedDay(p.dayNumber)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedDay === p.dayNumber
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {(t.socialGen.dayTab || `${t.socialGen.dayPrefix || 'Day'} {day}`).replace('{day}', String(p.dayNumber))}
              </button>
            ))}
          </div>

          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredPosts.map((post) => {
              const postTypeInfo = POST_TYPE_CONFIG[post.postType] || {
                bg: 'bg-slate-100',
                text: 'text-slate-700',
                icon: <Camera className="w-3.5 h-3.5" />,
              };

              const isEditing = editingDay === post.dayNumber;

              return (
                <div
                  key={post.dayNumber}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all space-y-4"
                >
                  {/* Top Bar: Day & Post Type */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide">
                        {post.dayLabel}
                      </span>
                      <h5 className="text-sm font-bold text-slate-900 mt-0.5">
                        {post.theme}
                      </h5>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${postTypeInfo.bg} ${postTypeInfo.text} border-current/10 shrink-0`}
                    >
                      {postTypeInfo.icon}
                      {post.postType}
                    </span>
                  </div>

                  {/* Caption Section */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        {t.socialGen.captionLabel || t.socialGen.caption}
                      </label>
                      <button
                        onClick={() => setEditingDay(isEditing ? null : post.dayNumber)}
                        className="text-[11px] font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        {isEditing ? t.socialGen.doneEditing : (t.socialGen.editCaption || t.socialGen.edit)}
                      </button>
                    </div>

                    {isEditing ? (
                      <textarea
                        rows={4}
                        value={post.caption}
                        onChange={(e) => handleCaptionChange(post.dayNumber, e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-indigo-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                      />
                    ) : (
                      <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                        {post.caption}
                      </p>
                    )}
                  </div>

                  {/* Hashtags */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        {t.socialGen.hashtagsLabel || t.socialGen.hashtags}
                      </label>
                      <button
                        onClick={() => copyToClipboard(post.hashtags.join(' '), `hash-${post.dayNumber}`, 'Hashtags')}
                        className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === `hash-${post.dayNumber}` ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        {t.socialGen.copyHashtags}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {post.hashtags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] bg-slate-100 text-indigo-700 font-medium px-2 py-0.5 rounded-md"
                        >
                          {tag.startsWith('#') ? tag : `#${tag}`}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Call to Action & Visual Idea */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="bg-amber-50/70 border border-amber-200/60 p-2.5 rounded-xl">
                      <span className="font-bold text-amber-900 block mb-0.5">📢 {t.socialGen.ctaLabel || t.socialGen.cta}</span>
                      <span className="text-amber-800 font-medium">{post.callToAction}</span>
                    </div>

                    <div className="bg-sky-50/70 border border-sky-200/60 p-2.5 rounded-xl">
                      <span className="font-bold text-sky-900 block mb-0.5 flex items-center gap-1">
                        <Camera className="w-3 h-3 text-sky-600" /> {t.socialGen.visualIdeaLabel || t.socialGen.visualIdea}
                      </span>
                      <span className="text-sky-800 font-medium">{post.visualIdea}</span>
                    </div>
                  </div>

                  {/* Card Copy Action Button */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        const fullText = `${post.caption}\n\n${post.hashtags.join(' ')}`;
                        copyToClipboard(fullText, `full-${post.dayNumber}`, `Day ${post.dayNumber} Post`);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-indigo-900 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copiedId === `full-${post.dayNumber}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{(t.socialGen.copiedBtn || t.socialGen.copiedPost || 'Copied Day {day} Post!').replace('{day}', String(post.dayNumber))}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{t.socialGen.copyCaptionBtn || t.socialGen.copyPost}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};

