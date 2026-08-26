import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

const learnDirectory = new URL('../src/content/learn/', import.meta.url);
const englishDirectory = new URL('../src/content/learn/en/', import.meta.url);
const contentExtension = /\.mdx?$/;
const hangul = /[\u3131-\u318e\uac00-\ud7a3]/;
const structuralFenceLanguages = new Set(['tsx', 'ts', 'jsx', 'js', 'css', 'json', 'bash', 'sh']);

function listEntries(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && contentExtension.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

function parseScalar(value) {
  const trimmed = value.trim();
  if (/^(['"]).*\1$/.test(trimmed)) return trimmed.slice(1, -1);
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^-?\d+$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}

function parseArray(value, file, key) {
  const items = [];
  const quotedValue = /'([^']*)'|"([^"]*)"/g;
  let match;
  while ((match = quotedValue.exec(value))) items.push(match[1] ?? match[2]);
  assert.ok(value.trim().startsWith('[') && value.trim().endsWith(']'), `${file}: ${key} must be an array`);
  return items;
}

function parseEntry(directory, name) {
  const file = join(directory.pathname, name);
  const source = readFileSync(file, 'utf8');
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  assert.ok(match, `${file}: missing or malformed frontmatter`);
  const frontmatter = {};
  const lines = match[1].split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const field = lines[index].match(/^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/);
    assert.ok(field, `${file}: unsupported frontmatter line ${index + 2}`);
    const [, key] = field;
    let value = field[2];
    if (!value.trim() && lines[index + 1]?.trim().startsWith('[')) value = lines[++index].trim();
    if (value.trim().startsWith('[') && !value.trim().endsWith(']')) {
      while (index + 1 < lines.length && !value.trim().endsWith(']')) value += `\n${lines[++index]}`;
    }
    frontmatter[key] = value.trim().startsWith('[') ? parseArray(value, file, key) : parseScalar(value);
  }

  return {
    file,
    slug: basename(name, extname(name)),
    frontmatter,
    body: match[2],
    source,
  };
}

function fencedBlocks(body, file) {
  const blocks = [];
  const fence = /^```([^\r\n]*)\r?\n([\s\S]*?)^```\s*$/gm;
  let match;
  while ((match = fence.exec(body))) blocks.push({ language: match[1].trim(), code: match[2] });
  const delimiterCount = (body.match(/^```/gm) ?? []).length;
  assert.equal(delimiterCount, blocks.length * 2, `${file}: unbalanced or malformed code fence`);
  return blocks;
}

function codeSkeleton(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '/*COMMENT*/')
    .replace(/^\s*#[^\r\n]*/gm, '#COMMENT')
    .replace(/\/\/[^\r\n]*/g, '//COMMENT')
    .replace(/(['"])(?:\\.|(?!\1)[^\\\r\n])*\1/g, 'STRING')
    .replace(/`(?:\\.|[^`\\])*`/g, 'TEMPLATE')
    // JSX child text is intentionally localized. Normalize the whole child
    // segment, including expressions surrounded by translated prefixes or
    // suffixes (for example `KRW {amount}` versus a localized amount suffix). Component
    // tags, props, callbacks, and expressions outside translated child text
    // remain part of the structural comparison.
    .replace(/>([^<]*)</g, '>TEXT<')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function publicEntry(entry) {
  return entry.frontmatter.draft !== true && entry.frontmatter.indexable !== false;
}

const koreanNames = listEntries(learnDirectory);
const englishNames = listEntries(englishDirectory);
const koreanEntries = koreanNames.map((name) => parseEntry(learnDirectory, name)).filter(publicEntry);
const englishEntries = englishNames.map((name) => parseEntry(englishDirectory, name));

assert.ok(koreanEntries.length > 0, 'no public Korean Learn entries found');
assert.equal(englishEntries.length, koreanEntries.length, 'English Learn entry count differs from public Korean count');
assert.deepEqual(
  englishEntries.map(({ slug }) => slug),
  koreanEntries.map(({ slug }) => slug),
  'English and Korean Learn slugs differ',
);

const invariantFields = [
  'category',
  'order',
  'demoId',
  'features',
  'relatedGuides',
  'lastReviewedAt',
  'indexable',
  'draft',
];

for (let index = 0; index < koreanEntries.length; index += 1) {
  const korean = koreanEntries[index];
  const english = englishEntries[index];
  const label = english.file;

  for (const field of invariantFields) {
    assert.deepEqual(english.frontmatter[field], korean.frontmatter[field], `${label}: ${field} differs from Korean source`);
  }

  const localizedApi = (korean.frontmatter.relatedApi ?? []).map((href) =>
    href.startsWith('/api/') ? `/en${href}` : href,
  );
  assert.deepEqual(english.frontmatter.relatedApi ?? [], localizedApi, `${label}: relatedApi localization differs`);
  assert.equal(english.frontmatter.locale, 'en', `${label}: locale must be en`);
  assert.equal(english.frontmatter.canonicalPath, `/en/learn/${english.slug}`, `${label}: canonicalPath differs`);
  assert.equal(typeof english.frontmatter.title, 'string', `${label}: title is required`);
  assert.equal(typeof english.frontmatter.description, 'string', `${label}: description is required`);
  assert.ok(english.frontmatter.title.trim().length >= 3, `${label}: title is too short`);
  assert.ok(english.frontmatter.description.trim().length >= 20, `${label}: description is too short`);
  assert.ok(!hangul.test(english.source), `${label}: untranslated Korean text remains`);
  assert.ok(!/\b(?:ZZ(?:CODE|LINK)|CODE\d+)\b/i.test(english.source), `${label}: translation placeholder remains`);
  assert.ok(!/\]\s+\(\/(?:en\/)?(?:learn|api)\//.test(english.body), `${label}: malformed internal Markdown link`);
  assert.ok(!/\]\(\/(?:learn|api)\//.test(english.body), `${label}: unlocalized internal href`);
  assert.ok(!/(?:^|["'])\/api\//m.test(english.source), `${label}: unlocalized API href`);

  const koreanCode = fencedBlocks(korean.body, korean.file);
  const englishCode = fencedBlocks(english.body, english.file);
  assert.equal(englishCode.length, koreanCode.length, `${label}: fenced code block count differs`);
  for (let blockIndex = 0; blockIndex < koreanCode.length; blockIndex += 1) {
    assert.equal(englishCode[blockIndex].language, koreanCode[blockIndex].language, `${label}: code fence language differs`);
    if (structuralFenceLanguages.has(englishCode[blockIndex].language)) {
      assert.equal(
        codeSkeleton(englishCode[blockIndex].code),
        codeSkeleton(koreanCode[blockIndex].code),
        `${label}: code structure or identifiers differ in fence ${blockIndex + 1}`,
      );
    }
  }

  const koreanProseSize = korean.body.replace(/^```[\s\S]*?^```\s*$/gm, '').trim().length;
  const englishProseSize = english.body.replace(/^```[\s\S]*?^```\s*$/gm, '').trim().length;
  assert.ok(englishProseSize >= koreanProseSize * 0.45, `${label}: English prose appears incomplete`);
}

console.log(`ENGLISH_LEARN_CONTENT_OK ${englishEntries.length}`);
