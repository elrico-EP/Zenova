import React from 'react';

export type Language = 'es' | 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

const getInitialLanguage = (): Language => {
    try {
        const storedLang = localStorage.getItem('zenova-lang');
        if (storedLang && ['en', 'es', 'fr'].includes(storedLang)) {
            return storedLang as Language;
        }
    } catch (e) {
        console.error("Could not read language from local storage", e);
    }
    return 'en'; // Default to English
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = React.useState<Language>(getInitialLanguage());

  const setLanguage = (lang: Language) => {
      try {
          localStorage.setItem('zenova-lang', lang);
      } catch (e) {
          console.error("Could not save language to local storage", e);
      }
      setLanguageState(lang);
  };

  const value = { language, setLanguage };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = React.useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};