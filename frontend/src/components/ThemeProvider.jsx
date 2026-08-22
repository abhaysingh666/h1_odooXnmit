import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'dayflow-theme';
const ThemeContext = createContext(null);

function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(theme) {
  const dark = theme === 'dark' || (theme === 'system' && systemPrefersDark());
  document.documentElement.classList.toggle('dark', dark);
  return dark;
}

/**
 * Theme state for the Amethyst Haze light/dark palettes. The initial class is
 * set by the inline script in index.html to avoid a flash; this provider keeps
 * it in sync afterwards.
 */
export function ThemeProvider({ children, defaultTheme = 'system' }) {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  const [isDark, setIsDark] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    setIsDark(applyTheme(theme));

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Private-mode browsers can reject writes; the in-memory value still works.
    }
  }, [theme]);

  // Follow the OS when the user hasn't picked an explicit theme.
  useEffect(() => {
    if (theme !== 'system') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setIsDark(applyTheme('system'));

    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = useCallback((next) => setThemeState(next), []);

  const toggleTheme = useCallback(() => {
    setThemeState(() => (document.documentElement.classList.contains('dark') ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, isDark }),
    [theme, setTheme, toggleTheme, isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
