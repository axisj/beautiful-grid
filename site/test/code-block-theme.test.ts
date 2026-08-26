import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const siteRoot = resolve(import.meta.dirname, '..');

const readSiteFile = (path: string) => readFileSync(resolve(siteRoot, path), 'utf8');

describe('Markdown code block theme', () => {
  it('uses paired Shiki themes with theme-aware document surfaces', () => {
    const astroConfig = readSiteFile('astro.config.mjs');
    const globalStyles = readSiteFile('src/styles/globals.css');

    expect(astroConfig).toContain("light: 'github-light'");
    expect(astroConfig).toContain("dark: 'github-dark-high-contrast'");
    expect(globalStyles).toContain('--site-code-bg: #f7f9fc;');
    expect(globalStyles).toContain("--site-code-bg: #0e1728;");
    expect(globalStyles).toContain(":root[data-theme='dark'] .astro-code");
    expect(globalStyles).toContain('color: var(--shiki-dark) !important;');
    expect(globalStyles).toContain('border: 1px solid var(--site-border);');
  });
});
