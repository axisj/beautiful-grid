import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  aiContextBenchmarkSlugs,
  essentialAiContextLinks,
  exampleAiContextLinks,
  renderLlmsText,
  taskAiContextLinks,
} from '../src/data/aiContext';
import { aiContextMetrics } from '../src/data/aiContextMetrics';

const siteRoot = resolve(import.meta.dirname, '..');
const repositoryRoot = resolve(siteRoot, '..');
const readSiteFile = (path: string) => readFileSync(resolve(siteRoot, path), 'utf8');

describe('AI-readable documentation contract', () => {
  it('publishes a precise and annotated llms.txt implementation map', () => {
    const llms = renderLlmsText();
    const linkLines = llms.split('\n').filter(line => line.startsWith('- ['));

    expect(llms).toMatch(/^# BeautifulGrid\n\n> /);
    expect(llms).toContain('Wrap every domain row as `{ values: T }`');
    expect(llms).toContain('Provide numeric `width` and `height`');
    expect(llms).toContain('## Essential documentation');
    expect(llms).toContain('## Task guides');
    expect(llms).toContain('## Runnable source examples');
    expect(llms).toContain('/en/api/props.md');
    expect(llms).toContain('/en/learn/getting-started.md');
    expect(llms).toContain('raw.githubusercontent.com/axisj/beautiful-grid/main/beautiful-grid/types.ts');
    expect(linkLines.length).toBeGreaterThanOrEqual(essentialAiContextLinks.length + taskAiContextLinks.length + exampleAiContextLinks.length);
    expect(linkLines.every(line => /\): \S/.test(line))).toBe(true);
    for (const link of taskAiContextLinks.filter(link => link.url.startsWith('https://bgrid.axisj.com/'))) {
      const slug = link.url.match(/\/en\/learn\/([^/]+)\.md$/)?.[1];
      expect(slug && readSiteFile(`src/content/learn/en/${slug}.md`).length).toBeGreaterThan(100);
    }
    for (const link of exampleAiContextLinks) {
      const relativePath = new URL(link.url).pathname.replace('/axisj/beautiful-grid/main/', '');
      expect(readFileSync(resolve(repositoryRoot, relativePath), 'utf8').length).toBeGreaterThan(100);
    }
  });

  it('keeps Markdown routes and discovery relations wired for every guide locale and API reference', () => {
    const koreanGuideCount = readdirSync(resolve(siteRoot, 'src/content/learn')).filter(name => name.endsWith('.md')).length;
    const englishGuideCount = readdirSync(resolve(siteRoot, 'src/content/learn/en')).filter(name => name.endsWith('.md')).length;
    const layout = readSiteFile('src/layouts/Layout.astro');

    expect(koreanGuideCount).toBeGreaterThan(30);
    expect(englishGuideCount).toBe(koreanGuideCount);
    expect(readSiteFile('src/pages/learn/[slug].md.ts')).toContain("entry.data.locale === 'ko'");
    expect(readSiteFile('src/pages/en/learn/[slug].md.ts')).toContain("entry.data.locale === 'en'");
    expect(readSiteFile('src/pages/api/props.md.ts')).toContain("renderApiReferenceMarkdown('ko')");
    expect(readSiteFile('src/pages/en/api/props.md.ts')).toContain("renderApiReferenceMarkdown('en')");
    expect(layout).toContain('rel="describedby"');
    expect(layout).toContain('type="text/markdown"');
    expect(readSiteFile('src/data/learnMarkdown.ts')).toContain("route.endsWith('.md')");
  });

  it('publishes a scoped, reproducible homepage measurement instead of an agent-wide savings claim', () => {
    const homepage = readSiteFile('src/pages/index.astro');
    const measurementScript = readFileSync(resolve(repositoryRoot, 'scripts/measure-ai-context.mjs'), 'utf8');

    expect(aiContextMetrics.tokenSavingsPercent).toBeGreaterThan(0);
    expect(aiContextMetrics.markdownTokens).toBeLessThan(aiContextMetrics.htmlTokens);
    expect(aiContextMetrics.benchmarkSlugs).toEqual([...aiContextBenchmarkSlugs]);
    expect(aiContextMetrics.guideCount).toBeGreaterThanOrEqual(70);
    expect(aiContextMetrics.measurement.tokenizer).toBe('o200k_base');
    expect(homepage).toContain('aiContextMetrics.tokenSavingsPercent');
    expect(homepage).toContain('원문 응답 기준');
    expect(homepage).toContain('에이전트 추론·출력 토큰 제외');
    expect(measurementScript).toContain("getEncoding('o200k_base')");
    expect(measurementScript).toContain("argumentsSet.has('--check')");
  });
});
