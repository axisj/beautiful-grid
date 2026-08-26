export const supportedLocales = ['ko', 'en'] as const;

export type Locale = (typeof supportedLocales)[number];
export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

export const defaultLocale: Locale = 'ko';
export const themeStorageKey = 'bgrid-site-theme';
export const localeStorageKey = 'bgrid-site-locale';

export const localeMeta: Record<Locale, { htmlLang: string; ogLocale: string; label: string; shortLabel: string }> = {
  ko: { htmlLang: 'ko', ogLocale: 'ko_KR', label: '한국어', shortLabel: 'KO' },
  en: { htmlLang: 'en', ogLocale: 'en_US', label: 'English', shortLabel: 'EN' },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && supportedLocales.includes(value as Locale);
}

export function normalizeLocale(value: unknown): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export function localeFromPath(pathname: string): Locale {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'ko';
}

export function stripLocalePrefix(pathname: string): string {
  if (pathname === '/en') return '/';
  if (pathname.startsWith('/en/')) return pathname.slice(3) || '/';
  return pathname || '/';
}

export function localizePath(path: string, locale: Locale): string {
  if (!path || /^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith('mailto:') || path.startsWith('#')) {
    return path;
  }

  const match = path.match(/^([^?#]*)([?#].*)?$/);
  const pathname = stripLocalePrefix(match?.[1] || '/');
  const suffix = match?.[2] || '';

  if (locale === 'ko') return `${pathname || '/'}${suffix}`;
  if (pathname === '/') return `/en/${suffix}`;
  return `/en${pathname.startsWith('/') ? pathname : `/${pathname}`}${suffix}`;
}

export function localeAlternates(path: string): Record<Locale, string> {
  return {
    ko: localizePath(path, 'ko'),
    en: localizePath(path, 'en'),
  };
}

export const commonMessages = {
  ko: {
    home: '홈',
    primaryNavigation: '주요 메뉴',
    mobileNavigation: '모바일 메뉴',
    openMenu: '메뉴 열기',
    closeMenu: '메뉴 닫기',
    guideExamples: '가이드 & 예제',
    adoptionGuide: '지원 환경',
    openSource: '오픈소스',
    theme: '테마',
    themeMenu: '테마 선택',
    themeLight: '라이트',
    themeDark: '다크',
    themeSystem: '시스템',
    changeLanguage: '영어로 보기',
    github: 'GitHub',
  },
  en: {
    home: 'Home',
    primaryNavigation: 'Primary navigation',
    mobileNavigation: 'Mobile navigation',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    guideExamples: 'Learn & Examples',
    adoptionGuide: 'Product Facts',
    openSource: 'Open Source',
    theme: 'Theme',
    themeMenu: 'Choose theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    changeLanguage: '한국어로 보기',
    github: 'GitHub',
  },
} as const;
