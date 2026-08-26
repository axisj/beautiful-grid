import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const libraryCss = readFileSync(resolve(process.cwd(), 'beautiful-grid/style.css'), 'utf8');

describe('Grid search and context menu style contracts', () => {
  it('publishes the search, context menu and floating layer theme tokens', () => {
    for (const token of [
      '--bgrid-search-bg',
      '--bgrid-search-control-bg',
      '--bgrid-search-button-hover-bg',
      '--bgrid-search-match-bg',
      '--bgrid-search-current-border-color',
      '--bgrid-context-menu-bg',
      '--bgrid-context-menu-hover-bg',
      '--bgrid-floating-z-editor',
      '--bgrid-floating-z-context-menu',
      '--bgrid-search-z-index',
    ]) {
      expect(libraryCss).toContain(token);
    }
    expect(libraryCss).toMatch(/--bgrid-search-bg:\s*#ffffff;/);
    expect(libraryCss).toMatch(/--bgrid-search-color:\s*#334155;/);
    expect(libraryCss).toMatch(/--bgrid-search-control-bg:\s*#f8fafc;/);
  });

  it('uses a separate cell overlay so existing selected and edited backgrounds remain meaningful', () => {
    expect(libraryCss).toMatch(
      /td\.bgrid-cell-search-match::before\s*\{[^}]*pointer-events:\s*none;[^}]*background:\s*var\(--bgrid-search-match-bg\)/s,
    );
    expect(libraryCss).toMatch(
      /td\.bgrid-cell-search-current::before\s*\{[^}]*box-shadow:\s*inset 0 0 0 2px var\(--bgrid-search-current-border-color\)/s,
    );
    expect(libraryCss).toMatch(
      /td\.bgrid-cell-editing\.bgrid-cell-search-match::before\s*\{[^}]*background:\s*transparent/s,
    );
    expect(libraryCss).toMatch(
      /td\.bgrid-cell-search-match > \.bgrid-cell-content\s*\{[^}]*z-index:\s*3/s,
    );
    expect(libraryCss).toMatch(/\.bgrid-cell-selection-overlay-layer\s*\{[^}]*z-index:\s*2/s);
  });

  it('scopes floating controls and includes reduced-motion and forced-color fallbacks', () => {
    expect(libraryCss).toContain('.bgrid-floating-portal-root');
    expect(libraryCss).toMatch(/\.bgrid-search-popover\s*\{[^}]*top:\s*0;[^}]*right:\s*0;/s);
    expect(libraryCss).not.toContain("data-placement='bottom-left'");
    expect(libraryCss).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.bgrid-context-menu/);
    expect(libraryCss).toMatch(/@media \(forced-colors: active\)[\s\S]*\.bgrid-cell-search-current::before/);
    expect(libraryCss).not.toContain('--tw-');
  });
});
