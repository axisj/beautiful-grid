# Gates: v1.0.10 versus current performance content

OWNS: GATES.performance-content.md, scripts/serve-version-performance-fixtures.mjs, scripts/verify-performance-content.mjs, site/src/components/performance/**, site/src/components/support/**, site/src/data/performance/**, site/src/pages/performance.astro, site/src/pages/performance/**, site/src/pages/en/performance.astro, site/src/pages/product-facts.astro, site/src/pages/en/product-facts.astro, site/src/components/layout/Header.astro, site/src/components/layout/MobileNavigationDrawer.astro, site/src/components/layout/Footer.astro, site/src/i18n/index.ts, site/test/**

Scope: measure the v1.0.10 release tag and the settled current working tree under identical production-browser fixtures, preserve reproducible evidence, and publish a bilingual performance report without changing library product source

- [x] G0: this ledger states outcomes that can fail
  CHECK: node /Users/tom/.agents/skills/unlazy/scripts/gate-lint.mjs GATES.performance-content.md
  EXPECT: LINT OK
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/tom/Development/axisj/beautiful-grid; path=13e996ac1443/44 entries; EXPECT=matched; output-sha256=d97b8dbea02236731138b60089c2b441a4f380a599ef5b8731828bb18b229a04; output-bytes=170

- [x] G1: stored benchmark evidence contains identical v1.0.10 and current scenarios with at least seven measured runs and complete environment metadata
  CHECK: node scripts/verify-performance-content.mjs --results
  EXPECT: performance result verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/tom/Development/axisj/beautiful-grid; path=13e996ac1443/44 entries; EXPECT=matched; output-sha256=ca1cb92adba08791136a1842de58c51bc57c5b24b9c12a7755a4a47b9fad15c1; output-bytes=39

- [x] G2: every published v1.0.10 comparison number and claim is derived from the stored benchmark evidence and bilingual performance routes expose the methodology and limitations
  CHECK: node scripts/verify-performance-content.mjs --content
  EXPECT: performance content verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/tom/Development/axisj/beautiful-grid; path=13e996ac1443/44 entries; EXPECT=matched; output-sha256=45be0eec8831f61f50f2e47f42df1667d1ab5b3f2e90865e3f9e3f75c075d147; output-bytes=40

- [x] G3: the complete website verification suite passes with the new performance content
  CHECK: npm run verify:site
  EXPECT: BeautifulGrid website verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/tom/Development/axisj/beautiful-grid; path=13e996ac1443/44 entries; EXPECT=matched; output-sha256=3c2dffe43d21ee2b8ff850aee8007cf202ecd0793209024064d8d1dce8700a3b; output-bytes=17848

- [x] G4: repository formatting and whitespace checks pass without modifying the in-progress library performance implementation
  CHECK: node scripts/verify-performance-content.mjs --whitespace
  EXPECT: performance whitespace verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/tom/Development/axisj/beautiful-grid; path=13e996ac1443/44 entries; EXPECT=matched; output-sha256=1709483aa9ed32768a8cdbd786a34f53f6c63a329547e498f3c2a4fd075f5c1b; output-bytes=43

- [x] G5: the Korean and English performance pages render correctly at desktop and mobile widths in an isolated real Chromium session
  EVIDENCE: ego-browser task 110 verified Korean at 1440x1000 and English at 390x844; both showed the data-derived 69.0% headline and v1.0.10 baseline, active performance tab, zero horizontal body overflow, scrollable mobile table, working raw JSON and source links, and raw evidence containing the benchmark id, v1.0.10 SHA, and current working-tree fingerprint. Desktop and mobile screenshots were visually reviewed, then the task space was closed.
