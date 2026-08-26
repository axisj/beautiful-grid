---
title: 'Getting Started'
description: 'Install BeautifulGrid in a React project, connect its styles, data, columns, and page container, and render your first grid.'
category: 'getting-started'
order: 1
locale: 'en'
canonicalPath: '/en/learn/getting-started'
features: ['installation', 'style-import', 'first-grid', 'responsive-container']
relatedGuides: ['basic', 'container-resize', 'data-and-columns']
relatedApi: ['/en/api/props#columns', '/en/api/props#data', '/en/api/props#rowkey', '/en/api/props#width', '/en/api/props#height']
lastReviewedAt: '2026-08-23'
indexable: true
draft: false
---

This guide is not a feature showcase. It walks through installing the package in an existing React application, loading the required styles, connecting data, and rendering your **first grid on the page**.

After installation, continue to [Basic DataGrid](/en/learn/basic) for feature-focused guidance on column configuration and cell rendering.

## 1. Install the package

Run the following command from the root of your React project.

```bash
npm install beautiful-grid
```

If you use another package manager, run one of the following commands.

```bash
pnpm add beautiful-grid
# or
yarn add beautiful-grid
```

BeautifulGrid is a React component. In a new project, make sure React and React DOM are installed first.

## 2. Load the Grid styles

Import the distributed CSS once from your application entry point. In a Vite project, this is typically `src/main.tsx`.

```tsx
import 'beautiful-grid/style.css';
```

With the Next.js App Router, add the same import to `app/layout.tsx`, where global CSS can be loaded. Without this stylesheet, the data may render but headers, cells, and scrollbars will not display correctly.

## 3. Add your first DataGrid to a page

The following example contains only the minimum wiring needed for a user-list page, without advanced features.

```tsx
import * as React from 'react';
import {
  BGrid,
  type BGridColumn,
  type BGridDataItem,
} from 'beautiful-grid';

interface User {
  id: string;
  name: string;
  department: string;
}

const columns: BGridColumn<User>[] = [
  { key: 'id', label: 'ID', width: 120 },
  { key: 'name', label: 'Name', width: 160 },
  { key: 'department', label: 'Department', width: 180 },
];

const data: BGridDataItem<User>[] = [
  { values: { id: 'U-001', name: 'Hannah Kim', department: 'Engineering' } },
  { values: { id: 'U-002', name: 'Ethan Lee', department: 'Operations' } },
  { values: { id: 'U-003', name: 'Jamie Park', department: 'Design' } },
];

export default function UsersPage() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const { width, height } = container.getBoundingClientRect();
      setSize({ width: Math.floor(width), height: Math.floor(height) });
    };

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    updateSize();

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <main>
      <h1>User List</h1>
      <div
        ref={containerRef}
        style={{ position: 'relative', width: '100%', height: 360, minWidth: 0 }}
      >
        {size.width > 0 && size.height > 0 && (
          <BGrid<User>
            width={size.width}
            height={size.height}
            columns={columns}
            data={data}
            rowKey='id'
          />
        )}
      </div>
    </main>
  );
}
```

If you use this code as a page component in Next.js, add `'use client';` at the top of the file. It is required because `ResizeObserver` and React Hooks run in the browser.

## 4. Understand the wiring

Four values are required to render the first Grid:

| Input | Role |
|---|---|
| `columns` | Defines which fields to display and their labels and widths. |
| `data` | Contains the actual values for each row. Always wrap each domain object in `{ values: ... }`. |
| `rowKey` | Identifies a unique field for each row so selection, editing, and focus state can be preserved. |
| `width`, `height` | Provides the Grid's actual pixel dimensions so it can calculate the virtual-scroll viewport. |

For a fixed-size page, you can pass numbers directly, such as `width={800}` and `height={360}`. On a responsive page, measure the parent container with `ResizeObserver` as shown above and pass the result to the Grid.

## 5. Verify the result

Start the development server and verify the following on the user-list page:

1. The `ID`, `Name`, and `Department` headers and three rows are visible.
2. Resizing the browser also resizes the Grid to fit its parent.
3. The developer console shows no CSS import or `ResizeObserver` errors.

If the page is empty, first verify that the parent container's height is not `0`. If the Grid looks unstyled, confirm that `beautiful-grid/style.css` is actually loaded from the application entry point.

## 6. Next steps

After installation and page integration, continue with the guide that matches your goal:

- [Basic columns and cell rendering](/en/learn/basic)
- [Responsive container integration (DataGridContainer)](/en/learn/container-resize)
- [Data and column types](/en/learn/data-and-columns)
- [Cell editing](/en/learn/editing)
