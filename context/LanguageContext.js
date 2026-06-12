import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { t as translate } from '../lib/i18n';

const LanguageContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
  translating: false,
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    if (typeof window === 'undefined') return 'en';
    const saved = localStorage.getItem('lang');
    return saved && ['en', 'fr', 'rw'].includes(saved) ? saved : 'en';
  });
  const [translating, setTranslating] = useState(false);

  const setLang = useCallback(async (l) => {
    setLangState(l);
    localStorage.setItem('lang', l);
    if (typeof window !== 'undefined') {
      const { translateDOM } = await import('../lib/translate');
      setTranslating(true);
      await translateDOM(l);
      setTranslating(false);
    }
  }, []);

  // Re-apply stored language on first mount (cached translations apply instantly)
  useEffect(() => {
    const saved = localStorage.getItem('lang');
    if (saved && saved !== 'en' && ['fr', 'rw'].includes(saved)) {
      import('../lib/translate').then(({ translateDOM }) => translateDOM(saved));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const t = (key, vars) => translate(lang, key, vars);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, translating }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
