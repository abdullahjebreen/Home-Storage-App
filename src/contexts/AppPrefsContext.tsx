import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Language } from '@/lib/i18n';

type Theme = 'light' | 'dark';

type AppPrefsContextValue = {
  language: Language;
  theme: Theme;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const AppPrefsContext = createContext<AppPrefsContextValue | undefined>(undefined);

export function AppPrefsProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('homestore-lang');
    return stored === 'ar' ? 'ar' : 'en';
  });
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('homestore-theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const setLanguage = (lang: Language) => {
    localStorage.setItem('homestore-lang', lang);
    setLanguageState(lang);
  };

  const setTheme = (t: Theme) => {
    localStorage.setItem('homestore-theme', t);
    setThemeState(t);
  };

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <AppPrefsContext.Provider value={{ language, theme, setLanguage, setTheme, toggleTheme }}>
      {children}
    </AppPrefsContext.Provider>
  );
}

export function useAppPrefs() {
  const ctx = useContext(AppPrefsContext);
  if (!ctx) throw new Error('useAppPrefs must be used within AppPrefsProvider');
  return ctx;
}
