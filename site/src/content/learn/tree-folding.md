---
title: '트리 폴딩 (Tree Folding)'
description: '평면 데이터의 부모 키 관계를 트리로 표시하고 행을 안전하게 접고 펼치는 방법을 설명합니다.'
category: 'advanced'
order: 32
locale: 'ko'
canonicalPath: '/learn/tree-folding'
demoId: 'tree-folding'
features: ['tree', 'folding', 'parent-row-key', 'virtual-scroll', 'accessibility']
relatedGuides: ['data-and-columns', 'sorting-filtering', 'frozen-columns', 'row-selection']
relatedApi: ['/api/props#tree', '/api/props#rowkey']
sinceVersion: '1.0.12'
lastReviewedAt: '2026-09-13'
indexable: true
draft: false
---

## 평면 데이터를 트리로 표시하기

트리 모드는 별도 컴포넌트가 아니라 기존 `<BGrid>`의 `tree` prop으로 활성화합니다. `rowKey`는 현재 행의 고유 키 필드를 지정하고, `tree.parentRowKey`는 부모의 `rowKey` 값이 들어 있는 필드를 지정합니다.

```tsx
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

interface Row {
  id: string;
  parentId: string | null;
  name: string;
}

const columns: BGridColumn<Row>[] = [{ id: 'name', key: 'name', label: '이름', width: 240 }];

const data: BGridDataItem<Row>[] = [
  { values: { id: 'root', parentId: null, name: '전자제품' } },
  { values: { id: 'laptop', parentId: 'root', name: '노트북' } },
];

<BGrid
  width={640}
  height={360}
  columns={columns}
  data={data}
  rowKey='id'
  tree={{
    parentRowKey: 'parentId',
    treeColumnId: 'name',
  }}
/>;
```

`tree.treeColumnId`는 데이터 필드 `key`가 아니라 `BGridColumn.id`를 참조합니다. 이 컬럼의 각 셀에 단계별 들여쓰기와 펼침·접힘 아이콘이 표시됩니다. 생략하거나 현재 숨겨진 컬럼을 지정하면 첫 번째 표시 컬럼을 사용합니다.

상단 라이브 데모는 3단계, 10,557개의 원본 행을 사용하는 예제입니다. 일부 가지를 펼친 초기 상태로 접기·펼치기 반응을 쉽게 확인할 수 있으며, 더 많은 행이 표시되어도 가상 스크롤이 실제 DOM을 현재 화면에 필요한 행으로 제한합니다.

## 펼침 상태 제어

`defaultExpandedRowKeys`는 그리드가 상태를 소유하는 초기값입니다. 외부에서 상태를 제어하려면 `expandedRowKeys`와 `onExpandedRowKeysChange`를 함께 사용합니다.

```tsx
const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>(['root']);

<BGrid
  {...gridProps}
  rowKey='id'
  tree={{
    parentRowKey: 'parentId',
    expandedRowKeys,
    onExpandedRowKeysChange: setExpandedRowKeys,
  }}
/>;
```

callback 이벤트에는 토글한 `rowKey`, 다음 `expanded` 상태, 원본 `item`, 접힘 상태와 무관하게 유지되는 `sourceIndex`가 전달됩니다.

## 아이콘과 간격

```tsx
tree={{
  parentRowKey: 'parentId',
  treeColumnId: 'name',
  indentSize: 20,
  icons: {
    expanded: <ChevronDown />,
    collapsed: <ChevronRight />,
    leaf: <File />,
  },
}}
```

leaf 아이콘을 생략해도 텍스트 정렬을 위한 동일 너비의 빈 공간은 유지됩니다. 아이콘 버튼의 클릭과 키보드 동작, `aria-expanded`는 그리드가 처리합니다.

## 정렬·필터와 원본 인덱스

클라이언트 정렬은 부모와 자식을 분리하지 않고 같은 부모의 형제 안에서만 적용됩니다. 필터에 자식이 일치하면 그 자식까지의 조상 경로를 임시로 함께 표시하지만 controlled 펼침 배열은 변경하지 않습니다.

화면의 `visibleIndex`는 폴딩에 따라 달라질 수 있습니다. 행 체크와 편집 callback은 원본 평면 배열의 `sourceIndex`를 유지하며, 편집의 `meta.tree.path`에는 루트부터 해당 행까지의 row key 경로가 전달됩니다.

## 제한 사항

- 트리 모드에서는 행 재배치와 셀 병합이 비활성화됩니다.
- Pivot 모드가 활성화되면 트리 모드는 비활성화됩니다.
- 비동기 자식 로딩과 부모 선택의 자식 자동 선택은 현재 지원하지 않습니다.
- 부모를 찾을 수 없는 행은 루트로 표시합니다.
- 누락·중복 row key 또는 순환 관계가 발견되면 개발 환경에서 경고하고 평면 그리드로 안전하게 전환합니다.
