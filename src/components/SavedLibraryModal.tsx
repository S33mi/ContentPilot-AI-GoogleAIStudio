import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bookmark, Trash2, Copy, Check, Calendar, ShoppingBag, MessageSquareText, Download, Cloud, RefreshCw, Crown, FileText, FileSpreadsheet, File } from 'lucide-react';
import { SavedItem } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { exportSocialPack, exportProductDescription, exportCustomerReplies } from '../lib/exportUtils';

interface SavedLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedItems: SavedItem[];
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
  onShowToast: (msg: string) => void;
  onOpenPricing: () => void;
}

export const SavedLibraryModal: React.FC<SavedLibraryModalProps> = ({
  isOpen,
  onClose,
  savedItems: localSavedItems,
  onDeleteItem,
  onClearAll,
  onShowToast,
  onOpenPricing,
}) => {
  const { t } = useLanguage();
  const { isPaidUser, cloudSavedItems, deleteCloudItem, clearAllCloudItems, syncLocalToCloud } = useAuth();
  
  const [filter, setFilter] = useState<'all' | 'social' | 'product' | 'reply'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Active items list: if paid user, use cloudSavedItems combined with any unsynced local items
  const activeItems = isPaidUser ? cloudSavedItems : localSavedItems;

  const filteredItems = activeItems.filter((item) =>
    filter === 'all' ? true : item.type === filter
  );

  const handleSyncToCloud = async () => {
    if (!isPaidUser) return;
    setIsSyncing(true);
    try {
      const syncedCount = await syncLocalToCloud(localSavedItems);
      onShowToast(`Uploaded ${syncedCount} local item(s) to Cloud Library!`);
    } catch (e) {
      onShowToast('Error syncing items to Cloud Library');
    } finally {
      setIsSyncing(false);
    }
  };

  const copyItemContent = (item: SavedItem) => {
    let copyText = '';
    if (item.type === 'social') {
      const posts = item.content.posts || [];
      copyText = `=== 7-Day Social Pack (${item.content.weeklyTheme}) ===\n\n` +
        posts.map((p: any) => `${p.dayLabel} [${p.theme}]\nCaption: ${p.caption}\nHashtags: ${p.hashtags.join(' ')}\nCTA: ${p.callToAction}`).join('\n\n---\n\n');
    } else if (item.type === 'product') {
      copyText = `${item.content.title}\n"${item.content.tagline}"\n\n${item.content.description}\n\nHighlights:\n${(item.content.bulletBenefits || []).map((b: string) => `• ${b}`).join('\n')}\n\nCTA: ${item.content.suggestedCallToAction}`;
    } else if (item.type === 'reply') {
      copyText = item.content.replyText || JSON.stringify(item.content, null, 2);
    } else {
      copyText = JSON.stringify(item.content, null, 2);
    }

    navigator.clipboard.writeText(copyText);
    setCopiedId(item.id);
    onShowToast('Copied item content to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportItem = async (item: SavedItem, format: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'json') => {
    try {
      if (item.type === 'social') {
        await exportSocialPack(item.content, item.businessName, format);
      } else if (item.type === 'product') {
        await exportProductDescription(item.content, item.title, format);
      } else if (item.type === 'reply') {
        await exportCustomerReplies(item.content, 'SavedReply', format);
      }
      onShowToast(`Exported as .${format.toUpperCase()}`);
    } catch (e) {
      onShowToast('Export failed');
    }
  };

  const exportAsJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeItems, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `contentpilot_saved_library_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast('Library exported to JSON file!');
  };

  const handleDelete = async (id: string) => {
    if (isPaidUser) {
      await deleteCloudItem(id);
    }
    onDeleteItem(id);
  };

  const handleClear = async () => {
    if (isPaidUser) {
      await clearAllCloudItems();
    }
    onClearAll();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                {isPaidUser ? (
                  <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                    <Cloud className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                    <Bookmark className="w-5 h-5 text-indigo-600" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">
                      {isPaidUser ? 'Cloud Saved Library' : t.libraryModal.title}
                    </h3>
                    {isPaidUser ? (
                      <span className="text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Cloud className="w-3 h-3 text-indigo-600" /> Firestore Cloud Sync
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full">
                        Local Only
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {isPaidUser
                      ? 'Your saved posts, product descriptions, and replies are backed up securely in Firestore.'
                      : t.libraryModal.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isPaidUser && localSavedItems.length > 0 && (
                  <button
                    onClick={handleSyncToCloud}
                    disabled={isSyncing}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-indigo-200"
                    title="Upload local browser items to Firestore Cloud"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} /> Sync Local
                  </button>
                )}

                {activeItems.length > 0 && (
                  <button
                    onClick={exportAsJSON}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Export all saved items to JSON"
                  >
                    <Download className="w-3.5 h-3.5" /> {t.libraryModal.export}
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Paid Banner Prompt for Non-Paid Users */}
            {!isPaidUser && (
              <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-amber-500/10 border-b border-indigo-100 p-3 px-6 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-800">
                  <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Local Browser Storage:</strong> Items saved here are stored in your browser. Upgrade to Starter, Pro, or Unlimited for <strong>Cloud Sync across devices</strong>!
                  </span>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenPricing();
                  }}
                  className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold shrink-0 hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
                >
                  Upgrade to Cloud
                </button>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="px-6 py-3 border-b border-slate-100 bg-white flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-1.5">
                {(['all', 'social', 'product', 'reply'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFilter(mode)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                      filter === mode
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {mode === 'all' && t.libraryModal.allSaved}
                    {mode === 'social' && t.libraryModal.social}
                    {mode === 'product' && t.libraryModal.product}
                    {mode === 'reply' && t.libraryModal.reply}
                  </button>
                ))}
              </div>

              {activeItems.length > 0 && (
                <button
                  onClick={handleClear}
                  className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors cursor-pointer shrink-0"
                >
                  {t.libraryModal.clearAll}
                </button>
              )}
            </div>

            {/* Content List */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Bookmark className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">{t.libraryModal.noItems}</p>
                  <p className="text-xs">{t.libraryModal.noItemsSub}</p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex items-start justify-between gap-4 hover:border-slate-300 transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 flex items-center gap-1">
                          {item.type === 'social' && <Calendar className="w-3 h-3 text-indigo-600" />}
                          {item.type === 'product' && <ShoppingBag className="w-3 h-3 text-emerald-600" />}
                          {item.type === 'reply' && <MessageSquareText className="w-3 h-3 text-sky-600" />}
                          {item.type}
                        </span>
                        {item.isCloud && (
                          <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 flex items-center gap-0.5">
                            <Cloud className="w-2.5 h-2.5" /> Cloud
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-medium">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {item.title}
                      </h4>

                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {t.libraryModal.business} <span className="font-semibold text-slate-700">{item.businessName}</span>
                      </p>

                      {/* Quick Export buttons */}
                      <div className="flex items-center gap-1.5 mt-2.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Export:</span>
                        <button
                          onClick={() => exportItem(item, 'pdf')}
                          className="px-2 py-0.5 rounded bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold transition-colors cursor-pointer border border-red-200 flex items-center gap-0.5"
                          title="Download PDF"
                        >
                          <FileText className="w-2.5 h-2.5" /> PDF
                        </button>
                        <button
                          onClick={() => exportItem(item, 'docx')}
                          className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold transition-colors cursor-pointer border border-blue-200 flex items-center gap-0.5"
                          title="Download Word (.docx)"
                        >
                          <FileText className="w-2.5 h-2.5" /> DOCX
                        </button>
                        <button
                          onClick={() => exportItem(item, 'xlsx')}
                          className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold transition-colors cursor-pointer border border-emerald-200 flex items-center gap-0.5"
                          title="Download Excel (.xlsx)"
                        >
                          <FileSpreadsheet className="w-2.5 h-2.5" /> XLSX
                        </button>
                        <button
                          onClick={() => exportItem(item, 'csv')}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors cursor-pointer border border-slate-200 flex items-center gap-0.5"
                          title="Download CSV"
                        >
                          <File className="w-2.5 h-2.5" /> CSV
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => copyItemContent(item)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-indigo-900 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {t.libraryModal.copy}
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete saved item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
              <span>{activeItems.length} saved item(s) in {isPaidUser ? 'Cloud Library' : 'local storage'}</span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {t.libraryModal.close}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

