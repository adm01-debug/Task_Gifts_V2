/**
 * useI18n Hook
 * Provides internationalization functionality for the application
 */

import { useState, useCallback, useMemo, useEffect, createContext, useContext } from 'react';
import { 
  translations, 
  defaultLocale, 
  SupportedLocale, 
  Translations 
} from '@/i18n/translations';

interface I18nContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: Translations;
  formatNumber: (value: number) => string;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatRelativeTime: (date: Date | string) => string;
  supportedLocales: SupportedLocale[];
}

const LOCALE_STORAGE_KEY = 'app-locale';

/**
 * Detects the user's preferred locale from browser settings
 */
function detectBrowserLocale(): SupportedLocale {
  if (typeof navigator === 'undefined') return defaultLocale;
  
  const browserLocale = navigator.language;
  
  // Check for exact match
  if (browserLocale in translations) {
    return browserLocale as SupportedLocale;
  }
  
  // Check for language match (e.g., 'en' matches 'en-US')
  const languageCode = browserLocale.split('-')[0];
  const matchedLocale = Object.keys(translations).find(
    locale => locale.startsWith(languageCode)
  ) as SupportedLocale | undefined;
  
  return matchedLocale || defaultLocale;
}

/**
 * Gets the stored locale from localStorage
 */
function getStoredLocale(): SupportedLocale | null {
  if (typeof localStorage === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && stored in translations) {
      return stored as SupportedLocale;
    }
  } catch {
    // localStorage might be unavailable
  }
  
  return null;
}

/**
 * Main i18n hook
 */
export function useI18n(): I18nContextValue {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    return getStoredLocale() || detectBrowserLocale();
  });

  // Persist locale changes
  const setLocale = useCallback((newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    } catch {
      // localStorage might be unavailable
    }
  }, []);

  // Get translations for current locale
  const t = useMemo(() => translations[locale], [locale]);

  // Format number according to locale
  const formatNumber = useCallback((value: number): string => {
    return new Intl.NumberFormat(locale).format(value);
  }, [locale]);

  // Format date according to locale
  const formatDate = useCallback((
    date: Date | string, 
    options?: Intl.DateTimeFormatOptions
  ): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  }, [locale]);

  // Format relative time (e.g., "2 hours ago")
  const formatRelativeTime = useCallback((date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 60) return t.time.now;
    if (diffMinutes < 60) return `${diffMinutes} ${t.time.minutesAgo}`;
    if (diffHours < 24) return `${diffHours} ${t.time.hoursAgo}`;
    if (diffDays < 7) return `${diffDays} ${t.time.daysAgo}`;
    if (diffWeeks < 4) return `${diffWeeks} ${t.time.weeksAgo}`;
    if (diffMonths < 12) return `${diffMonths} ${t.time.monthsAgo}`;
    return `${diffYears} ${t.time.yearsAgo}`;
  }, [t, locale]);

  // List of supported locales
  const supportedLocales = useMemo(
    () => Object.keys(translations) as SupportedLocale[],
    []
  );

  // Update document lang attribute
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return {
    locale,
    setLocale,
    t,
    formatNumber,
    formatDate,
    formatRelativeTime,
    supportedLocales,
  };
}

// Context for global i18n state
const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider = I18nContext.Provider;

export function useI18nContext(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18nContext must be used within an I18nProvider');
  }
  return context;
}

// Locale display names
export const localeDisplayNames: Record<SupportedLocale, string> = {
  'pt-BR': 'Português (Brasil)',
  'en-US': 'English (US)',
  'es-ES': 'Español',
};

// Locale flags for UI
export const localeFlags: Record<SupportedLocale, string> = {
  'pt-BR': '🇧🇷',
  'en-US': '🇺🇸',
  'es-ES': '🇪🇸',
};
