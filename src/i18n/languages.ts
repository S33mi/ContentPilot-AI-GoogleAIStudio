export type LanguageCode =
  | 'en'
  | 'ur'
  | 'ar'
  | 'fa'
  | 'tr'
  | 'fr'
  | 'es'
  | 'de'
  | 'pt'
  | 'id'
  | 'hi';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
  flag: string;
  aiPromptName: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', flag: '🇺🇸', aiPromptName: 'English' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', dir: 'rtl', flag: '🇵🇰', aiPromptName: 'Urdu' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', flag: '🇸🇦', aiPromptName: 'Arabic' },
  { code: 'fa', name: 'Persian (Farsi)', nativeName: 'فارسی', dir: 'rtl', flag: '🇮🇷', aiPromptName: 'Persian (Farsi)' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', dir: 'ltr', flag: '🇹🇷', aiPromptName: 'Turkish' },
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr', flag: '🇫🇷', aiPromptName: 'French' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr', flag: '🇪🇸', aiPromptName: 'Spanish' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr', flag: '🇩🇪', aiPromptName: 'German' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr', flag: '🇧🇷', aiPromptName: 'Portuguese' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', dir: 'ltr', flag: '🇮🇩', aiPromptName: 'Indonesian' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr', flag: '🇮🇳', aiPromptName: 'Hindi' },
];

export const getLanguageByCode = (code: string): LanguageInfo => {
  return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
};
