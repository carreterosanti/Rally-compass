import { useEffect } from 'react';
import type { Theme } from './usePersistence';

const THEME_COLOR: Record<Theme, string> = {
  dark: '#0d0b08',
  light: '#ffffff',
};

/** Apply the theme to <html> so the CSS variables in app.css switch over. */
export function useTheme(theme: Theme) {
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
  }, [theme]);
}
