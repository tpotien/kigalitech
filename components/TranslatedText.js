import { useState, useEffect, useRef } from 'react';
import { useLang } from '../context/LanguageContext';
import { translateText } from '../lib/translate';

/**
 * Renders text auto-translated to the current site language.
 * Shows original text immediately, swaps in translation as soon as it resolves.
 * Uses localStorage cache — repeat renders are instant.
 */
export default function TranslatedText({ text, children, as: Tag = 'span', className, style }) {
  const src = String(text ?? children ?? '');
  const { lang } = useLang();
  const [out, setOut] = useState(src);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (lang === 'en' || !src) {
      setOut(src);
      return;
    }
    let stale = false;
    translateText(src, lang).then(result => {
      if (!stale && mountedRef.current) setOut(result);
    });
    return () => { stale = true; };
  }, [src, lang]);

  if (Tag === null) return <>{out}</>;
  return <Tag className={className} style={style}>{out}</Tag>;
}
