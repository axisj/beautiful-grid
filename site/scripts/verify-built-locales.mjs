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

const socialImageUrl = 'https://bgrid.axisj.com/og-image.png';
for (const homepageRoute of ['/', '/en/']) {
  const html = readRoute(homepageRoute);
  assert.ok(html.includes(`<meta property="og:image" content="${socialImageUrl}">`), `${homepageRoute} lacks the homepage Open Graph image`);
  assert.ok(html.includes('<meta property="og:image:width" content="1200">'), `${homepageRoute} has the wrong Open Graph image width`);
  assert.ok(html.includes('<meta property="og:image:height" content="630">'), `${homepageRoute} has the wrong Open Graph image height`);
  assert.ok(html.includes('<meta name="twitter:card" content="summary_large_image">'), `${homepageRoute} lacks the large Twitter card`);
  assert.ok(html.includes(`<meta name="twitter:image" content="${socialImageUrl}">`), `${homepageRoute} lacks the Twitter image`);
}

const socialImage = fs.readFileSync(path.join(distRoot, 'og-image.png'));
assert.equal(socialImage.subarray(1, 4).toString('ascii'), 'PNG', 'built social image is not a PNG');
assert.equal(socialImage.readUInt32BE(16), 1200, 'built social image width must be 1200');
assert.equal(socialImage.readUInt32BE(20), 630, 'built social image height must be 630');

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
