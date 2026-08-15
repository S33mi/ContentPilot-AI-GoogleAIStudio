import React, { useState, useEffect } from 'react';
import { BusinessProfile, GenerationMode, SavedItem } from './types';
import { PRESET_BUSINESSES, PresetBusiness } from './data/presets';
import { Header } from './components/Header';
import { HowItWorks } from './components/HowItWorks';
import { BusinessForm } from './components/BusinessForm';
import { GenerationModeSelector } from './components/GenerationModeSelector';
import { SocialGenerator } from './components/SocialGenerator';
import { ProductGenerator } from './components/ProductGenerator';
import { ReplyGenerator } from './components/ReplyGenerator';
import { PresetSelectorModal } from './components/PresetSelectorModal';
import { SavedLibraryModal } from './components/SavedLibraryModal';
import { PricingModal } from './components/PricingModal';
import { LegalModal, LegalSection } from './components/LegalModal';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { Sparkles, ShieldCheck, Zap, LogIn, Crown, Cloud } from 'lucide-react';
import { useLanguage } from './i18n/LanguageContext';
import { useAuth } from './context/AuthContext';

const LOCAL_STORAGE_KEY_SAVED = 'contentpilot_saved_items_v1';
const LOCAL_STORAGE_KEY_PROFILE = 'contentpilot_active_profile_v1';

export default function App() {
  const { t } = useLanguage();
  const { user, userProfile, signInWithGoogle, usageStatus, isPaidUser, saveCloudItem } = useAuth();

  // Initial business profile from preset or local storage
  const [business, setBusiness] = useState<BusinessProfile>(() => {
    const savedProfile = localStorage.getItem(LOCAL_STORAGE_KEY_PROFILE);
    if (savedProfile) {
      try {
        return JSON.parse(savedProfile);
      } catch (e) {
        // Fallback
      }
    }
    return PRESET_BUSINESSES[0].profile; // Default to The Daily Grind Cafe
  });

  const [activePresetId, setActivePresetId] = useState<string>(PRESET_BUSINESSES[0].id);
  const [activePresetObj, setActivePresetObj] = useState<PresetBusiness | undefined>(PRESET_BUSINESSES[0]);
  const [generationMode, setGenerationMode] = useState<GenerationMode>('social');

  // Modals & Toast
  const [isPresetsOpen, setIsPresetsOpen] = useState<boolean>(false);
  const [isSavedOpen, setIsSavedOpen] = useState<boolean>(false);
  const [isPricingOpen, setIsPricingOpen] = useState<boolean>(false);
  const [isLegalOpen, setIsLegalOpen] = useState<boolean>(false);
  const [legalSection, setLegalSection] = useState<LegalSection>('terms');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Direct Route & Compliance URL Detection (/terms, /privacy, /refund, /contact, /pricing)
  useEffect(() => {
    const handleRoute = () => {
      if (typeof window === 'undefined') return;
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
      if (path === '/terms' || path === '/terms-of-service') {
        setLegalSection('terms');
        setIsLegalOpen(true);
      } else if (path === '/privacy' || path === '/privacy-policy') {
        setLegalSection('privacy');
        setIsLegalOpen(true);
      } else if (path === '/refund' || path === '/refunds' || path === '/refund-policy') {
        setLegalSection('refund');
        setIsLegalOpen(true);
      } else if (path === '/contact' || path === '/support') {
        setLegalSection('contact');
        setIsLegalOpen(true);
      } else if (path === '/pricing' || path === '/plans') {
        setIsPricingOpen(true);
      }
    };

    handleRoute();
    window.addEventListener('popstate', handleRoute);
    return () => window.removeEventListener('popstate', handleRoute);
  }, []);

  const handleOpenLegal = (section: LegalSection) => {
    setLegalSection(section);
    setIsLegalOpen(true);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `/${section}`);
    }
  };

  const handleCloseLegal = () => {
    setIsLegalOpen(false);
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
      if (['/terms', '/privacy', '/refund', '/refunds', '/refund-policy', '/contact', '/support'].includes(path)) {
        window.history.pushState(null, '', '/');
      }
    }
  };

  const handleOpenPricing = () => {
    setIsPricingOpen(true);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/pricing');
    }
  };

  const handleClosePricing = () => {
    setIsPricingOpen(false);
    if (typeof window !== 'undefined' && (window.location.pathname === '/pricing' || window.location.pathname === '/plans')) {
      window.history.pushState(null, '', '/');
    }
  };

  // Saved Items State (Local Browser Storage)
  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY_SAVED);
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Persist active profile changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_PROFILE, JSON.stringify(business));
  }, [business]);

  // Persist saved items
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_SAVED, JSON.stringify(savedItems));
  }, [savedItems]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectPreset = (preset: PresetBusiness) => {
    setBusiness(preset.profile);
    setActivePresetId(preset.id);
    setActivePresetObj(preset);
    showToast(`Loaded preset: "${preset.label}"`);
  };

  const handleResetProfile = () => {
    setBusiness({
      name: '',
      type: '',
      location: '',
      description: '',
      targetAudience: '',
      brandTone: 'Friendly & Warm',
      workingHours: '',
    });
    setActivePresetId('');
    setActivePresetObj(undefined);
    showToast('Business form cleared.');
  };

  const handleSaveItem = async (title: string, content: any, type: GenerationMode) => {
    const newItem: SavedItem = {
      id: `save_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      type,
      businessName: business.name || 'My Business',
      title,
      content,
    };
    setSavedItems((prev) => [newItem, ...prev]);

    if (isPaidUser) {
      await saveCloudItem(newItem);
      showToast('Saved to Cloud Library!');
    } else {
      showToast(t.socialGen.toastSaved);
    }
  };

  const handleDeleteSavedItem = (id: string) => {
    setSavedItems((prev) => prev.filter((item) => item.id !== id));
    showToast('Item removed from library.');
  };

  const handleClearAllSaved = () => {
    if (window.confirm('Are you sure you want to clear all saved library items?')) {
      setSavedItems([]);
      showToast('Saved library cleared.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 font-sans flex flex-col antialiased">
      {/* Top Navigation Bar */}
      <Header
        business={business}
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenSaved={() => setIsSavedOpen(true)}
        onOpenPricing={() => setIsPricingOpen(true)}
        onReset={handleResetProfile}
        savedCount={savedItems.length}
      />

      {/* Guest or Free Usage Alert Banner */}
      {!usageStatus.canGenerate && (
        <div className="bg-gradient-to-r from-amber-500 via-indigo-600 to-indigo-700 text-white px-4 py-3 shadow-md flex items-center justify-between gap-4 flex-wrap text-xs sm:text-sm">
          <div className="flex items-center gap-2 max-w-3xl">
            <Crown className="w-5 h-5 text-amber-300 shrink-0" />
            <div>
              <span className="font-bold">Generation Limit Reached: </span>
              <span>{usageStatus.reason || 'Upgrade your plan to unlock more generations!'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!user ? (
              <button
                onClick={signInWithGoogle}
                className="px-3.5 py-1.5 rounded-xl bg-white text-indigo-900 font-bold hover:bg-slate-100 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 text-xs"
              >
                <LogIn className="w-3.5 h-3.5 text-indigo-600" /> Sign in with Google (+3 Free)
              </button>
            ) : (
              <button
                onClick={() => setIsPricingOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold transition-colors shadow-xs cursor-pointer text-xs"
              >
                Upgrade Plan Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hero / Quick Presets Ribbon */}
      <section className="bg-gradient-to-b from-indigo-900 via-slate-900 to-slate-900 text-white py-8 px-4 sm:px-6 lg:px-8 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> {t.hero.badge}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {t.hero.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t.hero.subtitle}
            </p>
          </div>

          {/* Quick Preset Selector Buttons */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-2.5 shrink-0 max-w-md">
            <div className="flex items-center justify-between text-xs text-slate-200 font-semibold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {t.hero.quickTestLabel}
              </span>
              <button
                onClick={() => setIsPresetsOpen(true)}
                className="text-indigo-300 hover:text-white underline text-[11px] cursor-pointer"
              >
                {t.hero.seeAll}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {PRESET_BUSINESSES.slice(0, 3).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className={`text-xs px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer font-medium ${
                    activePresetId === p.id
                      ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-xs'
                      : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/10'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Workspace Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8 w-full">
        {/* Step 0: How It Works Banner */}
        <HowItWorks />

        {/* Step 1: Business Profile Form */}
        <section id="business-profile">
          <BusinessForm
            business={business}
            onChange={setBusiness}
            onOpenPresets={() => setIsPresetsOpen(true)}
          />
        </section>

        {/* Step 2: Prominent Generation Options */}
        <section id="generation-options" className="space-y-6">
          <GenerationModeSelector
            activeMode={generationMode}
            onSelectMode={setGenerationMode}
          />

          {/* Step 3: Active Generator View */}
          <div className="pt-2">
            {generationMode === 'social' && (
              <SocialGenerator
                business={business}
                onShowToast={showToast}
                onSaveItem={handleSaveItem}
                onOpenPricing={() => setIsPricingOpen(true)}
              />
            )}

            {generationMode === 'product' && (
              <ProductGenerator
                business={business}
                onShowToast={showToast}
                onSaveItem={handleSaveItem}
                onOpenPricing={() => setIsPricingOpen(true)}
                initialSampleProduct={activePresetObj?.sampleProduct}
              />
            )}

            {generationMode === 'reply' && (
              <ReplyGenerator
                business={business}
                onShowToast={showToast}
                onSaveItem={handleSaveItem}
                onOpenPricing={() => setIsPricingOpen(true)}
                initialSampleReply={activePresetObj?.sampleReply}
              />
            )}
          </div>
        </section>
      </main>

      {/* Modals & Toasts */}
      <PresetSelectorModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onSelectPreset={handleSelectPreset}
        activePresetId={activePresetId}
      />

      <SavedLibraryModal
        isOpen={isSavedOpen}
        onClose={() => setIsSavedOpen(false)}
        savedItems={savedItems}
        onDeleteItem={handleDeleteSavedItem}
        onClearAll={handleClearAllSaved}
        onShowToast={showToast}
        onOpenPricing={handleOpenPricing}
      />

      <PricingModal
        isOpen={isPricingOpen}
        onClose={handleClosePricing}
        onShowToast={showToast}
      />

      <LegalModal
        isOpen={isLegalOpen}
        initialSection={legalSection}
        onClose={handleCloseLegal}
      />

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Footer */}
      <Footer
        onOpenLegal={handleOpenLegal}
        onOpenPricing={handleOpenPricing}
        onOpenPresets={() => setIsPresetsOpen(true)}
      />
    </div>
  );
}
