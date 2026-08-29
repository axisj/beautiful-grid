export const isEn = typeof document !== 'undefined' && document.documentElement.lang === 'en';
export function t<T>(ko: T, en: T): T {
  return isEn ? en : ko;
}
