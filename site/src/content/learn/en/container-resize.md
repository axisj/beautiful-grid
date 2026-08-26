---
title: "Responsive Containers (DataGridContainer)"
description: "Measure the grid container with ResizeObserver so the DataGrid renders at the correct size as its layout grows or shrinks."
category: "getting-started"
order: 3
locale: "en"
canonicalPath: "/en/learn/container-resize"
demoId: "container-resize"
features: ["resize-observer", "responsive-layout", "container", "absolute-positioning"]
relatedGuides: ["getting-started", "basic", "virtual-scroll"]
relatedApi: ["/en/api/props#width", "/en/api/props#height"]
lastReviewedAt: "2026-08-18"
indexable: true
draft: false
---

## 1. Measure the grid, not the viewport

Application layouts often change width and height at runtime because of side panels, tabs, and split views. If you give the grid an initial `window` size or a fixed value, it may look correct when the viewport grows but retain a stale size when the viewport shrinks, causing horizontal scrolling and layout misalignment.

`useContainerSize` uses `ResizeObserver` to observe the **actual content area of the element that contains the grid**. Pass the measured `width` and `height` to `BGrid` so it rerenders whenever the parent layout grows or shrinks.

---

## 2. Why `DataGridContainer` is necessary

`DataGridContainer` is a `position: relative` measurement boundary. The DataGrid root inside it is positioned with `position: absolute; inset: 0`. The container therefore retains its exact size in normal document flow while the grid fills the measured area completely.

In flex and grid layouts, the item that contains the grid needs `min-width: 0` so it can shrink below its content's intrinsic width. The container also needs an explicit height. DataGrid uses that height to calculate the visible row count and virtual-scroll range.

---

## 3. Setup steps

1. Wrap the grid area in `DataGridContainer` and give it a height.
2. Pass the container ref to `useContainerSize`.
3. Pass the returned `width` and `height` to `BGrid`.
4. If the parent uses flexbox or CSS Grid, apply `minWidth: 0` or CSS `min-width: 0` to the item that contains the grid.

Open and close the side panel in the live example. The grid immediately adjusts to the correct width whether the container grows or shrinks.

---

## 4. Approaches to avoid

- Reading `window.innerWidth` once and using it as the grid size
- Passing only `height="100%"` without giving the container a definite height
- Leaving the default `min-width: auto` on a flex item so its content cannot shrink
- Measuring an arbitrary DOM element outside the grid and sharing that size across multiple grids

The most predictable approach is for each grid to observe its own container. This remains reliable in split views, collapsible panels, and responsive layouts.
