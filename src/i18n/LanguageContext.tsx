import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode, LanguageInfo, LANGUAGES, getLanguageByCode } from './languages';
import { TRANSLATIONS, TranslationSchema } from './translations';

interface LanguageContextType {
  languageCode: LanguageCode;
  language: LanguageInfo;
  t: TranslationSchema;
  setLanguageCode: (code: LanguageCode) => void;
  isRTL: boolean;
}

const STORAGE_KEY = 'contentpilot_language_v1';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [languageCode, setLanguageCodeState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && LANGUAGES.some((l) => l.code === saved)) {
        return saved as LanguageCode;
      }
    } catch {
      // localStorage might fail in sandbox edge cases
    }
    return 'en';
  });

  const language = getLanguageByCode(languageCode);
  const isRTL = language.dir === 'rtl';

  useEffect(() => {
    // Apply RTL / LTR direction and lang attribute to document HTML element
    document.documentElement.dir = language.dir;
    document.documentElement.lang = language.code;

    // Optional font or alignment adjustments for RTL
    if (isRTL) {
      document.body.classList.add('rtl-mode');
    } else {
      document.body.classList.remove('rtl-mode');
    }

    try {
      localStorage.setItem(STORAGE_KEY, languageCode);
    } catch {
      // ignore
    }
  }, [languageCode, language, isRTL]);

  const setLanguageCode = (code: LanguageCode) => {
    setLanguageCodeState(code);
  };

  const t = TRANSLATIONS[languageCode] || TRANSLATIONS.en;

  return (
    <LanguageContext.Provider value={{ languageCode, language, t, setLanguageCode, isRTL }}>
      <div dir={language.dir} className={isRTL ? 'text-right' : 'text-left'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
