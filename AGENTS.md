# AGENTS.md — beautiful-grid

## Project Overview
`beautiful-grid` is a React datagrid library. The `beautiful-grid/` directory is the **publishable library source**; everything else (`src/`, `examples/`, `components/`) is a Vite dev/demo app.

## Architecture

### Library source: `beautiful-grid/`
- **`BGrid.tsx`** — Public component entry. Wraps `<AppStoreProvider>` + `<Table>`. Computes `computedColumns` (adds `left` offset per column) before passing props into the store.
- **`store/createAppStore.tsx`** — Single Zustand store per grid instance, provided via React context (`AppStoreProvider`). All internal components read state via `useAppStore(selector)`. Do **not** use global zustand stores; each `<BGrid>` gets its own isolated store.
- **`types.ts`** — Source of truth for all types. Key types: `BGridProps<T>` (public API), `AppModel<T>` (internal state), `AppStore<T>` (model + actions), `BGridDataItem<T>` (row wrapper with `values`, `status`, `checked`).
- **`components/`** — Pure rendering components (Table, TableHead, TableBody, etc.). Frozen columns have paired components (e.g. `TableBodyFrozen`, `TableHeadFrozen`).
- **`utils/`** — Shared utilities: `getCellValue.tsx`, `getFrozenColumnsWidth.ts`, `useBodyData.ts` (virtual scroll logic), `mouseEventSubscribe.ts`.

### Data flow
```
BGridProps<T> → BGrid → AppStoreProvider (Zustand) → Table → TableHead/TableBody/...
```
Each prop change flows through setter actions (`setData`, `setColumns`, etc.) called in `Table.tsx` via `useEffect`.

### Frozen columns
Columns with index `< frozenColumnIndex` get `left: -1` (sentinel value) and are rendered in separate `*Frozen` components. Non-frozen columns get absolute `left` offset pre-computed in `BGrid.tsx`.

### Column key
`BGridColumn.key` can be `string | string[]` (dot-path array). Use `getCellValue` / `getCellValueByRowKey` utilities to read nested values.

## Developer Workflows

```bash
# Dev server (Astro docs & demo site; npm i automatically installs site deps via postinstall)
npm run dev

# Lint
npm run lint

# Run tests
npm test
npm run test:watch
npm run test:library:consumers
npm run test:e2e
npm run test:e2e:ui

# Build the library for publishing (outputs to dist/)
npm run build:library   # = clean + style + cjs + esm + types + manifest
npm run pack:library    # npm pack ./dist
npm run publish:library # npm publish ./dist --access public

# Build/preview the docs & demo site
npm run build           # alias of site:build
npm run preview

# Local verification (run when needed before opening or merging a PR)
npm run verify:library  # runs lint, test, css check, consumers check, and bundle budget check
npm run verify:site     # runs site font size check, site unit test, astro check, and site build
```

### Verification Requirement
Git pushes do not run local tests. The `Test` GitHub Actions workflow validates pushes and pull requests. Run the relevant local verification command while developing when you need earlier feedback, and always before a manual npm release. If the library bundle size changed, run `npm run update:library:bundle-metrics` and commit `site/src/data/bundleMetrics.ts`.

Library tsconfigs live in `tsconfigs/tsconfig.library.cjs.json`, `tsconfigs/tsconfig.library.esm.json`, and `tsconfigs/tsconfig.library.types.json`. The Vite demo app uses the root `tsconfig.json` and `vite.config.ts` (`vite.config.mjs` is also present).

`npm run build:library` runs `scripts/create-dist-package-json.mjs` (`build:library:manifest`) to generate dist package metadata (`dist/package.json`) and copy `README.md`, `LICENSE`, `NOTICE`, and `TRADEMARK.md` into `dist/`.

Manual release publishing is configured in `.github/workflows/publish-npm.yml`. Update the version on `main` with `npm run release:rc` or `npm run release:set -- <version>`, commit and push the version files, then run **Publish npm Package** from the GitHub Actions UI on the `main` branch. The workflow verifies and builds the selected commit, creates the GitHub Release and version tag, and then publishes the same artifact to npm. It uses npm Trusted Publishing (OIDC), so configure `axisj/beautiful-grid`, `publish-npm.yml`, and the `npm` GitHub environment as the package's trusted publisher before using it. Prereleases publish under the `next` dist-tag; stable versions publish under `latest`. Do not create release tags locally.

## Key Conventions

- **`BGridDataItem<T>`**: Rows are always wrapped — access actual data via `item.values`, not `item` directly.
- **Editing**: Set `editable` on `BGridColumn` to enable cell editing. Implement `itemRender` with `handleSave`/`handleCancel`/`handleMove` callbacks (see `examples/editors/`).
- **Row check state**: Tracked via `checkedIndexesMap: Map<number, any>` in the store. `checkedAll` is a tri-state: `true | false | 'indeterminate'`.
- **Cell merge**: Pass `cellMergeOptions.columnsMap` keyed by column index; each entry has `mergeBy` (column key to group on).
- **Static library CSS**: publishable components use prefixed `bgrid-*` classes and `--bgrid-*` CSS custom properties from `beautiful-grid/style.css`. Keep Tailwind utilities in the demo app only. Use inline styles only for runtime-computed dimensions and positions. Do not add runtime CSS-in-JS.
- **Column `left`**: Always computed in `BGrid.tsx` before entering the store. Do not mutate `left` elsewhere.

## Key Files
| File | Purpose |
|---|---|
| `beautiful-grid/types.ts` | All public + internal types |
| `beautiful-grid/BGrid.tsx` | Library entry, column pre-computation |
| `beautiful-grid/store/createAppStore.tsx` | All state + actions |
| `beautiful-grid/components/Table.tsx` | Main orchestrator, syncs props → store |
| `beautiful-grid/utils/useBodyData.ts` | Virtual scroll / visible row calculation |
| `examples/` | Usage patterns (editor, paging, sort, merge, reorder, etc.) |
