import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const siteRoot = path.resolve(import.meta.dirname, '..');
const distRoot = path.join(siteRoot, 'dist');
const learnRoot = path.join(siteRoot, 'src/content/learn');

const routeFile = route => {
  const normalized = route.replace(/^\/+|\/+$/g, '');
  return normalized ? path.join(distRoot, normalized, 'index.html') : path.join(distRoot, 'index.html');
};
const readRoute = route => {
  const filePath = routeFile(route);
  assert.ok(fs.existsSync(filePath), `missing built route ${route} at ${filePath}`);
  return fs.readFileSync(filePath, 'utf8');
};
const assertMetadata = (route, locale) => {
  const html = readRoute(route);
  const canonicalPath = route === '/' || route === '/en/' ? route : route.replace(/\/$/, '');
  const canonical = `https://bgrid.axisj.com${canonicalPath}`;
  assert.match(html, new RegExp(`<html[^>]+lang="${locale}"`), `${route} has the wrong html lang`);
  assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`), `${route} has the wrong canonical`);
  assert.ok(html.includes('hreflang="ko"') && html.includes('hreflang="en"') && html.includes('hreflang="x-default"'), `${route} lacks locale alternates`);
  assert.ok(/<title>[^<]+<\/title>/.test(html), `${route} lacks a title`);
  assert.ok(/<meta name="description" content="[^"]+">/.test(html), `${route} lacks a description`);
  return html;
};

const corePairs = ['/', '/learn/', '/product-facts/', '/playground/', '/api/props/'];
for (const koRoute of corePairs) {
  const suffix = koRoute === '/' ? '/' : koRoute;
  const enRoute = suffix === '/' ? '/en/' : `/en${suffix}`;
  assertMetadata(koRoute, 'ko');
  assertMetadata(enRoute, 'en');
}

const koreanSlugs = fs.readdirSync(learnRoot, { withFileTypes: true })
  .filter(entry => entry.isFile() && /\.mdx?$/.test(entry.name))
  .map(entry => entry.name.replace(/\.mdx?$/, ''))
  .sort();
const englishRoot = path.join(learnRoot, 'en');
const englishSlugs = fs.readdirSync(englishRoot, { withFileTypes: true })
  .filter(entry => entry.isFile() && /\.mdx?$/.test(entry.name))
  .map(entry => entry.name.replace(/\.mdx?$/, ''))
  .sort();
assert.deepEqual(englishSlugs, koreanSlugs, 'built locale verification requires a one-to-one Learn translation set');

for (const slug of koreanSlugs) {
  assertMetadata(`/learn/${slug}/`, 'ko');
  const englishHtml = assertMetadata(`/en/learn/${slug}/`, 'en');
  const unprefixedEnglishAnchors = [...englishHtml.matchAll(/<a\b[^>]*href="\/(?:learn|api|product-facts|playground)(?:\/|"|#)[^>]*>/g)]
    .map(match => match[0])
    .filter(anchor => !anchor.includes('data-locale-switch'));
  assert.deepEqual(unprefixedEnglishAnchors, [], `English Learn page ${slug} contains an unprefixed site link`);
}

const allEnglishHtml = ['/en/', '/en/learn/', '/en/product-facts/', '/en/playground/', '/en/api/props/']
  .map(readRoute)
  .join('\n');
assert.ok(allEnglishHtml.includes('data-locale-switch'), 'English pages do not render the locale switch');
assert.ok(allEnglishHtml.includes('data-theme-trigger'), 'English pages do not render the theme switch');

console.log('BUILT_LOCALES_OK');
