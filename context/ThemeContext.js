import { createContext, useContext, useEffect, useState } from 'react';
const ThemeContext = createContext({});
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme');
      const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      const t = saved || preferred;
      setTheme(t);
      if (t === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    } catch {}
  }, []);
  function toggleTheme() {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('theme', next);
        if (next === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      } catch {}
      return next;
    });
  }
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}
export function useTheme() { return useContext(ThemeContext); }
