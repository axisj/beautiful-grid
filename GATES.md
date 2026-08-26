# Gates: BeautifulGrid transformation

OWNS: **

Scope: create an independent BeautifulGrid repository, package, and website from the approved source snapshot without modifying the source repository

- [x] G0: this ledger states outcomes that can fail
  CHECK: node /Users/tom/.agents/skills/unlazy/scripts/gate-lint.mjs GATES.md
  EXPECT: LINT OK
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/tom/Development/axisj/beautiful-grid; path=56339810d017/34 entries; EXPECT=matched; output-sha256=958052e1be78d9acdd6d8ab18bb3126f4a183151119a69de38c6f4b36cac193d; output-bytes=150

- [x] G1: public package and React API use the BeautifulGrid identity
  CHECK: node scripts/verify-beautifulgrid-brand.mjs identity
  EXPECT: BeautifulGrid identity verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/tom/Development/axisj/beautiful-grid; path=56339810d017/34 entries; EXPECT=matched; output-sha256=2acb720fca66fce0fb1c1c96965b4512871eb915a9fba0b018370c4485877022; output-bytes=43

- [x] G2: publishable code and website contain no unapproved legacy identity
  CHECK: node scripts/verify-beautifulgrid-brand.mjs legacy
  EXPECT: BeautifulGrid legacy-name verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/tom/Development/axisj/beautiful-grid; path=56339810d017/34 entries; EXPECT=matched; output-sha256=1f2198ca0de82a8853092e0d8f2e880586fe87396a7b57b9729dfe4439e4f147; output-bytes=46

- [x] G3: library build and automated consumer tests succeed
  CHECK: npm run verify:library
  EXPECT: BeautifulGrid library verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/tom/Development/axisj/beautiful-grid; path=56339810d017/34 entries; EXPECT=matched; output-sha256=2fdd0bfbdc75c6174c960d2a66d72d9c9048170fbffb53199f2e8b468cf73ebe; output-bytes=2619

- [x] G4: website build and automated site tests succeed
  CHECK: npm run verify:site
  EXPECT: BeautifulGrid website verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/tom/Development/axisj/beautiful-grid; path=56339810d017/34 entries; EXPECT=matched; output-sha256=6c6e51802bdd68cea044b5f33525b5db95d51ed0490ea05ef2de5a154f41df85; output-bytes=12708

- [x] G5: npm package contains the expected BeautifulGrid metadata and public files
  CHECK: node scripts/verify-package-output.mjs
  EXPECT: BeautifulGrid package-output verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/tom/Development/axisj/beautiful-grid; path=56339810d017/34 entries; EXPECT=matched; output-sha256=cc7d97bba27b2745c26f390dc04455b1dcc91bc3fde9a266f85d6d19c0e8588e; output-bytes=49

- [x] G6: Apache-2.0, notices, and trademark policy are complete and consistent
  CHECK: node scripts/verify-legal-files.mjs
  EXPECT: BeautifulGrid legal verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/tom/Development/axisj/beautiful-grid; path=56339810d017/34 entries; EXPECT=matched; output-sha256=3bb791e2b9018f0f22ec6ba54fc24cadfad4d1fa487b93df2ee90332d4dbeec4; output-bytes=40

- [x] G7: homepage visibly communicates beauty, power, React, and open-source positioning
  EVIDENCE: 2026-08-26 in-app browser review at 1280px and 390px confirmed the approved headline, BeautifulGrid lockup, Apache-2.0 positioning, installation CTA, responsive layout without horizontal overflow, and zero console warnings/errors; Korean mobile and English desktop open-source pages were also visually reviewed

- [x] G8: the source axboot-datagrid repository remains byte-for-byte unchanged by the transformation
  CHECK: node scripts/verify-source-repository.mjs
  EXPECT: BeautifulGrid source-repository verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/tom/Development/axisj/beautiful-grid; path=56339810d017/34 entries; EXPECT=matched; output-sha256=71dcec3f0a53516fbc37c57f48d3bbddca024e7fd4c135d59a68f750bf4e432b; output-bytes=52
