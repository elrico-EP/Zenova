import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { useTranslations } from '../hooks/useTranslations';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: t.lang_en, flag: '🇬🇧' },
    { code: 'es', label: t.lang_es, flag: '🇪🇸' },
    { code: 'fr', label: t.lang_fr, flag: '🇫🇷' },
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 flex items-center gap-2 text-sm font-medium bg-white/10 border border-white/20 rounded-md shadow-sm hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white transition-colors text-white"
      >
        <span>{currentLang.flag}</span>
        <span className="hidden sm:inline">{currentLang.label}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 origin-top-right rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
          <div className="py-1">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-3"
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
