import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const libraryCss = readFileSync(resolve(process.cwd(), 'beautiful-grid/style.css'), 'utf8');

describe('Frozen boundary styles', () => {
  it('uses a dedicated, subtle theme contract for frozen columns', () => {
    expect(libraryCss).toMatch(/--bgrid-header-separator-color:\s*#d3d9e1;/);
    expect(libraryCss).toMatch(/--bgrid-frozen-boundary-color:\s*#c4ccd6;/);
    expect(libraryCss).toMatch(/--bgrid-frozen-boundary-width:\s*1px;/);
    expect(libraryCss).toMatch(
      /--bgrid-frozen-boundary-shadow:\s*4px 0 8px rgba\(15, 23, 42, 0\.065\);/,
    );
    expect(libraryCss).toMatch(
      /--bgrid-frozen-row-boundary-shadow:\s*0 4px 8px rgba\(15, 23, 42, 0\.065\);/,
    );
    expect(libraryCss).toMatch(
      /\.bgrid-col-resizer-handle::after\s*\{[^}]*background:\s*var\(--bgrid-header-separator-color\);/s,
    );
    expect(libraryCss).toMatch(
      /\.bgrid-col-resizer-frozen-boundary::after\s*\{[^}]*background:\s*var\(--bgrid-frozen-boundary-color\);/s,
    );
    expect(libraryCss).toMatch(
      /\.bgrid-frozen-body-boundary::after,\s*\.bgrid-frozen-column-boundary::after\s*\{[^}]*width:\s*1px;[^}]*background-color:\s*var\(--bgrid-border-color-base\);/s,
    );
    expect(libraryCss).toMatch(
      /\[role='grid'\]\[data-bgrid-frozen-columns='true'\]\s*\.bgrid-frozen-column-boundary::after\s*\{[^}]*width:\s*var\(--bgrid-frozen-boundary-width\);[^}]*background-color:\s*var\(--bgrid-frozen-boundary-color\);/s,
    );
    expect(libraryCss).toMatch(
      /\[role='grid'\]\[data-bgrid-frozen-columns='true'\]\s*\.bgrid-frozen-column-boundary\s*\{[^}]*box-shadow:\s*var\(--bgrid-frozen-boundary-shadow\);/s,
    );
  });

  it('draws the frozen-row edge with the same subtle boundary', () => {
    expect(libraryCss).toMatch(
      /\.bgrid-frozen-rows-layer::after\s*\{[^}]*bottom:\s*0;[^}]*z-index:\s*10;[^}]*height:\s*var\(--bgrid-frozen-boundary-width\);[^}]*background-color:\s*var\(--bgrid-frozen-boundary-color\);[^}]*box-shadow:\s*var\(--bgrid-frozen-row-boundary-shadow\);/s,
    );
  });

  it('keeps frozen bands on the native sticky scroll plane without transform promotion', () => {
    expect(libraryCss).toMatch(
      /\.bgrid-header-container\s*\{[^}]*position:\s*sticky;/s,
    );
    expect(libraryCss).toMatch(/\.bgrid-frozen-scroll-content\s*\{[^}]*position:\s*sticky;/s);
    expect(libraryCss).not.toMatch(
      /\.bgrid-root\[data-bgrid-scrolling='true'\][^{]*will-change:\s*transform;/s,
    );
  });
});
