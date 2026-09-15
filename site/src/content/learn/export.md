---
title: '데이터 내보내기 (Export CSV, Excel & Data)'
description: '외부 의존성 없이 현재 화면 데이터, 체크된 행, 원본 데이터를 Excel(.xlsx)이나 CSV로 다운로드하거나 외부 라이브러리 연동용 논리 모델을 추출합니다.'
category: 'data-and-columns'
order: 7
locale: 'ko'
canonicalPath: '/learn/export'
demoId: 'export'
features: ['export', 'context-menu', 'row-selection', 'sorting-filtering', 'column-visibility']
relatedGuides: ['context-menu', 'row-selection', 'sorting-filtering', 'column-visibility']
relatedApi: ['/api/props#ref', '/api/props#bgridref-exportcsv', '/api/props#bgridref-getexportdata', '/api/props#columns']
sinceVersion: '1.0.13'
lastReviewedAt: '2026-09-14'
indexable: true
draft: false
---

## 1. 개요

BeautifulGrid는 별도의 외부 라이브러리(SheetJS, ExcelJS 등) 없이도 완전한 Export 기능을 제공합니다.

가상 스크롤(Virtual Scrolling)을 사용하는 그리드에서는 화면 DOM에 일부 행만 렌더링되므로, **DOM을 탐색하여 내보내는 방식은 전체 데이터 유실을 유발합니다.** BeautifulGrid의 Export 기능은 DOM에 일절 의존하지 않고 내부 논리 데이터 모델(`store.data`, `store.sourceData`, `sourceIndexByVisibleIndex`)을 직접 조회하여 신뢰할 수 있는 데이터를 추출합니다.

- `gridRef.current.exportExcel(options)`: 외부 라이브러리 없이 순수 JavaScript로 표준 OpenXML `.xlsx` 파일 직렬화 및 브라우저 다운로드 트리거
- `gridRef.current.exportCsv(options)`: CSV 직렬화 후 브라우저 파일 다운로드 트리거 (RFC 4180 준수, UTF-8 BOM, 수식 인젝션 방지 기본 지원)
- `gridRef.current.getExportData(options)`: 컬럼 및 셀 2차원 배열 형태의 논리 데이터 모델 반환 (JSON, SheetJS, ExcelJS 등에 바로 활용 가능)

## 2. Row Scope (행 범위)

Export 시 대상 행 범위(`rows`)를 다음 세 가지 옵션 중 하나로 지정할 수 있습니다 (기본값: `'displayed'`).

| `rows` 옵션 | 대상 데이터 | 설명 |
| --- | --- | --- |
| `'displayed'` | 현재 화면 논리 행 | 필터, 정렬, 트리 접힘이 반영된 현재 표시 행입니다. 가상 스크롤과 무관하게 전체 논리 행이 화면 표시 순서대로 내보내집니다. |
| `'checked'` | 선택된 행 | `rowChecked`를 통해 체크된 행들을 `sourceData` 순서대로 내보냅니다. 필터로 인해 현재 화면에서 숨겨진 체크 행도 포함됩니다. |
| `'source'` | 현재 로드된 원본 행 | 클라이언트에 로드되어 있는 `sourceData` 전체를 내보냅니다. |

```tsx
// 현재 정렬/필터가 적용된 화면 데이터 내보내기
gridRef.current?.exportCsv({
  fileName: 'orders.csv',
  rows: 'displayed',
});

// 체크된 행만 내보내기
gridRef.current?.exportCsv({
  fileName: 'checked-orders.csv',
  rows: 'checked',
});
```

> [!WARNING]
> **서버 사이드 페이징(Server-side Pagination) 안내**  
> `rows: 'source'`는 전체 데이터베이스 데이터가 아니라 **현재 클라이언트에 로드되어 있는 `sourceData`**를 의미합니다. BeautifulGrid는 내보내기 시 다른 페이지의 데이터를 임의로 서버에서 자동 fetch하지 않습니다. 전체 원본 데이터 추출은 백엔드 Export API 사용을 권장합니다.

## 3. Column Scope (컬럼 범위)

내보낼 컬럼 범위(`columns`)는 다음 중 하나로 지정할 수 있습니다 (기본값: `'visible'`).

- `'visible'`: 컬럼 숨김(Column Visibility)이 적용된 후 현재 표시되는 컬럼 목록
- `'all'`: 현재 숨겨진 컬럼까지 모두 포함한 전체 원본 컬럼 목록 (피벗 모드에서는 피벗 컬럼 전체)
- `readonly string[]`: 지정된 컬럼 ID 배열 순서대로 내보내기 (존재하지 않는 ID는 무시)

```tsx
// 숨겨진 컬럼을 포함하여 모든 컬럼 내보내기
gridRef.current?.exportCsv({
  columns: 'all',
});

// 지정한 컬럼만 특정 순서로 내보내기
gridRef.current?.exportCsv({
  columns: ['orderNo', 'customer', 'price'],
});
```

## 4. 컬럼별 Export 설정 (`BGridColumn`)

컬럼 정의에서 내보내기 제외, 헤더 이름 변환, 셀 값 변환을 세밀하게 제어할 수 있습니다.

```tsx
const columns: BGridColumn<Order>[] = [
  {
    id: 'orderNo',
    key: 'orderNo',
    label: <span>주문 번호</span>,
    exportHeader: 'Order Number', // ReactNode 라벨 대신 사용될 CSV 헤더 문자열
  },
  {
    id: 'price',
    key: 'price',
    label: '단가',
    getExportValue: ({ value }) => Number(value), // 숫자로 정규화
  },
  {
    id: 'actions',
    key: 'orderNo',
    label: '작업',
    exportable: false, // 모든 export scope에서 항상 제외
  },
];
```

### 헤더 값 결정 규칙
1. `column.exportHeader`: 문자열 또는 컬럼 객체를 받는 함수
2. `column.label`: 문자열 또는 숫자일 경우 `String(label)`
3. 컬럼 식별자(`columnId`)

### 셀 값 결정 규칙
`itemRender`의 React UI 결과물은 내보내기에 사용되지 않습니다. 원본 데이터 값(`item.values`)에서 nested key 경로를 읽은 rawValue를 바탕으로 `getExportValue`가 정의되어 있으면 그 반환값을, 그렇지 않으면 원본 rawValue를 사용합니다.

## 5. 컨텍스트 메뉴(Context Menu) 연동

`contextMenuOptions`를 설정하여 마우스 우클릭 시 Export 기능을 바로 실행할 수 있습니다.

```tsx
<BGrid<Order>
  ref={gridRef}
  columns={columns}
  data={data}
  contextMenuOptions={{
    items: () => [
      {
        id: 'export-all-excel',
        label: '전체 로드 행 Excel 내보내기',
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
        label: '전체 로드 행 CSV 내보내기',
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
        label: '체크된 행 Excel 내보내기',
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
        label: '체크된 행 CSV 내보내기',
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

## 6. Excel (.xlsx) 내보내기

별도의 외부 무거운 라이브러리(SheetJS, ExcelJS) 설치 없이 `gridRef.current.exportExcel`을 사용하여 표준 OpenXML Excel 파일(`.xlsx`)을 즉시 다운로드할 수 있습니다.

```tsx
// 현재 화면에 표시된 데이터로 Excel 내보내기
gridRef.current?.exportExcel({
  fileName: 'orders.xlsx',
  sheetName: 'Orders', // 시트 탭 이름 (기본값: 'Sheet1', 최대 31자)
  rows: 'displayed',   // 'displayed' | 'checked' | 'source' (기본값: 'displayed')
  columns: 'visible',  // 'visible' | 'all' | string[] (기본값: 'visible')
  includeHeader: true, // 헤더 행 포함 여부 (기본값: true)
});
```

숫자(`number`)와 불리언(`boolean`) 타입은 Excel 내에서 문자열이 아닌 실제 숫자/불리언 셀 타입으로 직렬화되어 합계 및 수식 계산이 가능합니다.

## 7. CSV 직렬화 및 보안 설정

`exportCsv`는 RFC 4180 호환 이스케이프, UTF-8 BOM, 수식 인젝션(CSV Injection) 방지를 기본 지원합니다.

```tsx
gridRef.current?.exportCsv({
  fileName: 'export.csv',
  delimiter: ',', // 기본값 ',' (탭 구분 '\t', 세미콜론 ';' 등 지원)
  newline: '\r\n', // 기본값 '\r\n'
  bom: true, // 기본값 true (엑셀에서 한글 UTF-8 깨짐 방지)
  preventFormulaInjection: true, // 기본값 true ('=', '+', '-', '@'로 시작하는 문자열 앞에 ' prefix)
});
```

## 8. 외부 엑셀 라이브러리(SheetJS / ExcelJS) 연동

XLSX 파일 생성이 필요할 때는 `getExportData()`를 호출하여 외부 라이브러리에 전달할 수 있습니다.

### SheetJS (xlsx) 연동 예제

```ts
import * as XLSX from 'xlsx';

const exportData = gridRef.current?.getExportData({
  rows: 'displayed',
  columns: 'visible',
});

if (exportData) {
  // 2차원 배열(aoa) 생성
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
