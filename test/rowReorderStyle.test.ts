import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const libraryCss = readFileSync(resolve(process.cwd(), 'beautiful-grid/style.css'), 'utf8');

describe('Row reorder style contracts', () => {
  it('publishes the motion, insertion guide, and preview theme tokens', () => {
    expect(libraryCss).toMatch(/--bgrid-row-reorder-duration:\s*150ms;/);
    expect(libraryCss).toContain('--bgrid-row-reorder-easing');
    expect(libraryCss).toContain('--bgrid-row-reorder-guide-color');
    expect(libraryCss).toContain('--bgrid-row-reorder-preview-bg');
    expect(libraryCss).toContain('--bgrid-row-reorder-preview-shadow');
  });

  it('scopes source and shifted transforms to an active grid session', () => {
    expect(libraryCss).toMatch(
      /\[role='grid'\]\[data-bgrid-row-reordering='true'\][\s\S]*tr\[data-bgrid-row-reorder-role='shift'\][\s\S]*transform:\s*translateY\(var\(--bgrid-row-reorder-offset-y, 0\)\)/,
    );
    expect(libraryCss).toMatch(
      /tr\[data-bgrid-row-reorder-role='source'\][\s\S]*transform:\s*translateY\(var\(--bgrid-row-drag-offset-y, 0\)\)/,
    );
  });

  it('includes merged-cell and reduced-motion fallbacks', () => {
    expect(libraryCss).toMatch(
      /\[data-bgrid-row-reorder-fallback='true'\][\s\S]*tr\[data-bgrid-row-reorder-role\][\s\S]*transform:\s*none/,
    );
    expect(libraryCss).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\[data-bgrid-row-reordering='true'\][\s\S]*transition-duration:\s*0ms/,
    );
    expect(libraryCss).not.toContain('--tw-');
  });
});
