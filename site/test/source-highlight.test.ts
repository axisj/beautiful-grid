import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { highlightPlaygroundSource } from '../src/components/playground/highlightSource';

describe('Playground source highlighting', () => {
  it('highlights mixed CSS and TSX without changing the source text', () => {
    const source = `/* React */
.inventory-grid { --bgrid-primary-color: #3073f1; }
import { BGrid } from 'beautiful-grid';
const enabled = true;
<BGrid width={960} />`;
    const markup = renderToStaticMarkup(createElement('code', null, highlightPlaygroundSource(source)));

    expect(markup).toContain('source-token-comment');
    expect(markup).toContain('source-token-keyword');
    expect(markup).toContain('source-token-string');
    expect(markup).toContain('source-token-number');
    expect(markup).toContain('source-token-literal');
    expect(markup).toContain('source-token-tag');
    expect(markup).toContain('source-token-property');
    expect(
      markup
        .replace(/<[^>]+>/g, '')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&#x27;', "'")
        .replaceAll('&quot;', '"')
        .replaceAll('&amp;', '&'),
    ).toBe(source);
  });
});
