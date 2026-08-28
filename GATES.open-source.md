# Gates: Open-source page redesign

Scope: redesign the localized open-source page around adopter verification, operational control, and honest product boundaries without presenting contribution as the primary value

- [x] G0: this ledger states outcomes that can fail
  CHECK: node /Users/tom/.agents/skills/unlazy/scripts/gate-lint.mjs GATES.open-source.md
  EXPECT: LINT OK
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/tom/Development/axisj/beautiful-grid; path=951daacaeec6/44 entries; EXPECT=matched; output-sha256=e53c3de4402919bb58789f6dbc693b2af8cf4443e57563565a26eb2530927f09; output-bytes=162

- [x] G1: the localized page proves source, tests, releases, product boundaries, and license terms while keeping contribution secondary
  CHECK: npm exec -- vitest run test/site-contract.test.ts -t "open.?source" && node -e "console.log('Open-source content verification passed')"
  EXPECT: Open-source content verification passed
  CWD: site
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/tom/Development/axisj/beautiful-grid/site; path=951daacaeec6/44 entries; EXPECT=matched; output-sha256=c69d3003393a34f99412d3ec0964079d529db6e0c6ab608e5dffa14b3aa5a605; output-bytes=283

- [x] G2: the redesigned page type-checks and the complete website builds
  CHECK: npm run site:check && npm run site:build && node -e "console.log('Open-source site build verification passed')"
  EXPECT: Open-source site build verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/tom/Development/axisj/beautiful-grid; path=951daacaeec6/44 entries; EXPECT=matched; output-sha256=7e883927161a66a93f37c4970a55b2f0b7970da8434d46ec7aee836307df2e29; output-bytes=12486

- [x] G3: open-source page browser contracts pass at desktop and mobile sizes
  CHECK: npx playwright test --config playwright.site.config.ts e2e/open-source.spec.js && node -e "console.log('Open-source browser verification passed')"
  EXPECT: Open-source browser verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/tom/Development/axisj/beautiful-grid; path=951daacaeec6/44 entries; EXPECT=matched; output-sha256=a7fb6b4dd0218117937845c8e32d09607a7696ec692c5ec59b1fd4d024d0e591; output-bytes=1554

- [x] G4: Korean and English pages are visually coherent in light and dark themes with one main landmark and no mobile horizontal overflow
  EVIDENCE: 2026-08-28 in-app browser review at 1440x900 and 390x844 confirmed the single-column hero has no contract card, the “무료/자유” headline and promoted promise retain clear hierarchy, all six shortened section headings scan coherently, Korean and English structures remain equivalent, one main landmark is present, and document scroll width does not exceed the viewport
