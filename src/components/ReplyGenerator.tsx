import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BusinessProfile, CustomerReplyResponse, ReplyOption } from '../types';
import { MessageSquareText, Sparkles, Copy, Check, RefreshCw, Bookmark, Heart, Shield, Zap, Edit3, AlertCircle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ExportActionBar } from './ExportActionBar';
import { exportCustomerReplies } from '../lib/exportUtils';

interface ReplyGeneratorProps {
  business: BusinessProfile;
  onShowToast: (msg: string) => void;
  onSaveItem: (title: string, content: any, type: 'reply') => void;
  onOpenPricing: () => void;
  initialSampleReply?: {
    customerMessage: string;
    messageType: string;
  };
}

const SAMPLE_QUICK_MESSAGES = [
  {
    label: '⭐ 5-Star Review',
    type: 'Review',
    text: 'Loved the atmosphere and friendly staff! The cold brew was the best I have had in Austin. Will definitely be back every week!',
  },
  {
    label: '❓ Hours & Walk-ins Inquiry',
    type: 'Inquiry / Question',
    text: 'Hi there! Do you take walk-ins for haircuts on Saturday afternoon or do I need to book online in advance?',
  },
  {
    label: '⚠️ Seating / Wait Time Feedback',
    type: 'Complaint',
    text: 'The coffee was great, but it took almost 20 minutes to get my order and all the tables were taken. Hope seating expands soon.',
  },
];

const normalizeCategory = (cat?: string): string => {
  if (!cat) return 'Inquiry / Question';
  if (cat === 'Inquiry' || cat.startsWith('Inquiry')) return 'Inquiry / Question';
  if (cat === 'Custom' || cat.startsWith('Custom')) return 'Custom message';
  if (cat === 'Review') return 'Review';
  if (cat === 'Complaint') return 'Complaint';
  if (cat === 'Compliment') return 'Compliment';
  return cat;
};

export const ReplyGenerator: React.FC<ReplyGeneratorProps> = ({
  business,
  onShowToast,
  onSaveItem,
  onOpenPricing,
  initialSampleReply,
}) => {
  const { language, t } = useLanguage();
  const { usageStatus, recordGeneration } = useAuth();

  const [customerMessage, setCustomerMessage] = useState(initialSampleReply?.customerMessage || '');
  const [messageType, setMessageType] = useState<string>(() =>
    normalizeCategory(initialSampleReply?.messageType)
  );

  useEffect(() => {
    if (initialSampleReply) {
      if (initialSampleReply.customerMessage) setCustomerMessage(initialSampleReply.customerMessage);
      if (initialSampleReply.messageType) setMessageType(normalizeCategory(initialSampleReply.messageType));
    }
  }, [initialSampleReply]);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CustomerReplyResponse | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const replyLoadingSteps = [
    t.replyGen.loadingStep1,
    t.replyGen.loadingStep2,
    t.replyGen.loadingStep3,
  ];

  useEffect(() => {
    if (!isLoading) {
      setLoadingStepIdx(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStepIdx((prev) => (prev + 1) % replyLoadingSteps.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [isLoading, replyLoadingSteps.length]);

  const handleGenerate = async () => {
    if (!business.name?.trim() || !business.type?.trim()) {
      setError(t.replyGen.errorIncompleteProfile);
      return;
    }
    if (!customerMessage.trim()) {
      setError(t.replyGen.errorEmptyMessage);
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
      const response = await fetch('/api/generate/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business,
          customerRequest: { customerMessage, messageType },
          language: language.aiPromptName,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || t.replyGen.errorApi);
      }

      const data: CustomerReplyResponse = await response.json();
      setResult(data);
      await recordGeneration();
      onShowToast(t.replyGen.toastSuccess);
    } catch (err: any) {
      setError(err.message || t.replyGen.errorApi);
    } finally {
      setIsLoading(false);
    }
  };

  const copyReplyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onShowToast(t.replyGen.toastCopied);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAllReplies = () => {
    if (!result) return;
    const fullText =
      `CUSTOMER RESPONSE KIT FOR ${business.name.toUpperCase()}\nOriginal Message: "${customerMessage}"\n\n` +
      result.replies
        .map(
          (r, i) =>
            `--- OPTION ${i + 1}: ${r.style} ---\n${r.replyText}\n\n💡 Best Used For: ${r.whenToUse}`
        )
        .join('\n\n========================================\n\n');
    navigator.clipboard.writeText(fullText);
    setCopiedId('all_replies');
    onShowToast('All response options copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTextChange = (id: string, newText: string) => {
    if (!result) return;
    const updatedReplies = result.replies.map((r) =>
      r.id === id ? { ...r, replyText: newText } : r
    );
    setResult({ ...result, replies: updatedReplies });
  };

  const getStyleIcon = (style: string) => {
    if (style.includes('Short')) return <Zap className="w-4 h-4 text-amber-500" />;
    if (style.includes('Professional')) return <Shield className="w-4 h-4 text-blue-500" />;
    return <Heart className="w-4 h-4 text-rose-500" />;
  };

  const getStyleBg = (style: string) => {
    if (style.includes('Short')) return 'border-amber-200 bg-amber-50/30';
    if (style.includes('Professional')) return 'border-blue-200 bg-blue-50/30';
    return 'border-rose-200 bg-rose-50/30';
  };

  return (
    <div id="active-generator-workspace" className="space-y-6">
      {/* Input Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MessageSquareText className="w-5 h-5 text-sky-600" />
            {t.replyGen.cardTitle || t.replyGen.title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.replyGen.cardSubtitle || t.replyGen.subtitle}
          </p>
        </div>

        {/* Quick Message Sample Buttons */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            {t.replyGen.quickSampleLabel || t.replyGen.samplesLabel}
          </label>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUICK_MESSAGES.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCustomerMessage(sample.text);
                  setMessageType(sample.type);
                }}
                className="text-xs bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer font-medium"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message Input & Type */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                {t.replyGen.messageLabel} <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-400">{t.replyGen.categoryLabel}:</span>
                <select
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value)}
                  className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600/20 cursor-pointer"
                >
                  <option value="Review">{t.replyGen.catReview || 'Review'}</option>
                  <option value="Inquiry / Question">{t.replyGen.catInquiry || 'Inquiry / Question'}</option>
                  <option value="Complaint">{t.replyGen.catComplaint || 'Complaint'}</option>
                  <option value="Compliment">{t.replyGen.catCompliment || 'Compliment'}</option>
                  <option value="Custom message">{t.replyGen.catCustom || 'Custom message'}</option>
                </select>
              </div>
            </div>

            <textarea
              rows={3}
              value={customerMessage}
              onChange={(e) => setCustomerMessage(e.target.value)}
              placeholder={t.replyGen.messagePlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 text-sm text-slate-900 outline-none resize-none"
            />
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
              ? 'bg-sky-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-700 hover:to-blue-700 shadow-sky-500/20 active:scale-[0.995]'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
              <span>{t.replyGen.generatingBtn || t.replyGen.btnGenerating}</span>
            </div>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{result ? (t.replyGen.regenerateBtn || t.replyGen.btnRegenerate) : (t.replyGen.generateBtn || t.replyGen.btnGenerate)}</span>
            </>
          )}
        </button>
      </div>

      {/* Loading banner */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-sky-900 via-slate-900 to-blue-950 text-white rounded-2xl p-6 border border-sky-500/30 shadow-lg space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 shrink-0">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white tracking-tight">
                {t.replyGen.generatingBtn || t.replyGen.btnGenerating}
              </h4>
              <p className="text-xs text-sky-200 mt-0.5">
                {t.replyGen.loadingSubtitle}
              </p>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-3.5 border border-white/10 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-sky-400 animate-ping shrink-0" />
            <span className="text-xs font-semibold text-slate-200">
              {replyLoadingSteps[loadingStepIdx]}
            </span>
          </div>
        </motion.div>
      )}

      {/* Reply Results */}
      {result && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Export Action Bar */}
          <ExportActionBar
            onExportPDF={() => exportCustomerReplies(result, messageType || 'Reply', 'pdf')}
            onExportDocx={() => exportCustomerReplies(result, messageType || 'Reply', 'docx')}
            onExportXlsx={() => exportCustomerReplies(result, messageType || 'Reply', 'xlsx')}
            onExportCSV={() => exportCustomerReplies(result, messageType || 'Reply', 'csv')}
            onExportJSON={() => exportCustomerReplies(result, messageType || 'Reply', 'json')}
            onCopyAll={copyAllReplies}
            onSave={() => {
              onSaveItem(`Customer Reply Kit: ${business.name}`, result, 'reply');
              onShowToast(t.replyGen.toastSaved);
            }}
            copied={copiedId === 'all_replies'}
          />

          <div className="flex items-center justify-between px-1">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600" />
              {t.replyGen.selectResponseTitle || t.replyGen.selectHeader}
            </h4>
            <span className="text-xs text-slate-500 font-medium">
              {t.replyGen.styleCountBadge || t.replyGen.variations}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {result.replies.map((reply: ReplyOption) => {
              const isEditing = editingId === reply.id;
              const isCopied = copiedId === reply.id;

              return (
                <div
                  key={reply.id}
                  className={`bg-white rounded-2xl border ${getStyleBg(reply.style)} shadow-sm p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-all`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        {getStyleIcon(reply.style)}
                        <h5 className="font-bold text-sm text-slate-900">
                          {reply.style}
                        </h5>
                      </div>

                      <button
                        onClick={() => setEditingId(isEditing ? null : reply.id)}
                        className="text-[11px] font-medium text-slate-500 hover:text-sky-600 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        {isEditing ? (t.replyGen.doneBtn || 'Done') : (t.replyGen.editBtn || 'Edit')}
                      </button>
                    </div>

                    {/* Reply Text Body */}
                    {isEditing ? (
                      <textarea
                        rows={5}
                        value={reply.replyText}
                        onChange={(e) => handleTextChange(reply.id, e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-sky-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
                      />
                    ) : (
                      <p className="text-xs text-slate-800 leading-relaxed font-medium bg-white/80 p-3 rounded-xl border border-slate-200/70 whitespace-pre-line">
                        {reply.replyText}
                      </p>
                    )}

                    {/* When To Use Advice */}
                    <div className="bg-slate-100/70 p-2.5 rounded-xl border border-slate-200/60 text-[11px] text-slate-600 font-medium">
                      <span className="font-bold text-slate-800 block mb-0.5">💡 {t.replyGen.bestUsedFor}:</span>
                      {reply.whenToUse}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => copyReplyText(reply.replyText, reply.id)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-sky-900 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{t.replyGen.copiedBtn || t.replyGen.copied}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{t.replyGen.copyReplyBtn || t.replyGen.copyReply}</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        onSaveItem(`Reply (${reply.style}): ${business.name}`, reply, 'reply');
                        onShowToast(t.replyGen.toastSaved);
                      }}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      title={t.replyGen.saveTooltip || 'Save'}
                    >
                      <Bookmark className="w-4 h-4 text-amber-600" />
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

