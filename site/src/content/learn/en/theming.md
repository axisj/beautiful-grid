---
title: "Theming and Style Customization"
description: "Override --bgrid-* CSS variables to apply light, dark, and brand-specific themes."
category: "styling-and-accessibility"
order: 3
locale: "en"
canonicalPath: "/en/learn/theming"
demoId: "theming"
features: ["theming", "css-variables", "dark-mode", "custom-styles", "variant"]
relatedGuides: ["getting-started", "basic", "row-styling", "variant", "accessibility-and-keyboard"]
relatedApi: ["/en/api/props#variant", "/en/api/props#classname", "/en/api/props#style"]
lastReviewedAt: "2026-08-23"
indexable: true
draft: false
---

## 1. Overview and CSS variable architecture

BeautifulGrid uses CSS custom properties, so you can change fonts, backgrounds, borders, and active-row highlights by overriding CSS variables. No separate theme provider or heavyweight CSS-in-JS runtime is required.

Switch among **Default**, **Brand**, and **Dark** in the live demo above. The data and column configuration stay the same; only the grid root class and its `--bgrid-*` variables change. The color chips show the active variables and resolved values. Click a cell or hover over a row to compare the selection and hover states in each theme.

A theme changes the visual tokens for the entire grid. Style customization adds business-specific UI, such as a status badge rendered by `itemRender`. Scope either approach beneath the grid instance's `className` so it does not affect other grids.

---

## 2. Core CSS variable contract

```css
/* Override these values on a DataGrid container or in global CSS. */
[role='grid'] {
  /* Font and typography */
  --bgrid-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --bgrid-font-size: 12px;

  /* Borders and separators */
  --bgrid-border-color-base: #cbd5e1;
  --bgrid-border-color-light: #dbe2ea;
  --bgrid-border-color-subtle: #eef2f6;
  --bgrid-header-separator-color: #94a3b8;

  /* Header */
  --bgrid-header-bg: #f8fafc;
  --bgrid-header-color: #1e293b;

  /* Body rows and cells */
  --bgrid-body-bg: #ffffff;
  --bgrid-body-color: #0f172a;
  --bgrid-body-odd-bg: #f8fafc;
  --bgrid-body-hover-bg: #f1f5f9;
  --bgrid-body-hover-odd-bg: #e9eef5;
  --bgrid-body-active-bg: #e2e8f0;

  /* Cell-selection range, drawn as a separate overlay */
  --bgrid-cell-selected-bg: var(--bgrid-body-active-bg);
  --bgrid-cell-selected-overlay-opacity: 0.72;
  --bgrid-cell-selected-border-color: rgba(37, 99, 235, 0.78);
  --bgrid-cell-selected-border-width: var(--bgrid-active-cell-ring-width);

  /* Focused cell within the selection range */
  --bgrid-active-cell-bg: #ffffff;
  --bgrid-active-cell-ring-color: #2563eb;
  --bgrid-active-cell-ring-width: 2px;

  /* Column-header and row-number axes for the selection range */
  --bgrid-selection-axis-bg: #dbeafe;
  --bgrid-selection-axis-color: #2563eb;
  --bgrid-selection-axis-border-color: #2563eb;

  /* Cells with changed values */
  --bgrid-cell-edited-bg: #fff7ed;
  --bgrid-cell-edited-color: #c2410c;
  --bgrid-cell-edited-border-color: #fdba74;
  --bgrid-cell-value-changed-bg: #fff7ed;
  --bgrid-cell-value-changed-color: #c2410c;
  --bgrid-cell-value-changed-border-color: #fdba74;

  /* Accent color (selection outline, active badge) */
  --bgrid-primary-color: #2563eb;

  /* Row-reorder motion and preview */
  --bgrid-row-reorder-duration: 150ms;
  --bgrid-row-reorder-easing: cubic-bezier(0.2, 0, 0, 1);
  --bgrid-row-reorder-guide-color: #2563eb;
  --bgrid-row-reorder-preview-bg: #e2e8f0;
  --bgrid-row-reorder-preview-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);

  /* Sorting and filtering toolbox */
  --bgrid-toolbox-bg: #ffffff;
  --bgrid-toolbox-color: #334155;
  --bgrid-toolbox-muted-color: #64748b;
  --bgrid-toolbox-control-bg: #ffffff;
  --bgrid-toolbox-control-color: #334155;
  --bgrid-toolbox-control-border-color: #cbd5e1;
  --bgrid-toolbox-control-placeholder-color: #94a3b8;
  --bgrid-toolbox-hover-bg: #f1f5f9;
  --bgrid-toolbox-active-bg: #dbeafe;
  --bgrid-toolbox-danger-color: #dc2626;
  --bgrid-toolbox-danger-bg: #fef2f2;
  --bgrid-toolbox-button-bg: #f8fafc;
  --bgrid-toolbox-primary-hover-color: #1d4ed8;
  --bgrid-toolbox-primary-contrast-color: #ffffff;
  --bgrid-toolbox-notice-bg: #f8fafc;
  --bgrid-toolbox-scroll-thumb-bg: #b8c2d1;
  --bgrid-toolbox-scroll-track-bg: #f1f5f9;
  --bgrid-toolbox-focus-ring-color: #bfdbfe;

  /* Search highlights and cell context menu */
  --bgrid-search-bg: #ffffff;
  --bgrid-search-color: #334155;
  --bgrid-search-control-bg: #f8fafc;
  --bgrid-search-button-hover-bg: #f1f5f9;
  --bgrid-search-match-bg: rgba(250, 204, 21, 0.28);
  --bgrid-search-match-border-color: #ca8a04;
  --bgrid-search-current-bg: rgba(249, 115, 22, 0.3);
  --bgrid-search-current-border-color: #f97316;
  --bgrid-context-menu-bg: #ffffff;
  --bgrid-context-menu-color: #334155;
  --bgrid-context-menu-border-color: #cbd5e1;
  --bgrid-context-menu-hover-bg: #f1f5f9;
}
```

Cells changed directly by an edit commit or multi-cell paste receive `bgrid-cell-edited`. Every cell associated with a changed data key receives `bgrid-cell-value-changed`, so columns with different IDs but the same key also show the changed-value state. Selection styling takes precedence while a cell is selected; after the selection moves away, the changed-cell background and inset border become visible again.

Cell selection is drawn as a separate rectangular overlay that ignores pointer events, rather than by changing each cell's border. A range that crosses frozen rows or columns is split into panel-specific segments, but only the outer boundary of the complete selection is shown. The range therefore remains rectangular—even when it includes merged cells—and stays synchronized with scrolling. Control its background with `--bgrid-cell-selected-bg`, its opacity with `--bgrid-cell-selected-overlay-opacity`, and its outline with the `--bgrid-cell-selected-border-*` variables.

The focused cell within a selection uses `--bgrid-active-cell-bg` instead of the selection background. A single-cell selection displays the inset ring defined by `--bgrid-active-cell-ring-*`. In a multi-cell selection, the focused cell's individual ring is removed and only the outline around the complete range is shown. Set that outline thickness with `--bgrid-cell-selected-border-width`; by default, it matches the single-cell focus-ring width.

Column headers included in the active cell or multi-cell range receive `bgrid-column-axis-active`, and the corresponding row numbers receive `bgrid-row-axis-active`. Customize their background, text, and accent colors with the `--bgrid-selection-axis-*` variables. These styles apply identically to frozen and scrollable columns.

The sorting and filtering toolbox, editor plugins, and cell context menu share a per-grid floating root in a document-level portal. The grid's `--bgrid-*` variables are copied to that portal automatically, so popovers and menus inherit the container theme. The search input remains inside the grid and uses `--bgrid-search-*`; matching cells use `--bgrid-search-match-*` and `--bgrid-search-current-*`.

---

## 3. Complete example: applying a dark theme

```tsx
import React from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

export default function DarkThemeGrid() {
  const columns: BGridColumn<any>[] = [
    { key: 'id', label: 'ID', width: 70, align: 'center' },
    { key: 'name', label: 'Service Name', width: 180 },
    { key: 'status', label: 'Status', width: 100, align: 'center' },
  ];

  const data: BGridDataItem<any>[] = [
    { values: { id: 1, name: 'Auth Gateway', status: 'Healthy' } },
    { values: { id: 2, name: 'Payment Worker', status: 'Healthy' } },
  ];

  return (
    <div style={{ padding: 16, backgroundColor: '#0f172a', borderRadius: 8 }}>
      <style>{`
        .custom-dark-grid {
          --bgrid-border-color-base: #334155;
          --bgrid-border-color-light: #475569;
          --bgrid-border-color-subtle: #1e293b;
          --bgrid-header-separator-color: #475569;
          --bgrid-header-bg: #1e293b;
          --bgrid-header-color: #f8fafc;
          --bgrid-body-bg: #0f172a;
          --bgrid-body-color: #e2e8f0;
          --bgrid-body-odd-bg: #111c2f;
          --bgrid-body-hover-bg: #1e293b;
          --bgrid-body-hover-odd-bg: #263449;
          --bgrid-body-active-bg: #334155;
          --bgrid-primary-color: #38bdf8;
        }
      `}</style>

      <BGrid
        className="custom-dark-grid"
        width={450}
        height={180}
        columns={columns}
        data={data}
        rowKey="id"
      />
    </div>
  );
}
```
