---
title: 'Data Export (Export CSV, Excel & Data)'
description: 'Export displayed data, checked rows, or full source data to Excel (.xlsx) or CSV without external dependencies, or extract a logical model for external libraries.'
category: 'data-and-columns'
order: 7
locale: 'en'
canonicalPath: '/en/learn/export'
demoId: 'export'
features: ['export', 'context-menu', 'row-selection', 'sorting-filtering', 'column-visibility']
relatedGuides: ['context-menu', 'row-selection', 'sorting-filtering', 'column-visibility']
relatedApi: ['/en/api/props#ref', '/en/api/props#bgridref-exportcsv', '/en/api/props#bgridref-getexportdata', '/en/api/props#columns']
sinceVersion: '1.0.13'
lastReviewedAt: '2026-09-14'
indexable: true
draft: false
---

## 1. Overview

BeautifulGrid provides a built-in export system without external dependencies (such as SheetJS or ExcelJS).

Because BeautifulGrid uses virtual scrolling, only visible rows are rendered in the DOM. **Attempting to scrape DOM nodes causes data loss.** BeautifulGrid exports data directly from its logical state model (`store.data`, `store.sourceData`, `sourceIndexByVisibleIndex`) ensuring reliable and complete exports regardless of scroll position.

- `gridRef.current.exportExcel(options)`: Generates standard OpenXML `.xlsx` files and triggers browser download with zero external dependencies
- `gridRef.current.exportCsv(options)`: Serializes data to CSV and triggers a browser file download (RFC 4180 compliant, UTF-8 BOM, formula injection prevention)
- `gridRef.current.getExportData(options)`: Extracts logical column and cell 2D arrays (compatible with JSON, SheetJS, ExcelJS, etc.)

## 2. Row Scope

Specify the target rows using the `rows` option (default: `'displayed'`).

| `rows` Option | Target Data | Description |
| --- | --- | --- |
| `'displayed'` | Visible logical rows | Current rows with filters, sorting, and tree folding applied. Preserves exact display order regardless of virtualization. |
| `'checked'` | Selected rows | Rows selected via `rowChecked` in `sourceData` order. Includes checked rows currently hidden by filters. |
| `'source'` | Loaded source rows | All rows currently loaded in the client-side `sourceData`. |

```tsx
// Export current filtered and sorted rows
gridRef.current?.exportCsv({
  fileName: 'orders.csv',
  rows: 'displayed',
});

// Export only checked rows
gridRef.current?.exportCsv({
  fileName: 'checked-orders.csv',
  rows: 'checked',
});
```

> [!WARNING]
> **Server-side Pagination Notice**  
> `rows: 'source'` refers to the **rows currently loaded in `sourceData` on the client**, not the entire remote database table. BeautifulGrid does not automatically fetch subsequent pages during export. For full database exports, use a server-side export endpoint.

## 3. Column Scope

Specify which columns to export using the `columns` option (default: `'visible'`).

- `'visible'`: Currently visible columns after column visibility projection
- `'all'`: All columns including hidden columns (in pivot mode, all generated pivot columns)
- `readonly string[]`: Explicit list of column IDs in specified order (unmatched IDs are ignored)

```tsx
// Export all columns including hidden columns
gridRef.current?.exportCsv({
  columns: 'all',
});

// Export specific columns in specified order
gridRef.current?.exportCsv({
  columns: ['orderNo', 'customer', 'price'],
});
```

## 4. Column Export Configuration (`BGridColumn`)

Configure exclusion, custom headers, and value converters on column definitions:

```tsx
const columns: BGridColumn<Order>[] = [
  {
    id: 'orderNo',
    key: 'orderNo',
    label: <span>Order No</span>,
    exportHeader: 'Order Number', // Custom header string instead of ReactNode
  },
  {
    id: 'price',
    key: 'price',
    label: 'Price',
    getExportValue: ({ value }) => Number(value), // Normalize value
  },
  {
    id: 'actions',
    key: 'orderNo',
    label: 'Actions',
    exportable: false, // Always excluded from export
  },
];
```

### Header Resolution Order
1. `column.exportHeader`: string or callback function receiving the column definition
2. `column.label`: if string or number, `String(label)`
3. Column identifier (`columnId`)

### Cell Value Resolution
`itemRender` output is not used for export. Raw values are resolved from nested row keys (`getCellValueByRowKey`). If `column.getExportValue` is provided, its return value is used; otherwise, the raw value is exported.

## 5. Context Menu Integration

Use `contextMenuOptions` to add export actions to the right-click menu:

```tsx
<BGrid<Order>
  ref={gridRef}
  columns={columns}
  data={data}
  contextMenuOptions={{
    items: () => [
      {
        id: 'export-all-excel',
        label: 'Export all loaded rows to Excel',
        onSelect: () => {
          gridRef.current?.exportExcel({
            fileName: 'all-orders.xlsx',
            rows: 'source',
            columns: 'all',
          });
        },
      },
      {
        id: 'export-all-csv',
        label: 'Export all loaded rows to CSV',
        onSelect: () => {
          gridRef.current?.exportCsv({
            fileName: 'all-orders.csv',
            rows: 'source',
            columns: 'all',
          });
        },
      },
      { type: 'separator', id: 'export-sep' },
      {
        id: 'export-checked-excel',
        label: 'Export checked rows to Excel',
        disabled: checkedRowKeys.length === 0,
        onSelect: () => {
          gridRef.current?.exportExcel({
            fileName: 'selected-orders.xlsx',
            rows: 'checked',
            columns: 'visible',
          });
        },
      },
      {
        id: 'export-checked-csv',
        label: 'Export checked rows to CSV',
        disabled: checkedRowKeys.length === 0,
        onSelect: () => {
          gridRef.current?.exportCsv({
            fileName: 'selected-orders.csv',
            rows: 'checked',
            columns: 'visible',
          });
        },
      },
    ],
  }}
/>
```

## 6. Excel (.xlsx) Export
 
You can export directly to standard OpenXML Excel (`.xlsx`) using `gridRef.current.exportExcel` without installing any heavy external dependencies:
 
```tsx
// Export current visible data to Excel
gridRef.current?.exportExcel({
  fileName: 'orders.xlsx',
  sheetName: 'Orders', // Sheet tab name (default: 'Sheet1', max 31 characters)
  rows: 'displayed',   // 'displayed' | 'checked' | 'source' (default: 'displayed')
  columns: 'visible',  // 'visible' | 'all' | string[] (default: 'visible')
  includeHeader: true, // Whether to include header row (default: true)
});
```

Numbers and boolean values are preserved as native Excel number and boolean cell types, enabling immediate formulas and calculations without manual type casting.

## 7. CSV Formatting and Security

`exportCsv` supports standard RFC 4180 escaping, UTF-8 BOM, and formula injection mitigation out of the box:

```tsx
gridRef.current?.exportCsv({
  fileName: 'export.csv',
  delimiter: ',', // Default ',' (supports '\t', ';', etc.)
  newline: '\r\n', // Default '\r\n'
  bom: true, // Default true (prevents UTF-8 Korean/special char corruption in Excel)
  preventFormulaInjection: true, // Default true (prefixes strings starting with '=', '+', '-', '@' with ')
});
```

## 8. Integration with SheetJS / ExcelJS

When generating binary Excel (`.xlsx`) files, pass `getExportData()` output to an external library:

### SheetJS (xlsx) Example

```ts
import * as XLSX from 'xlsx';

const exportData = gridRef.current?.getExportData({
  rows: 'displayed',
  columns: 'visible',
});

if (exportData) {
  const aoa = [
    exportData.columns.map(c => c.header),
    ...exportData.rows.map(row => row.cells),
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, 'orders.xlsx');
}
```
