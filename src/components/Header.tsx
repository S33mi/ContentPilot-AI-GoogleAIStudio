import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Bookmark, RotateCcw, Building2, Wand2, Globe, ChevronDown, Check, LogIn, LogOut, Crown, User as UserIcon, Cloud, Zap } from 'lucide-react';
import { BusinessProfile } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { LANGUAGES, LanguageCode } from '../i18n/languages';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  business: BusinessProfile;
  onOpenPresets: () => void;
  onOpenSaved: () => void;
  onOpenPricing: () => void;
  onReset: () => void;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  business,
  onOpenPresets,
  onOpenSaved,
  onOpenPricing,
  onReset,
  savedCount,
}) => {
  const { languageCode, language, setLanguageCode, t } = useLanguage();
  const { user, userProfile, signInWithGoogle, signOut, usageStatus, isPaidUser } = useAuth();
  
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isProfileConfigured = Boolean(business.name && business.type);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Formatted Plan Name with billing cycle (e.g. Starter Monthly, Starter Yearly)
  const getFormattedPlan = () => {
    if (!userProfile || userProfile.plan === 'guest') return 'Guest';
    if (userProfile.plan === 'free') return 'Free Plan';
    const tierName = userProfile.plan.charAt(0).toUpperCase() + userProfile.plan.slice(1);
    const cycleName = userProfile.billingCycle === 'yearly' ? 'Yearly' : 'Monthly';
    return `${tierName} ${cycleName}`;
  };

  const planName = getFormattedPlan();

  const planBadgeBg =
    userProfile?.plan === 'unlimited'
      ? 'bg-rose-100 text-rose-800 border-rose-300'
      : userProfile?.plan === 'pro'
      ? 'bg-amber-100 text-amber-800 border-amber-300'
      : userProfile?.plan === 'starter'
      ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
      : userProfile?.plan === 'free'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
      : 'bg-slate-100 text-slate-700 border-slate-300';

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                ContentPilot <span className="bg-gradient-to-r from-indigo-600 to-sky-600 bg-clip-text text-transparent font-extrabold">AI</span>
              </h1>
              <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                <Sparkles className="w-3 h-3 text-indigo-500" /> Gemini 3.6
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden md:block">
              {t.header.subtitle}
            </p>
          </div>
        </div>

        {/* Middle Status & Usage Indicator */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Plan & Usage Pills */}
          <button
            onClick={onOpenPricing}
            className="flex items-center gap-2 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200 rounded-full px-3 py-1 cursor-pointer transition-colors"
            title="Click to manage subscription plan"
          >
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${planBadgeBg}`}>
              {planName}
            </span>

            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              {usageStatus.remainingText}
            </span>
          </button>

          <button
            onClick={onOpenPricing}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white shadow-xs transition-all cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Pricing & Plans</span>
          </button>
        </div>

        {/* Right Actions: Auth, Presets, Library & Language */}
        <div className="flex items-center gap-1.5 sm:gap-2">

          {/* User Auth Section */}
          {!user ? (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Sign in with Google</span>
              <span className="xs:hidden">Sign In</span>
            </button>
          ) : (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200/90 text-slate-800 text-xs font-semibold transition-all cursor-pointer"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline max-w-[100px] truncate font-bold">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {/* User Menu Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 ltr:right-0 rtl:left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 overflow-hidden">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {user.displayName || 'ContentPilot User'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <div className="mt-2 flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Active Plan</span>
                        <span className="text-xs font-extrabold text-indigo-700">{planName}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                        <span className="text-[11px] font-semibold text-slate-700">{usageStatus.remainingText}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-1 space-y-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenPricing();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer"
                    >
                      <Crown className="w-4 h-4 text-amber-500" />
                      Manage Plan / Upgrade
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Language Selector Dropdown */}
          <div className="relative" ref={langDropdownRef}>
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-xs border border-slate-700 transition-all cursor-pointer"
              title={t.header.selectLanguage}
            >
              <span className="text-sm">{language.flag}</span>
              <span className="hidden sm:inline font-semibold">{language.nativeName}</span>
              <span className="sm:hidden uppercase font-extrabold">{language.code}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 ltr:right-0 rtl:left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Globe className="w-3 h-3 text-indigo-600" /> {t.header.selectLanguage}
                  </span>
                  <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                    11 Languages
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto px-1 space-y-0.5">
                  {LANGUAGES.map((lang) => {
                    const isSelected = languageCode === lang.code;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguageCode(lang.code as LanguageCode);
                          setIsLangOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-900 font-bold'
                            : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base leading-none">{lang.flag}</span>
                          <div className="text-left rtl:text-right">
                            <div className="font-bold leading-tight">{lang.nativeName}</div>
                            {lang.nativeName !== lang.name && (
                              <div className="text-[10px] text-slate-400 font-normal">{lang.name}</div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {lang.dir === 'rtl' && (
                            <span className="text-[9px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                              RTL
                            </span>
                          )}
                          {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Presets Button */}
          <button
            onClick={onOpenPresets}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100/80 border border-indigo-200/70 transition-colors cursor-pointer"
            title="Choose a pre-configured sample business"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">{t.header.tryPresets}</span>
          </button>

          {/* Library Button */}
          <button
            onClick={onOpenSaved}
            className="relative flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
            title="View saved content library"
          >
            {isPaidUser ? <Cloud className="w-3.5 h-3.5 text-indigo-600" /> : <Bookmark className="w-3.5 h-3.5 text-slate-600" />}
            <span className="hidden xs:inline">{t.header.library}</span>
            {savedCount > 0 && (
              <span className="bg-indigo-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {savedCount}
              </span>
            )}
          </button>

          {isProfileConfigured && (
            <button
              onClick={onReset}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title={t.header.resetTooltip}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </header>
  );
};


