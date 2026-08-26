import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';

const siteRoot = path.resolve(import.meta.dirname, '..');
const read = relativePath => fs.readFileSync(path.join(siteRoot, relativePath), 'utf8');

function verifyControls() {
  const i18n = read('src/i18n/index.ts');
  const preferences = read('src/components/layout/SitePreferences.astro');
  const header = read('src/components/layout/Header.astro');
  const layouts = ['MarketingLayout.astro', 'LearnLayout.astro', 'ReferenceLayout.astro'].map(name => read(`src/layouts/${name}`));

  for (const value of ["['ko', 'en']", "'light' | 'dark' | 'system'", "'bgrid-site-theme'", "'bgrid-site-locale'"]) {
    assert.ok(i18n.includes(value), `missing shared contract ${value}`);
  }
  for (const value of ['data-locale-switch', 'data-theme-trigger', 'role="menuitemradio"', 'aria-checked', 'aria-expanded', 'aria-controls']) {
    assert.ok(preferences.includes(value), `missing preference control contract ${value}`);
  }
  assert.ok(header.includes('<SitePreferences'), 'Header must mount shared preference controls');
  assert.ok(header.includes('mobile') && header.includes('desktop'), 'Header must expose controls in desktop and mobile shells');
  for (const layout of layouts) {
    assert.ok(layout.includes('locale={props.locale}'), 'shared layout must pass locale to its shell children');
  }
}

function runBootstrap(storedValue, mediaMatches) {
  const source = read('src/i18n/theme.ts');
  const body = source.match(/`([\s\S]*)`;\s*$/)?.[1];
  assert.ok(body, 'theme bootstrap template was not found');
  const script = body.replace("${themeStorageKey}", 'bgrid-site-theme');
  const dataset = {};
  const saved = new Map(storedValue === undefined ? [] : [['bgrid-site-theme', storedValue]]);
  let mediaListener;
  const media = {
    matches: mediaMatches,
    addEventListener(type, listener) { if (type === 'change') mediaListener = listener; },
  };
  const events = [];
  const window = {
    localStorage: { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) },
    matchMedia: () => media,
    dispatchEvent: event => events.push(event),
  };
  const document = { documentElement: { dataset, style: {} } };
  class CustomEvent { constructor(type, init) { this.type = type; this.detail = init?.detail; } }
  vm.runInNewContext(script, { window, document, CustomEvent, Set });
  return { window, document, saved, media, events, triggerMedia: () => mediaListener?.() };
}

function verifyBootstrap() {
  const dark = runBootstrap('dark', false);
  assert.equal(dark.document.documentElement.dataset.themePreference, 'dark');
  assert.equal(dark.document.documentElement.dataset.theme, 'dark');
  assert.equal(dark.document.documentElement.style.colorScheme, 'dark');

  const invalid = runBootstrap('unknown', false);
  assert.equal(invalid.document.documentElement.dataset.themePreference, 'system');
  assert.equal(invalid.document.documentElement.dataset.theme, 'light');
  invalid.media.matches = true;
  invalid.triggerMedia();
  assert.equal(invalid.document.documentElement.dataset.theme, 'dark');

  invalid.window.__BGrid_SITE_THEME__.setPreference('light');
  assert.equal(invalid.saved.get('bgrid-site-theme'), 'light');
  assert.equal(invalid.document.documentElement.dataset.theme, 'light');
  assert.ok(invalid.events.some(event => event.type === 'bgrid-site-theme-change'));
}

function verifyTokens() {
  const globals = read('src/styles/globals.css');
  const grid = read('src/styles/datagrid-theme.css');
  const astroConfig = read('astro.config.mjs');
  assert.ok(globals.includes(":root[data-theme='dark']"), 'dark site selector is missing');
  assert.ok(grid.includes(":root[data-theme='dark'] .site-grid-theme"), 'dark Grid selector is missing');
  assert.ok(astroConfig.includes("light: 'github-light'") && astroConfig.includes("dark: 'github-dark'"), 'paired Shiki themes are missing');
  assert.ok(globals.includes('color: var(--shiki-dark) !important;'), 'dark Shiki token switching is missing');
  for (const token of ['--site-page-bg', '--site-surface', '--site-surface-elevated', '--site-text-primary', '--site-text-secondary', '--site-border', '--site-accent', '--site-code-bg', '--site-control-bg']) {
    assert.ok(globals.indexOf(token) !== globals.lastIndexOf(token), `site token lacks a dark override: ${token}`);
  }
  for (const token of [
    '--bgrid-header-bg', '--bgrid-body-bg', '--bgrid-body-color', '--bgrid-border-color-base', '--bgrid-active-cell-bg',
    '--bgrid-editor-bg', '--bgrid-scrollbar-modern-track-bg', '--bgrid-scrollbar-classic-track-bg', '--bgrid-loading-bg',
    '--bgrid-toolbox-bg', '--bgrid-toolbox-danger-bg', '--bgrid-toolbox-focus-ring-color', '--bgrid-search-bg',
    '--bgrid-search-match-bg', '--bgrid-context-menu-bg',
  ]) {
    assert.ok(grid.indexOf(token) !== grid.lastIndexOf(token), `Grid token lacks a dark override: ${token}`);
  }
}

function verifyFoundationTypecheck() {
  const result = spawnSync('npm', ['run', 'site:check'], {
    cwd: path.resolve(siteRoot, '..'),
    encoding: 'utf8',
  });
  const output = `${result.stdout || ''}\n${result.stderr || ''}`;
  if (result.status === 0) return;

  const diagnosticFiles = [...output.matchAll(/src\/[\w./-]+|test\/[\w./-]+/g)].map(match => match[0]);
  const allowedExistingDiagnostics = new Set(['src/pages/index.astro', 'test/site-contract.test.ts']);
  assert.ok(diagnosticFiles.length > 0, `site:check failed without parseable diagnostics:\n${output.slice(-3000)}`);
  for (const file of diagnosticFiles) {
    assert.ok(allowedExistingDiagnostics.has(file), `foundation introduced a typecheck diagnostic in ${file}`);
  }
  assert.ok(output.includes('gridOptionalSurfacesJsGzipKiB'), 'unexpected pre-existing site:check failure');
}

const mode = process.argv[2] || 'all';
if (!['controls', 'bootstrap', 'tokens', 'typecheck', 'all'].includes(mode)) throw new Error(`unknown verification mode: ${mode}`);
if (mode === 'controls' || mode === 'all') verifyControls();
if (mode === 'bootstrap' || mode === 'all') verifyBootstrap();
if (mode === 'tokens' || mode === 'all') verifyTokens();
if (mode === 'typecheck' || mode === 'all') verifyFoundationTypecheck();

const markers = {
  controls: 'THEME_I18N_CONTROLS_OK',
  bootstrap: 'THEME_BOOTSTRAP_OK',
  tokens: 'THEME_TOKENS_OK',
  typecheck: 'THEME_FOUNDATION_TYPECHECK_OK',
  all: 'THEME_I18N_FOUNDATION_OK',
};
console.log(markers[mode]);
