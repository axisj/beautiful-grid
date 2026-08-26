---
title: 'Powerful Cell Extensions (itemRender)'
description: 'Build Canvas charts, facility-load heatmaps, status gauges, and row-level actions in one grid with itemRender.'
category: 'data-and-columns'
order: 3
locale: 'en'
canonicalPath: '/en/learn/item-render'
demoId: 'item-render'
features: ['itemRender', 'canvas', 'custom-cell', 'react-component', 'accessibility']
relatedGuides: ['data-and-columns', 'virtual-scroll', 'search', 'accessibility-and-keyboard']
relatedApi:
  ['/en/api/props#bgridcolumn-itemrender', '/en/api/props#bgriditemrenderprops', '/en/api/props#bgridcolumn-getclipboardtext']
lastReviewedAt: '2026-08-24'
indexable: true
draft: false
---

## Extend a text cell into a small application

`itemRender` is more than a string formatter. It receives the current row's `values`, the cell's `value`, row and column indexes, and editing controls, and it can return **any React node**. This makes it possible to place visualizations and interactions inside a cell that would be difficult to build with a conventional formatter-based Grid.

The logistics-control example above renders the following UI from the same row data:

| Cell | Implementation | Why it is harder than a text cell |
| ----------- | ----------------------------------- | ------------------------------------------------------ |
| Fulfillment center | Composite cell with an icon, name, and code | Combines several row fields rather than displaying a single value. |
| Throughput trend | High-resolution Canvas sparkline | Converts an array to coordinates and renders at the device pixel ratio. |
| Facility load | 12-segment Canvas heatmap | Calculates colors and blocks dynamically from numeric ranges. |
| Fulfillment SLA | CSS circular gauge with status text | Combines a value, status, and accessible text in one component. |
| Exception response | Button that changes row state | Manages the event boundary between cell clicks and button clicks. |

Click **Show exception centers only** to filter the displayed rows through React state. **Acknowledge N alerts** immutably updates only the corresponding row. The Canvas cells are not continuously animated; they redraw only when their data changes.

## Core pattern: return a component from the callback

Do not call Hooks inside `itemRender` itself. Return a React component that uses the Hooks instead. This follows the Rules of Hooks and keeps Canvas lifecycle and memoization independent.

```tsx
const SparklineCanvas = React.memo(function SparklineCanvas({ values }: { values: number[] }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    // Account for devicePixelRatio, then convert values to coordinates and draw them.
  }, [values]);

  return <canvas ref={canvasRef} role='img' aria-label={`Throughput ${values.join(', ')}`} />;
});

const columns: BGridColumn<FulfillmentCenter>[] = [
  {
    key: 'throughput',
    label: 'Hourly throughput trend',
    width: 205,
    itemRender: ({ values }) => <SparklineCanvas values={values.throughput} />,
    getClipboardText: ({ values }) => `${values.throughput.at(-1)} orders/h`,
  },
];
```

The source panel on this page contains the complete implementation, including Canvas coordinate calculations, color ranges, and action buttons.

## Rendering context

| Property | Example use |
| ------------------------------------------ | ------------------------------------------------------------------------ |
| `value` | Build a chart or gauge from the value referenced by the current `column.key`. |
| `values` | Combine several fields from the same row into cells such as name + code or value + status. |
| `item` | Inspect Grid row state such as `status` and `checked` alongside `values`. |
| `index`, `columnIndex` | Include the position in an accessible name or per-cell diagnostic data. |
| `handleSave`, `handleCancel`, `handleMove` | Control a custom editing flow for an `editable` column. |

Display components and editing UI have different responsibilities. Use `itemRender` for rich idle-state display, and keep input and save lifecycle in `editor` or the editing-control functions.

## Using Canvas with virtual scrolling

BeautifulGrid virtual scrolling keeps only the rows needed for the current viewport in the DOM. Canvas cells can therefore mount when they enter the viewport and unmount when they leave it.

- Precompute repeated work such as coordinate conversion or color ranges, or isolate it in a small component.
- Use `useMemo` for column arrays, `useCallback` for event handlers, and `React.memo` for expensive cell components.
- Prefer a single redraw when data changes over a continuous `requestAnimationFrame` loop.
- Match the Canvas CSS size and backing-store pixel size to `devicePixelRatio` to preserve sharpness.
- Set a stable row height that fits the content, and test actual scrolling at the target data scale.

Many Canvas cells are not inherently slow, but each one has its own graphics context. Verify that the application mounts only the cells needed within the virtual-scroll range rather than placing thousands of Canvas elements in the DOM at once.

## Define search, clipboard, and accessibility text separately

Rendered DOM or Canvas pixels do not automatically become the Grid's search or clipboard text. When the visual presentation differs from the data's meaning, define the following contracts as well:

- `getClipboardText`: return a user-readable string instead of an array or object.
- `getSearchText`: when using Grid search, provide a searchable value or label that represents the chart.
- Give each Canvas `role="img"` and an `aria-label` that summarizes the data.
- Do not communicate status through color alone; include text such as `Normal`, `Watch`, or `Action required`.
- Give buttons inside cells a specific `aria-label`, and call `event.stopPropagation()` when they should not also trigger the row click.

## Suitable use cases and boundaries

`itemRender` is especially useful in Grids for operations monitoring, production-equipment status, portfolio changes, quality-inspection results, and inventory risk—cases where row comparison and compact visualizations are both important.

Large charts spanning multiple cells, free-form dashboards, and high-frame-rate animations are better placed in a separate chart area. The strength of `itemRender` is increasing information density and interactivity without losing each row's context.
