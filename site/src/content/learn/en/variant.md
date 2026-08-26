---
title: 'Vertical Dividers (Variant)'
description: 'Use the variant prop to toggle vertical dividers in body and summary cells and understand exactly where the setting applies.'
category: 'styling-and-accessibility'
order: 4
locale: 'en'
canonicalPath: '/en/learn/variant'
demoId: 'variant'
features: ['variant', 'default', 'vertical-bordered', 'borders', 'summary']
relatedGuides: ['theming', 'row-styling', 'summary', 'accessibility-and-keyboard']
relatedApi: ['/en/api/props#variant']
lastReviewedAt: '2026-08-19'
indexable: true
draft: false
---

## 1. What `variant` changes

The `BGrid` `variant` prop controls vertical dividers in body and summary cells. It does not change data, columns, sorting, selection, or any other grid behavior.

| Value               | Appearance                                       | Recommended use                              |
| ------------------- | ------------------------------------------------ | ------------------------------------------- |
| `default`           | Default style without vertical dividers between body cells | General lists designed for row-by-row scanning |
| `vertical-bordered` | Adds a vertical divider to the right of each body and summary cell | Dense tables where column boundaries must be easy to distinguish |

If you omit the prop, `default` is applied.

---

## 2. Live example

Use the selector above to switch between the two values and compare the vertical dividers in the body and bottom summary row. When frozen columns are enabled, the same `variant` is applied consistently to both the frozen and scrollable regions.

The key setting is:

```tsx
const [variant, setVariant] = useState<'default' | 'vertical-bordered'>('default');

<BGrid
  columns={columns}
  data={data}
  variant={variant}
  summary={{
    position: 'bottom',
    columns: summaryColumns,
  }}
/>;
```

`variant` controls vertical dividers between grid cells. It is unrelated to `scrollbar.variant`, which accepts `native | classic | modern`. See the [scrollbar configuration guide](/en/learn/scrollbar) for scrollbar styling.

---

## 3. Use it with a theme

The `vertical-bordered` divider uses `--bgrid-border-color-light`, falling back to `--bgrid-border-color-base` when the lighter color is not defined. Override the variable on the grid wrapper to match your application's theme.

```css
.report-grid {
  --bgrid-border-color-light: #cbd5e1;
}
```

After adjusting the divider color, verify that column boundaries remain clear in regular rows, hover and selection states, and the summary row.
