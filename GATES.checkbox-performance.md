# Gates: million-row checkbox performance

Scope: make individual row checkbox toggles in the one-million-row virtual-scroll example complete without work proportional to the full dataset while preserving selection behavior

- [x] G0: this ledger states outcomes that can fail
  CHECK: node /Users/tom/.agents/skills/unlazy/scripts/gate-lint.mjs GATES.checkbox-performance.md
  EXPECT: LINT OK
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/tom/Development/axisj/beautiful-grid; path=13e996ac1443/44 entries; EXPECT=matched; output-sha256=d1559fcfd92b45b8e2ee1086b79f7591a84bc038a0fb4f2c3bd1e90f70b01566; output-bytes=171

- [x] G1: selection tests cover million-row checkbox updates and preserve checked state semantics
  CHECK: npm test -- --run test/renderingPerformance.test.tsx
  EXPECT: Test Files  1 passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/tom/Development/axisj/beautiful-grid; path=13e996ac1443/44 entries; EXPECT=matched; output-sha256=3096b9d3657c3dedf072abbca9e41e72689fdb4680a76e17e1186f35f317f4e8; output-bytes=316

- [x] G2: the complete library verification suite passes after the checkbox optimization
  CHECK: npm run verify:library
  EXPECT: BeautifulGrid library verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/tom/Development/axisj/beautiful-grid; path=13e996ac1443/44 entries; EXPECT=matched; output-sha256=06f20708d7887e285b1e7abccb1bd44af8ba4434feb152d319781a0f7dcfc508; output-bytes=2627

- [x] G3: an individual checkbox in the one-million-row live example responds promptly and remains checked in a real browser
  EVIDENCE: ego-browser task 112 reproduced the pre-fix repeated-toggle timeout, then measured six post-fix synchronous toggle returns at 0.6-3.1ms; a final real click changed row 1 from unchecked to checked with 126ms end-to-end helper wall time, the checked state was visually confirmed, and the task space was closed.
