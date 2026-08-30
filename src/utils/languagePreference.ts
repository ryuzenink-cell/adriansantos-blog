import type { Language } from '../types';

export type LanguageFilter = Language | 'all';

export interface LanguagePreference {
  filter: LanguageFilter;
  interfaceLanguage: Language;
}

const FILTER_KEY = 'adriansantos.blog.languageFilter';
const INTERFACE_KEY = 'adriansantos.blog.interfaceLanguage';
const LEGACY_KEY = 'adriansantos_blog_lang';

function isLanguage(value: string | null): value is Language {
  return value === 'pt' || value === 'en';
}

function isLanguageFilter(value: string | null): value is LanguageFilter {
  return value === 'all' || isLanguage(value);
}

function browserLanguage(): Language {
  if (typeof navigator === 'undefined') return 'en';
  return navigator.language.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

export function getLanguagePreference(): LanguagePreference {
  const detected = browserLanguage();
  if (typeof window === 'undefined') {
    return { filter: detected, interfaceLanguage: detected };
  }

  try {
    const savedFilter = localStorage.getItem(FILTER_KEY);
    const legacyFilter = localStorage.getItem(LEGACY_KEY);
    const filter = isLanguageFilter(savedFilter)
      ? savedFilter
      : isLanguage(legacyFilter)
        ? legacyFilter
        : detected;
    const savedInterface = localStorage.getItem(INTERFACE_KEY);
    const interfaceLanguage = isLanguage(savedInterface)
      ? savedInterface
      : filter === 'all'
        ? detected
        : filter;

    return { filter, interfaceLanguage };
  } catch {
    return { filter: detected, interfaceLanguage: detected };
  }
}

export function saveLanguagePreference(preference: LanguagePreference): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FILTER_KEY, preference.filter);
    localStorage.setItem(INTERFACE_KEY, preference.interfaceLanguage);
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // Storage can be unavailable in strict privacy modes; state still works in memory.
  }
}

export function preferenceAfterSelection(
  current: LanguagePreference,
  filter: LanguageFilter,
): LanguagePreference {
  return {
    filter,
    interfaceLanguage: filter === 'all' ? current.interfaceLanguage : filter,
  };
}
