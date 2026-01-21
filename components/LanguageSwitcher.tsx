import React from 'react';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { useTranslations } from '../hooks/useTranslations';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const t = useTranslations();

  const buttonClasses = "px-2 py-1 text-xs font-bold rounded-md transition-colors w-9";
  const activeClasses = "bg-white text-zen-800 shadow-sm";
  const inactiveClasses = "bg-transparent text-white hover:bg-white/20";

  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] text-zen-200 mb-1 font-medium uppercase tracking-wider">{t.languageLabel}</span>
      <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg">
        <button
          onClick={() => setLanguage('en')}
          className={`${buttonClasses} ${language === 'en' ? activeClasses : inactiveClasses}`}
          aria-pressed={language === 'en'}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage('es')}
          className={`${buttonClasses} ${language === 'es' ? activeClasses : inactiveClasses}`}
          aria-pressed={language === 'es'}
        >
          ES
        </button>
        <button
          onClick={() => setLanguage('fr')}
          className={`${buttonClasses} ${language === 'fr' ? activeClasses : inactiveClasses}`}
          aria-pressed={language === 'fr'}
        >
          FR
        </button>
      </div>
    </div>
  );
};