import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const libraryCss = readFileSync(resolve(process.cwd(), 'beautiful-grid/style.css'), 'utf8');

describe('Active cell selection styles', () => {
  it('gives a single focused cell its own background and an inset ring', () => {
    expect(libraryCss).toContain('--bgrid-active-cell-bg: var(--bgrid-body-bg)');
    expect(libraryCss).toContain('--bgrid-active-cell-ring-color: var(--bgrid-active-cell-color)');
    expect(libraryCss).toContain('--bgrid-active-cell-ring-width: 2px');
    expect(libraryCss).toMatch(
      /\.bgrid-cell-active-fragment\[data-active-fill='true'\]\s*\{[^}]*background-color:\s*var\(--bgrid-active-cell-bg/s,
    );
    expect(libraryCss).toMatch(
      /\.bgrid-cell-active-fragment\[data-active-ring='true'\]\s*\{[^}]*box-shadow:\s*inset 0 0 0 var\(--bgrid-active-cell-ring-width/s,
    );
    expect(libraryCss).toMatch(/\.bgrid-cell-selection-overlay-layer\s*\{[^}]*z-index:\s*2/s);
    expect(libraryCss).toMatch(/\.bgrid-cell-content\s*\{[^}]*z-index:\s*3/s);
    expect(libraryCss).toMatch(
      /\.bgrid-frozen-body-boundary::after,\s*\.bgrid-frozen-column-boundary::after\s*\{[^}]*z-index:\s*1/s,
    );
  });

  it('uses only the range border and no focus ring during multi-cell selection', () => {
    expect(libraryCss).toContain(
      '--bgrid-cell-selected-border-width: var(--bgrid-active-cell-ring-width)',
    );
    expect(libraryCss).toMatch(
      /\.bgrid-cell-selection-fragment\[data-edge-top='true'\]::after\s*\{[^}]*border-top-width:\s*var\(\s*--bgrid-cell-selected-border-width,\s*var\(--bgrid-active-cell-ring-width/s,
    );
    expect(libraryCss).toMatch(/\.bgrid-cell-selection-fragment::after\s*\{[^}]*z-index:\s*2/s);
    expect(libraryCss).toMatch(/\.bgrid-cell-active-fragment\s*\{[^}]*z-index:\s*1/s);
    expect(libraryCss).toContain('.bgrid-cell-selection-overlay-layer');
    expect(libraryCss).not.toContain('td.bgrid-cell-selected-top::after');
    expect(libraryCss).not.toContain('td.bgrid-cell-active-multi-selection');
  });
});
