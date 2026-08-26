import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const siteRoot = path.resolve(import.meta.dirname, '..');
const read = relativePath => fs.readFileSync(path.join(siteRoot, relativePath), 'utf8');

const koIndex = read('src/pages/learn/index.astro');
const koArticle = read('src/pages/learn/[slug].astro');
const enIndex = read('src/pages/en/learn/index.astro');
const enArticle = read('src/pages/en/learn/[slug].astro');
const enLegacy = read('src/pages/en/learn/editing-keyboard.astro');
const indexPage = read('src/components/learn/LearnIndexPage.astro');
const articlePage = read('src/components/learn/LearnArticlePage.astro');
const localeContract = read('src/components/learn/learnLocale.ts');

function assertIncludes(source, values, label) {
  for (const value of values) {
    assert.ok(source.includes(value), `${label} is missing ${JSON.stringify(value)}`);
  }
}

function verifyRouteIsolation() {
  assertIncludes(koIndex, ["item.data.locale === 'ko'", 'locale="ko"'], 'Korean Learn index');
  assertIncludes(koArticle, ["item.data.locale === 'ko'", '!item.data.draft', 'getStaticPaths', 'locale="ko"'], 'Korean Learn article route');
  assert.ok(!koIndex.includes("item.data.locale === 'en'"), 'Korean index must not select English entries');
  assert.ok(!koArticle.includes("item.data.locale === 'en'"), 'Korean article generator must not select English entries');

  assertIncludes(enIndex, ["item.data.locale === 'en'", "item.id.startsWith('en/')", 'locale="en"'], 'English Learn index');
  assertIncludes(enArticle, ["item.data.locale === 'en'", "item.id.startsWith('en/')", "replace(/^en\\//, '')", 'getStaticPaths', 'locale="en"'], 'English Learn article route');
  assert.ok(!enIndex.includes("item.data.locale === 'ko'"), 'English index must not select Korean entries');
  assert.ok(!enArticle.includes("item.data.locale === 'ko'"), 'English article generator must not select Korean entries');

  const fixtures = [
    { id: 'basic', locale: 'ko', draft: false },
    { id: 'en/basic', locale: 'en', draft: false },
    { id: 'en/draft', locale: 'en', draft: true },
    { id: 'misplaced', locale: 'en', draft: false },
  ];
  const koRoutes = fixtures.filter(item => item.locale === 'ko' && !item.draft).map(item => item.id);
  const enRoutes = fixtures.filter(item => item.locale === 'en' && item.id.startsWith('en/') && !item.draft).map(item => item.id.replace(/^en\//, ''));
  assert.deepEqual(koRoutes, ['basic'], 'Korean route predicate must isolate Korean entries');
  assert.deepEqual(enRoutes, ['basic'], 'English route predicate must isolate nested English entries and strip the prefix');
}

function verifyWrappersAndMetadata() {
  assert.ok(fs.existsSync(path.join(siteRoot, 'src/pages/en/learn/index.astro')), 'English Learn index wrapper is missing');
  assert.ok(fs.existsSync(path.join(siteRoot, 'src/pages/en/learn/[slug].astro')), 'English Learn article wrapper is missing');
  assertIncludes(enLegacy, ['target="/en/learn/editing"', 'locale="en"'], 'English legacy Learn redirect');
  assertIncludes(indexPage, ['locale: Locale', 'canonicalPath={learnIndexPath(locale)}', 'locale={locale}'], 'shared Learn index renderer');
  assertIncludes(articlePage, ['locale: Locale', 'canonicalPath={localizePath(item.data.canonicalPath, locale)}', 'locale={locale}', 'currentSlug={slug}'], 'shared Learn article renderer');
  assertIncludes(localeContract, ["localizePath('/learn', locale)", 'localizePath(`/learn/${slug}`, locale)', 'return `/demo/${slug}`'], 'Learn path helpers');
}

function verifyLocalizedComponents() {
  const componentChecks = {
    'LearnBreadcrumb.astro': ['locale: Locale', 'learnIndexPath(locale)', 'messages.breadcrumb'],
    'LearnPager.astro': ['locale?: Locale', 'item.data.locale === locale', 'learnPath(learnSlug(prevItem.id), locale)', 'messages.previous', 'messages.next'],
    'LearnSidebar.astro': ['locale?: Locale', 'item.data.locale === locale', 'learnIndexPath(locale)', 'learnPath(slug, locale)', 'messages.navigation'],
    'RelatedGuides.astro': ['locale: Locale', 'item.data.locale === locale', 'learnPath(slug, locale)', 'messages.relatedGuides', 'categoryLabel(item.data.category, locale)'],
    'SourceCodePanel.astro': ['locale: Locale', 'messages.sourceTabs', 'messages.copyAria', 'data-copy-success', 'navigator.clipboard.writeText(code)'],
    'LiveDemoPanel.tsx': ['locale: Locale', 'learnDemoPath(slug, locale)', 'messages.resetAria', 'messages.demoOnlyAria(title)'],
  };

  for (const [name, values] of Object.entries(componentChecks)) {
    assertIncludes(read(`src/components/learn/${name}`), values, name);
  }

  assertIncludes(articlePage, [
    'messages.reviewedAt',
    'messages.relatedApi',
    'localizePath(apiPath, locale)',
    'messages.liveDemoSection',
    'messages.sourceSection',
    '<RelatedGuides locale={locale}',
    '<LearnPager locale={locale}',
  ], 'shared Learn article renderer labels and links');
  assertIncludes(indexPage, ['categoryLabel(category, locale)', 'messages.guideCount', 'learnPath(slug, locale)', 'learnDemoPath(slug, locale)'], 'shared Learn index renderer labels and links');

  for (const value of ['Last reviewed', 'Related API', 'Related guides', 'Previous guide', 'Next guide', 'Copy', 'Copied!', 'Learn navigation']) {
    assert.ok(localeContract.includes(value), `English Learn messages are missing ${JSON.stringify(value)}`);
  }

  const commonSources = Object.keys(componentChecks).map(name => read(`src/components/learn/${name}`)).join('\n');
  assert.ok('/learn/example'.match(/^\/learn\//), 'positive control for an unlocalized Learn link must match');
  assert.ok(!/(?:href=|href\{)\s*["'`]\/learn\//.test(commonSources), 'common Learn components contain a hard-coded unprefixed Learn article link');
  assert.ok(!/(?:href=|href\{)\s*["'`]\/api\//.test(commonSources), 'common Learn components contain a hard-coded unprefixed API link');

  const sourcePanel = read('src/components/learn/SourceCodePanel.astro');
  assert.ok(sourcePanel.includes('data-source-code={file.code}'), 'source panel must retain the original source text for copy');
  assert.ok(sourcePanel.includes("const code = activePanel?.getAttribute('data-source-code') || ''"), 'copy action must read the active panel source');
}

verifyRouteIsolation();
verifyWrappersAndMetadata();
verifyLocalizedComponents();

console.log('LEARN_LOCALES_OK');
