# Gates: AI-friendly homepage redesign

OWNS: site/src/pages/index.astro, GATES.ai-homepage.md

Scope: redesign the homepage AI-friendly section as a distinct, tool-agnostic experience that integrates cleanly with the full page in both locales and themes

- [x] G0: this ledger states outcomes that can fail
  CHECK: node /Users/tom/.agents/skills/unlazy/scripts/gate-lint.mjs GATES.ai-homepage.md
  EXPECT: LINT OK
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/tom/Development/axisj/beautiful-grid; path=951daacaeec6/44 entries; EXPECT=matched; output-sha256=6f1983d8ee0d55c811a884b0b1f6d5681196be70e8ac673d2be31fef4cf92c09; output-bytes=162

- [x] G1: homepage source removes vendor-specific AI positioning and inline presentation styles while preserving localized AI content
  CHECK: node -e "const fs=require('fs');const s=fs.readFileSync('site/src/pages/index.astro','utf8');if(/Cursor|Copilot|style=/.test(s))process.exit(1);for(const x of ['AI가 이해하기 쉬운 그리드','요구사항에서 구현까지','AI-ready by design','From intent to implementation'])if(!s.includes(x))process.exit(1);console.log('AI homepage source contract passed')"
  EXPECT: AI homepage source contract passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/tom/Development/axisj/beautiful-grid; path=951daacaeec6/44 entries; EXPECT=matched; output-sha256=2b124c43bb15c92e6e923d14ca01afe53e581891e3c56631cccae27a099bfee9; output-bytes=35

- [x] G2: theme and localization contracts succeed with the redesigned homepage
  CHECK: npm --prefix site run test -- test/theme-i18n-contract.test.ts test/code-block-theme.test.ts
  EXPECT: 2 passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/tom/Development/axisj/beautiful-grid; path=951daacaeec6/44 entries; EXPECT=matched; output-sha256=d2a548bcdf94d4a4d67d00b7485d9dba6048319023621e1eeef88f5b136102d9; output-bytes=325

- [x] G3: Astro type and content checks report no errors
  CHECK: npm run site:check
  EXPECT: 0 errors
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/tom/Development/axisj/beautiful-grid; path=951daacaeec6/44 entries; EXPECT=matched; output-sha256=0a047ece241c2e5a569654a3e66f25adbe78bd41acba9b3cec5563cda4d70cd8; output-bytes=1290

- [x] G4: the production site build completes successfully
  CHECK: npm run site:build
  EXPECT: Complete!
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/tom/Development/axisj/beautiful-grid; path=951daacaeec6/44 entries; EXPECT=matched; output-sha256=9373411d9321781943d48c16964832eb80e9d9cb32b20c8145889d0a86e69a4c; output-bytes=11157

- [x] G5: desktop and mobile layouts are visually distinct from the following adoption section, responsive without horizontal overflow, readable in both themes, and free of browser console errors
  EVIDENCE: 2026-08-28 in-app browser review at 1280×720 and 390×844 covered Korean and English plus light, dark, and system preferences; the full-width dark workbench remains visually distinct from the following light adoption card, measured page and code overflow were both 0px, and the console reported no warnings or errors
