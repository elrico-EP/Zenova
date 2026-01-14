
import { useLanguage } from '../contexts/LanguageContext';
import { locales } from '../translations/locales';

export const useTranslations = () => {
  const { language } = useLanguage();
  return locales[language];
};
