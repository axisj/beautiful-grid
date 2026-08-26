import * as React from 'react';

const readDarkTheme = () => typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark';

export function useSiteDarkTheme() {
  const [isDark, setIsDark] = React.useState(readDarkTheme);

  React.useEffect(() => {
    const updateTheme = () => setIsDark(readDarkTheme());
    const observer = new MutationObserver(updateTheme);

    updateTheme();
    window.addEventListener('bgrid-site-theme-change', updateTheme);
    observer.observe(document.documentElement, { attributeFilter: ['data-theme'] });

    return () => {
      window.removeEventListener('bgrid-site-theme-change', updateTheme);
      observer.disconnect();
    };
  }, []);

  return isDark;
}
