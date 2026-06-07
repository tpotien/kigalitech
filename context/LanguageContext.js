import { createContext, useContext, useState, useEffect } from 'react';
import { t as translate } from '../lib/i18n';

const LanguageContext = createContext({ lang: 'en', setLang: () => {}, t: (key) => key });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    if (typeof window === 'undefined') return 'en';
    const saved = localStorage.getItem('lang');
    return saved && ['en', 'fr', 'rw'].includes(saved) ? saved : 'en';
  });

  function setLang(l) {
    setLangState(l);
    localStorage.setItem('lang', l);
  }

  const t = (key, vars) => translate(lang, key, vars);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
