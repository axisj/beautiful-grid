import { themeStorageKey } from './index';

export const themeBootstrapScript = `(() => {
  const storageKey = '${themeStorageKey}';
  const valid = new Set(['light', 'dark', 'system']);
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const readPreference = () => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      return valid.has(stored) ? stored : 'system';
    } catch {
      return 'system';
    }
  };
  const resolve = (preference) => preference === 'system' ? (media.matches ? 'dark' : 'light') : preference;
  const apply = (preference, persist = false) => {
    const safePreference = valid.has(preference) ? preference : 'system';
    const resolved = resolve(safePreference);
    const root = document.documentElement;
    root.dataset.themePreference = safePreference;
    root.dataset.theme = resolved;
    root.style.colorScheme = resolved;
    root.dataset.themeReady = 'true';
    if (persist) {
      try { window.localStorage.setItem(storageKey, safePreference); } catch {}
    }
    window.dispatchEvent(new CustomEvent('bgrid-site-theme-change', {
      detail: { preference: safePreference, resolved },
    }));
  };
  const setPreference = (preference) => apply(preference, true);
  const getPreference = () => document.documentElement.dataset.themePreference || 'system';
  const getResolved = () => document.documentElement.dataset.theme || resolve(getPreference());
  window.__BGrid_SITE_THEME__ = { setPreference, getPreference, getResolved };
  apply(readPreference());
  media.addEventListener?.('change', () => {
    if (getPreference() === 'system') apply('system');
  });
})();`;
