---
title: "Pagination"
description: "Place page-number navigation in the DataGrid footer and connect it to a server-side pagination API."
category: "data-and-columns"
order: 2
locale: "en"
canonicalPath: "/en/learn/pagination"
demoId: "pagination"
features: ["pagination", "page", "server-side-paging", "pageSize", "totalElements", "bottomBarHeight"]
relatedGuides: ["getting-started", "basic", "virtual-scroll", "sorting-filtering"]
relatedApi: ["/en/api/props#page", "/en/api/props#bottombarheight", "/en/api/props#columns"]
lastReviewedAt: "2026-08-23"
indexable: true
draft: false
---

## 1. When and why should you use it?

Virtual scrolling is useful when users browse a complete dataset continuously, much like infinite scrolling. **Pagination** is a better fit when you need to:

1. **Reduce database load for large datasets**: Fetch only 10–50 records at a time from the backend with `LIMIT / OFFSET`, reducing network costs.
2. **Provide a clear position in the result set**: Let users jump directly to a known location, such as “the fifth item on page 3.”
3. **Support printing and reports**: Work with documents that must be printed or reviewed one page at a time.

---

## 2. Complete example: server-side pagination

The following example uses an asynchronous API simulation to refresh the data whenever the page changes:

```tsx
import React, { useState, useEffect } from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

interface MemberItem {
  id: number;
  email: string;
  name: string;
  joinDate: string;
  status: 'ACTIVE' | 'DORMANT' | 'BLOCKED';
}

export default function MemberPaginationGrid() {
  const [currentPage, setCurrentPage] = useState(1); // 1-based page number
  const pageSize = 10;
  const totalElements = 145; // 145 records in total

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BGridDataItem<MemberItem>[]>([]);

  // Simulate loading data when the page changes
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const startIdx = (currentPage - 1) * pageSize;
      const mockItems: BGridDataItem<MemberItem>[] = Array.from({ length: pageSize }).map((_, i) => {
        const itemIndex = startIdx + i + 1;
        return {
          values: {
            id: itemIndex,
            email: `user_${itemIndex}@example.com`,
            name: `User_${itemIndex}`,
            joinDate: '2026-08-01',
            status: itemIndex % 5 === 0 ? 'DORMANT' : 'ACTIVE',
          },
        };
      });
      setData(mockItems);
      setLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [currentPage]);

  const columns: BGridColumn<MemberItem>[] = [
    { key: 'id', label: 'Member ID', width: 90, align: 'center' },
    { key: 'name', label: 'Member Name', width: 140, align: 'center' },
    { key: 'email', label: 'Email Address', width: 250 },
    { key: 'joinDate', label: 'Joined At', width: 130, align: 'center' },
    {
      key: 'status',
      label: 'Status',
      width: 100,
      align: 'center',
      itemRender: ({ values }) => (
        <span style={{ color: values.status === 'ACTIVE' ? '#16a34a' : '#d97706', fontWeight: 600 }}>
          {values.status === 'ACTIVE' ? 'Active' : 'Dormant'}
        </span>
      ),
    },
  ];

  return (
    <div>
      <BGrid<MemberItem>
        width={750}
        height={360}
        columns={columns}
        data={data}
        rowKey="id"
        loading={loading}
        // Pagination configuration
        page={{
          currentPage,
          pageSize,
          totalElements,
          totalPages: Math.ceil(totalElements / pageSize),
          loading,
          onChange: (newPage: number) => {
            console.log(`Go to page ${newPage}`);
            setCurrentPage(newPage);
          },
        }}
        bottomBarHeight={36} // Height of the pagination bar
        headerHeight={34}
        itemHeight={28}
      />
    </div>
  );
}
```

---

## 3. `page` property reference

```tsx
interface BGridPage {
  // Current page number (starts at 1)
  currentPage?: number;

  // Number of rows per page
  pageSize?: number;

  // Total number of pages; required to render page-number controls
  totalPages?: number;

  // Total number of records on the server
  totalElements?: number;

  // Whether page data is loading
  loading?: boolean;

  // Called when the user clicks a page number or the Previous/Next button
  onChange?: (newPage: number, pageSize?: number) => void;
}
```

---

## 4. Practical tips and gotchas

> [!IMPORTANT]
> **1-based page numbering**:
> The built-in pagination UI treats the first page as `1`. If your backend API expects a zero-based page index, send `currentPage - 1` in the request and convert the response back to `pageIndex + 1` for UI state. Provide both `currentPage` and `totalPages` to display the page-number controls.
