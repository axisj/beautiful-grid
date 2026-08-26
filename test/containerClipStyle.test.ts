import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const libraryCss = readFileSync(resolve(process.cwd(), 'beautiful-grid/style.css'), 'utf8');

describe('DataGrid rounded container styles', () => {
  it('clips every internal surface at the root border radius', () => {
    expect(libraryCss).toMatch(
      /\.bgrid-root\s*\{[^}]*overflow:\s*hidden;[^}]*border-radius:\s*var\(--bgrid-border-radius\)/s,
    );
  });

  it.each([
    '.bgrid-header-container',
    '.bgrid-body-container',
    '.bgrid-footer-container',
    '.bgrid-summary-container',
  ])('keeps %s square so it does not leave a gap inside the root curve', selector => {
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    expect(libraryCss).toMatch(new RegExp(`${escapedSelector}\\s*\\{[^}]*border-radius:\\s*0;`, 's'));
  });
});
