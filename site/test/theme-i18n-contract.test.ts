import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { localeAlternates, localeFromPath, localizePath, stripLocalePrefix } from '../src/i18n';

const siteRoot = path.resolve(import.meta.dirname, '..');
const read = (relativePath: string) => fs.readFileSync(path.join(siteRoot, relativePath), 'utf8');

describe('site theme and locale contracts', () => {
  it('maps Korean and English routes without duplicating locale prefixes', () => {
    expect(localizePath('/', 'ko')).toBe('/');
    expect(localizePath('/', 'en')).toBe('/en/');
    expect(localizePath('/learn/editing?mode=full#save', 'en')).toBe('/en/learn/editing?mode=full#save');
    expect(localizePath('/en/learn/editing#save', 'en')).toBe('/en/learn/editing#save');
    expect(localizePath('/en/learn/editing#save', 'ko')).toBe('/learn/editing#save');
    expect(localizePath('https://github.com/axisj', 'en')).toBe('https://github.com/axisj');
    expect(stripLocalePrefix('/en')).toBe('/');
    expect(localeFromPath('/en/api/props')).toBe('en');
    expect(localeFromPath('/api/props')).toBe('ko');
    expect(localeAlternates('/en/product-facts')).toEqual({ ko: '/product-facts', en: '/en/product-facts' });
  });

  it('runs the theme bootstrap before page content and publishes localized metadata', () => {
    const layout = read('src/layouts/Layout.astro');
    const theme = read('src/i18n/theme.ts');

    expect(layout.indexOf('themeBootstrapScript')).toBeLessThan(layout.indexOf('<slot />'));
    expect(layout).toContain('hreflang="ko"');
    expect(layout).toContain('hreflang="en"');
    expect(layout).toContain('hreflang="x-default"');
    expect(layout).toContain('og:locale');
    expect(theme).toContain("new Set(['light', 'dark', 'system'])");
    expect(theme).toContain("window.localStorage.setItem(storageKey, safePreference)");
    expect(theme).toContain("media.addEventListener?.('change'");
  });

  it('keeps theme and locale controls accessible in both desktop and mobile navigation', () => {
    const header = read('src/components/layout/Header.astro');
    const preferences = read('src/components/layout/SitePreferences.astro');

    expect(header.match(/<SitePreferences/g)).toHaveLength(2);
    expect(header).toContain('aria-expanded="false"');
    expect(header).toContain('aria-controls="mobile-nav"');
    expect(preferences).toContain('role="menuitemradio"');
    expect(preferences).toContain('aria-checked="false"');
    expect(preferences).toContain('data-locale-switch');
    expect(preferences).toContain('hreflang={targetLocale}');
  });

  it('provides dark semantic tokens for the site shell and embedded Grid', () => {
    const globals = read('src/styles/globals.css');
    const gridTheme = read('src/styles/datagrid-theme.css');

    expect(globals).toContain(":root[data-theme='dark']");
    expect(globals).toContain('--site-control-bg');
    expect(globals).toContain('--site-code-bg');
    expect(gridTheme).toContain(":root[data-theme='dark'] .site-grid-theme");
    expect(gridTheme).toContain('--bgrid-toolbox-bg');
    expect(gridTheme).toContain('--bgrid-search-bg');
    expect(gridTheme).toContain('--bgrid-context-menu-bg');
  });

  it('keeps shared demos and content surfaces on dark-aware palettes', () => {
    const globals = read('src/styles/globals.css');
    const demoRenderer = read('src/components/DemoRenderer.tsx');
    const demoTheme = read('src/styles/datagrid-theme.css');
    const heroGrid = read('src/components/home/HomeHeroGrid.tsx');
    const heroGridStyles = read('src/components/home/HomeHeroGrid.css');
    const learnStyles = read('src/styles/learn.css');
    const referenceStyles = read('src/styles/reference.css');
    const homepage = read('src/pages/index.astro');
    const productFacts = read('src/pages/product-facts.astro');

    expect(globals).toContain('--site-accent-contrast: #08111f;');
    expect(demoRenderer).toContain('antdTheme.darkAlgorithm');
    expect(demoTheme).toContain(".site-demo-renderer .editing-example-cell-editable");
    expect(demoTheme).toContain(".site-demo-renderer :is(.bg-white, .bg-slate-50, .bg-slate-100)");
    expect(heroGrid).not.toContain('heroGridPalette');
    expect(heroGridStyles).toContain('--hero-grid-cell-editable-bg: #111827;');
    expect(learnStyles).toContain('background-color: var(--site-control-bg);');
    expect(referenceStyles).toContain('background: var(--site-control-bg);');
    expect(homepage).toContain(".capability-limit-note > strong { color: var(--site-text-primary); }");
    expect(productFacts).toContain(".environment-band::before { background:linear-gradient(135deg,rgba(37,99,235,.14),transparent); }");
  });

  it('keeps Astro configured for unprefixed Korean and prefixed English routes', () => {
    const config = read('astro.config.mjs');
    expect(config).toContain("defaultLocale: 'ko'");
    expect(config).toContain("locales: ['ko', 'en']");
    expect(config).toContain('prefixDefaultLocale: false');
    expect(config).toContain('redirectToDefaultLocale: false');
  });
});
