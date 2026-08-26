import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => fs.readFileSync(path.join(siteRoot, relativePath), 'utf8');
const expectAll = (source, values, label) => {
  for (const value of values) assert.ok(source.includes(value), `${label} is missing ${JSON.stringify(value)}`);
};

const home = read('src/pages/index.astro');
const productFacts = read('src/pages/product-facts.astro');
const playgroundPage = read('src/pages/playground.astro');
const apiPage = read('src/pages/api/props.astro');
const notFound = read('src/pages/404.astro');
const homeGrid = read('src/components/home/HomeHeroGrid.tsx');
const homeGridCss = read('src/components/home/HomeHeroGrid.css');
const playground = read('src/components/playground/Playground.tsx');
const workspace = read('src/components/playground/PlaygroundWorkspace.tsx');
const propsPlayground = read('src/components/playground/PropsPlayground.tsx');
const themePlayground = read('src/components/playground/ThemePlayground.tsx');
const playgroundCss = read('src/components/playground/Playground.css');
const apiSidebar = read('src/components/reference/ApiSidebar.astro');
const bundleMetrics = read('src/data/bundleMetrics.ts');

for (const [page, source] of Object.entries({ home, productFacts, playgroundPage, apiPage })) {
  expectAll(source, ['interface Props { locale?: Locale; }', 'normalizeLocale(Astro.props.locale)', 'locale={locale}'], `${page} locale contract`);
}

const wrappers = {
  'src/pages/en/index.astro': ['../index.astro', '<HomePage locale="en" />'],
  'src/pages/en/product-facts.astro': ['../product-facts.astro', '<ProductFactsPage locale="en" />'],
  'src/pages/en/playground.astro': ['../playground.astro', '<PlaygroundPage locale="en" />'],
  'src/pages/en/api/props.astro': ['../../api/props.astro', '<ApiPropsPage locale="en" />'],
};
for (const [file, values] of Object.entries(wrappers)) expectAll(read(file), values, `${file} static wrapper`);

expectAll(home, [
  "canonicalPath={canonicalPath}",
  "localizePath('/learn', locale)",
  "localizePath('/playground', locale)",
  'The React DataGrid for complex business workflows',
  '<HomeHeroGrid locale={locale}',
  'data-copy-command',
  'navigator.clipboard.writeText',
  'data-fps-measure',
  'requestAnimationFrame(measureFrame)',
  'data-mount-value',
  'bundleMetrics.gridOptionalSurfacesJsGzipKiB',
  ":global(html[data-theme='dark']) .homepage",
], 'home localized interaction contract');
assert.ok(bundleMetrics.includes('"gridOptionalSurfacesJsGzipKiB"'), 'bundleMetrics no longer exposes the homepage optional-surface metric');

expectAll(homeGrid, [
  "locale?: Locale",
  'englishColumns',
  'englishInitialData',
  "locale === 'en' ? englishColumns : columns",
  'cellSelectionOptions={{ enabled: true }}',
  'cellNavigationOptions={{ enabled: true, editOnEnter: false }}',
  "document.documentElement.dataset.bgridHomeGridMountMs",
], 'HomeHeroGrid locale and behavior contract');
assert.ok(homeGridCss.includes(":root[data-theme='dark'] .hero-grid-viewport"), 'HomeHeroGrid dark theme override is missing');

expectAll(productFacts, [
  "localizePath('/product-facts', locale)",
  "feature.name[locale]",
  "limitation.description[locale]",
  'Runtime & Adoption Guide',
  ":global(html[data-theme='dark']) .environment-hero",
], 'Product Facts locale contract');

expectAll(playgroundPage, ["localizePath('/playground', locale)", '<Playground locale={locale}', 'Loading Playground.'], 'Playground page locale contract');
expectAll(playground, ['locale?: Locale', '<PropsPlayground locale={locale}', '<ThemePlayground locale={locale}', "role='tablist'"], 'Playground tabs locale contract');
expectAll(workspace, ["import '../../styles/datagrid-theme.css'", 'navigator.clipboard.writeText(source)', 'setSourceOpen(true)', "role='separator'", "playground-preview-canvas site-grid-theme", 'Copy code'], 'Playground workspace interaction contract');
expectAll(propsPlayground, ['englishPrimaryData', 'localizedInitialColumns', "title={t('데이터 그리드 설정', 'DataGrid configuration')}", 'columnSortable={columnSortable}', 'cellSelectionOptions={{'], 'Props Playground contract');
expectAll(themePlayground, ['englishThemeColumns', 'englishThemeData', "title={t('테마 빌더', 'Theme builder')}", 'setPalette', 'source={source}'], 'Theme Playground contract');
assert.ok(playgroundCss.includes(":root[data-theme='dark'] .playground-shell"), 'Playground dark theme override is missing');
assert.ok(
  ![home, productFacts, playgroundCss].some(source => source.includes('var(--site-bg)')),
  'Owned dark-theme styles must use the shared --site-page-bg token',
);

expectAll(apiPage, [
  "localizePath('/api/props', locale)",
  'Public interfaces &amp; types',
  "t('설명', 'Description')",
  'apiTypeId(entry.name)',
  'apiMemberId(entry.name, member.name)',
  ":global(html[data-theme='dark']) .api-entry",
], 'API reference locale and anchor contract');
expectAll(apiSidebar, ['localeFromPath(Astro.url.pathname)', "localizePath('/api/props', locale)", "isEn ? 'Find a type'", 'data-api-nav-item'], 'API sidebar locale contract');

expectAll(notFound, [
  "window.location.pathname.startsWith('/en/')",
  '<Header adaptiveLocale />',
  '<Footer adaptiveLocale />',
  'noIndex',
  'data-404-message',
  'data-404-home',
  "document.documentElement.lang = 'en'",
  "homeLink.href = english404 ? '/en/' : '/'",
], 'single-output 404 locale contract');

console.log('LOCALIZED_SURFACES_OK');
