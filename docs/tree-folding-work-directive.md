# BeautifulGrid 트리 데이터·폴딩 작업 지시서

> 우선순위: P1 — 렌더링 성능 P0의 기준선과 핵심 매핑 개선 후 착수  
> 대상 저장소: `axisj/beautiful-grid`  
> 기준 브랜치: 작업 시작 시 최신 `main`  
> 작업 성격: 중첩 행 데이터를 안정적인 화면 행으로 투영하고 접기·펼치기를 제공하는 공개 기능

## 작업 목표

`BGridDataItem<T>`의 중첩 자식 행을 지원하고, 부모 행의 토글을 통해 하위 행을 접고 펼칠 수 있게 한다. 폴딩 결과는 기존 행 가상화와 함께 동작해야 하며, 사용자가 보는 행과 원본 트리 노드 사이의 정체성이 편집·선택·검색·정렬·필터 과정에서 바뀌지 않아야 한다.

이번 작업은 단순히 들여쓰기와 아이콘만 출력하는 작업이 아니다. 다음 계약을 하나의 기능으로 완성한다.

1. 중첩 입력의 검증과 정규화
2. controlled/uncontrolled expanded 상태
3. visible tree projection과 source mapping
4. tree column 렌더링 및 접근성
5. 가상 스크롤, 편집, click, checkbox, selection과의 정합성
6. 정렬·필터에서 계층 보존
7. 지원하지 않는 기능 조합의 명시적 차단
8. 공개 타입, 문서, 예제, package consumer 검증

## 선행 조건

- 렌더링 성능 개선 작업의 기준선과 identity mapping 방침이 먼저 확정되어야 한다.
- `rowKey`와 source/visible index 의미를 리뷰어와 합의해야 한다.
- 작업자는 구현 전에 이 문서의 “공개 계약”을 타입 초안으로 옮긴 설계 메모를 PR description 또는 별도 문서로 제출한다.
- 공개 API 이름이나 의미를 바꾸고 싶다면 코드부터 작성하지 말고 설계 리뷰를 먼저 요청한다.

## 현행 구조와 반드시 지킬 제약

- `beautiful-grid/`만 publishable library source다.
- 각 Grid는 `AppStoreProvider` 기반의 독립 store를 가져야 한다.
- 현재 `BGridDataItem.parentItemIndex`는 타입에만 있고 런타임 계약이 없다. 이것을 트리의 source of truth로 사용하지 않는다.
- 부모·자식 관계는 배열 위치가 아니라 안정적인 `rowKey`로 식별한다.
- 기존 flat `data` 사용자는 코드 변경 없이 같은 결과를 받아야 한다.
- `sourceIndex`는 접힘 상태에 따라 변하면 안 된다. 동일한 입력 트리에서 expanded 상태만 바뀌면 같은 노드의 source index와 row key는 유지되어야 한다.
- visible index는 현재 화면에 평탄화된 행의 위치이며 접기·펼치기 후 바뀔 수 있다.
- 컬럼 `left` 계산 위치, 정적 CSS 정책, 입력 불변성 규칙을 유지한다.
- module 전역 expanded state 또는 mutable tree cache를 만들지 않는다.

검토할 주요 코드:

- `beautiful-grid/types.ts`
- `beautiful-grid/BGrid.tsx`
- `beautiful-grid/store/createAppStore.tsx`
- `beautiful-grid/components/Table.tsx`
- `beautiful-grid/components/TableBody.tsx`
- `beautiful-grid/utils/processDataQuery.ts`
- `beautiful-grid/utils/getVisibleScrollableRowRange.ts`
- `beautiful-grid/utils/gridSearch.ts`
- `beautiful-grid/utils/cellEditTransaction.ts`
- `beautiful-grid/utils/useRowReorderController.ts`

## 비범위

첫 PR/MVP에서 다음 기능은 구현하지 않는다.

- 서버에서 자식 행을 지연 로딩하는 기능
- 부모 checkbox가 모든 자식을 자동 선택하는 cascade/tri-state 기능
- 부모를 다른 부모 밑으로 옮기는 drag-and-drop
- tree와 Pivot의 동시 사용
- 서로 다른 depth 또는 부모 경계를 넘는 cell merge
- 검색 결과를 찾기 위해 접힌 조상을 자동으로 펼치는 기능
- treegrid 전용 전체 키보드 모델로 기존 spreadsheet 방향키 의미를 교체하는 작업
- 대규모 트리의 Web Worker 처리
- 임의의 DAG 또는 한 노드가 여러 부모를 갖는 구조

비범위 기능을 빈 callback이나 부분 UI로 노출하지 않는다. 필요한 공개 타입을 미리 선언만 해두는 것도 금지한다.

## 공개 계약

### 데이터 타입

기존 wrapper를 재귀적으로 확장하는 다음 방향을 기본안으로 사용한다.

```ts
export type BGridDataItem<T> = {
  values: T;
  status?: BGridDataItemStatus;
  editedColumnIds?: string[];
  changedKeys?: string[];
  checked?: boolean;
  /** @deprecated Tree identity is based on rowKey, not a mutable array index. */
  parentItemIndex?: number;
  meta?: Record<string, any>;
  children?: BGridDataItem<T>[];
};
```

`children`이 없으면 leaf, 빈 배열이면 현재는 leaf와 동일하게 취급한다. 비동기 로딩을 암시하는 별도 상태는 MVP에 추가하지 않는다. 입력 children 배열이나 row wrapper를 직접 변경하지 않는다.

### Tree 옵션

다음 공개 API를 기본 계약으로 삼는다. 이름 변경은 구현 전 설계 승인이 필요하다.

```ts
export interface BGridTreeOptions<T> {
  enabled?: boolean;
  treeColumnId?: string;
  expandedRowKeys?: readonly React.Key[];
  defaultExpandedRowKeys?: readonly React.Key[];
  onExpandedRowKeysChange?: (
    expandedRowKeys: React.Key[],
    event: {
      rowKey: React.Key;
      expanded: boolean;
      item: BGridDataItem<T>;
      sourceIndex: number;
    },
  ) => void;
  indentSize?: number;
  icons?: {
    expanded?: React.ReactNode;
    collapsed?: React.ReactNode;
  };
}

export interface BGridProps<T> {
  tree?: BGridTreeOptions<T>;
}
```

계약 세부사항:

1. `tree`가 없거나 `enabled === false`이면 기존 flat grid와 DOM이 동일하다.
2. tree가 활성화되면 `rowKey`는 필수다. 누락 시 개발 모드에서 명확한 경고를 내고 flat 모드로 안전하게 fallback한다. production에서 임의 key를 만들어 controlled state를 오염시키지 않는다.
3. `treeColumnId`를 생략하면 첫 번째 표시 컬럼을 사용한다. 존재하지 않거나 숨김 처리된 ID면 첫 표시 컬럼으로 fallback하고 개발 경고를 낸다.
4. `expandedRowKeys`가 있으면 controlled다. 토글 시 내부 상태를 확정 변경하지 않고 callback 후 부모가 새 prop을 줄 때 반영한다.
5. controlled 값이 없으면 `defaultExpandedRowKeys`로 최초 1회 초기화한다. 이후 default prop 변경으로 상태를 덮어쓰지 않는다.
6. 존재하지 않는 row key가 expanded 목록에 있어도 throw하지 않으며 렌더에는 영향이 없다. callback으로 임의 정리하지 않는다.
7. `indentSize` 기본값은 16px로 하고, 유효하지 않은 값은 기본값으로 정규화한다.
8. 동일 Grid 안에서 row key 중복을 발견하면 개발 경고를 내고 첫 번째 노드만 선택하는 식의 조용한 오동작을 금지한다. tree 투영을 중단하고 flat fallback하거나 명시적 안전 정책을 테스트한다.
9. cycle은 정상적인 중첩 배열로는 만들기 어렵지만 동일 객체가 조상 children에 다시 등장할 수 있다. WeakSet 기반 방문 검증 등으로 무한 재귀를 차단하고 개발 경고와 안전한 fallback을 제공한다.
10. 최대 depth를 임의로 100 같은 값에 고정하지 않는다. stack overflow를 피하도록 반복 순회를 우선 사용한다.

중첩 행 편집을 controlled owner가 정확히 반영할 수 있도록 `BGridChangeDataMeta`에는 다음 additive metadata를 반드시 제공한다. flat mode에서는 `tree`가 `undefined`여야 한다.

```ts
export interface BGridTreeChangeDataMeta {
  rowKey: React.Key;
  parentRowKey?: React.Key;
  sourceIndex: number;
  depth: number;
  path: readonly React.Key[];
}

export interface BGridChangeDataMeta<T> {
  // 기존 필드는 그대로 유지
  tree?: BGridTreeChangeDataMeta;
}
```

`path`는 root부터 편집된 노드까지의 row key 배열이다. callback의 기존 첫 번째 `index` 인자는 tree 전체를 입력 순서로 pre-order 순회한 source index다. 외부 owner는 index만으로 중첩 배열을 직접 갱신하지 말고 `meta.tree.path` 또는 `rowKey`를 사용할 수 있어야 한다.

### 정체성과 index

트리 전체를 pre-order로 순회하여 expanded 상태와 무관한 `sourceIndex`를 부여한다. 화면에는 expanded 조상의 자식만 포함하고 이 순서로 `visibleIndex`를 부여한다.

각 정규화 노드는 최소한 다음 내부 metadata를 가져야 한다.

```ts
interface BGridTreeRow<T> {
  item: BGridDataItem<T>;
  rowKey: React.Key;
  parentRowKey?: React.Key;
  sourceIndex: number;
  depth: number;
  siblingIndex: number;
  siblingCount: number;
  hasChildren: boolean;
  path: readonly React.Key[];
}
```

구현 명칭은 달라도 되지만 위 정보의 의미를 잃으면 안 된다. index만 저장한 `parentItemIndex` 연결을 새로 만들지 않는다.

### 정렬과 필터

- client sort는 전체 평탄 배열을 전역 정렬하지 않고 각 부모의 children을 형제 범위 안에서 stable sort한다.
- 같은 값의 tie-breaker는 원래 형제 순서다.
- 필터는 leaf/parent 자신이 일치하면 해당 노드를 포함한다.
- 자손이 일치하면 그 자손까지의 모든 조상을 포함해 경로를 보존한다.
- 필터 때문에 포함된 조상은 expanded 목록에 없어도 일치 경로를 임시로 표시한다. 이 동작이 사용자의 controlled expanded 배열을 변경하거나 callback을 발생시키면 안 된다.
- 필터를 제거하면 원래 expanded 상태로 돌아간다.
- manual dataControl에서는 서버가 전달한 트리 순서를 그대로 사용하고 Grid가 전역 재정렬하지 않는다.

### 기능 조합

| 기능 | MVP 정책 |
|---|---|
| 가상 스크롤 | 필수 지원. visible tree row 수를 기준으로 계산 |
| variable row height | 필수 지원. visible projection 변경 시 offsets 재계산 |
| click/context menu | 필수 지원. visible/source index와 tree item 정확성 보장 |
| editing/paste | 기존 visible 행 수정은 필수 지원. 중첩 원본 노드를 row key/path로 식별 |
| cell selection/navigation | 필수 지원. 폴딩 후 범위 clamp 및 hidden active cell 보정 |
| row checkbox/radio | 개별 행 선택만 지원. 숨은 자식의 선택 상태 보존 |
| search | 현재 visible row만 검색. 문서에 명시 |
| Frozen columns | 필수 지원. 토글과 indentation은 지정 tree column 한 곳에만 렌더 |
| Frozen rows | visible row 기준으로 지원. 접기 후 첫 N개 행이 바뀔 수 있음을 문서화 |
| row reorder | tree가 우선하며 reorder를 비활성화하고 개발 경고 |
| Pivot | Pivot이 우선하며 tree를 비활성화하고 개발 경고 |
| cell merge | tree가 우선하며 merge를 비활성화하고 개발 경고 |
| column visibility | tree column이 숨으면 첫 표시 컬럼으로 토글 이동 |

`createRowOnPaste`는 MVP tree mode에서 호출하지 않는다. 붙여넣기가 마지막 visible 행을 넘어 새 행 생성을 요구하면 기존 행까지만 부분 적용하지 말고 전체 paste를 취소한다. `BGridCellSelectionPasteErrorReason`에 `treeCreateRowUnsupported`를 additive literal로 추가해 `onPasteError`에 전달하고, flat mode의 기존 trailing-row 생성은 그대로 유지한다.

### UI와 접근성

- tree가 활성화되면 root grid는 `role="treegrid"` 의미를 제공하되 현재 접근성 role과 충돌 여부를 E2E로 확인한다.
- 각 행에 `aria-level={depth + 1}`, `aria-posinset`, `aria-setsize`를 제공한다.
- 자식이 있는 행의 토글 button만 `aria-expanded`를 가진다.
- leaf에는 비활성 button을 만들지 않는다. 정렬을 위한 동일 폭 spacer를 사용한다.
- 토글 button은 Enter/Space와 pointer click을 지원하며 accessible name에 행 식별과 펼침 상태가 포함된다.
- 토글 click이 row `onClick`, cell editing, selection drag를 동시에 발생시키지 않는다.
- MVP에서는 기존 셀 방향키 이동을 보존한다. ArrowLeft/ArrowRight를 tree 조작에 가로채지 않는다.
- 들여쓰기와 toggle 폭은 static `bgrid-*` class 및 `--bgrid-tree-indent-size` 변수로 구성한다. depth에 따른 실제 값만 inline style 또는 CSS 변수로 전달할 수 있다.

## 구현 단계

### 0단계: API와 정책 검증

1. 위 타입을 실제 `types.ts` 주변 공개 타입과 대조한다.
2. controlled/uncontrolled 패턴을 search, column visibility 구현과 비교한다.
3. tree와 sort/filter/pivot/reorder/merge 우선순위 표를 코드화할 위치를 정한다.
4. 기존 `parentItemIndex`는 deprecated 호환 필드로 유지하고 런타임에서 사용하지 않는다는 결정을 문서화한다.
5. 변경 예정 파일, 새 utility, 테스트 파일 목록을 먼저 PR 설명에 기록한다.

### 1단계: 순수 tree projection utility

렌더 컴포넌트보다 먼저 순수 함수를 작성한다. 예: `beautiful-grid/utils/processTreeData.ts`.

책임:

- 반복 pre-order 순회
- rowKey 추출과 중복/누락 검사
- cycle/shared-object 검사
- 전체 source row와 metadata 생성
- sibling stable sort
- ancestor-preserving filter
- effective expanded 상태 계산
- visible rows와 양방향 index mapping 생성

UI, Zustand action, DOM 접근을 utility 안에 넣지 않는다. 입력을 mutate하지 않고 동일 입력/옵션에 결정적인 결과를 반환한다.

### 2단계: BGrid projection 통합

- 현재 Pivot/data query projection과 tree projection의 순서를 명시한다.
- 권장 순서는 `입력 검증 → tree 정규화 → 형제 sort/filter → expanded flatten → row height metrics`다.
- flat mode의 빠른 경로에는 tree 전체 순회 비용을 추가하지 않는다.
- tree source index는 expanded 상태 변경만으로 재부여하지 않는다.
- row height metrics, frozen row count, scroll bounds는 visible data 기준으로 계산한다.
- active/edit cell이 접혀 숨겨지면 해당 노드의 가장 가까운 visible 조상으로 active cell을 옮기고 editor는 안전하게 cancel한다. stale commit을 허용하지 않는다.

### 3단계: store 상태와 toggle action

- expanded state는 Grid instance store 또는 BGrid의 명확한 controlled/uncontrolled state 한 곳에서만 관리한다.
- toggle action은 leaf, disabled Grid, 존재하지 않는 key에서 no-op이다.
- controlled mode callback의 event item/sourceIndex는 전체 tree source 기준이다.
- 한 번의 토글에 callback을 한 번만 발생시킨다. StrictMode에서도 중복되면 안 된다.
- data 교체 시 사라진 expanded key를 내부적으로 정리할 수 있지만 controlled 배열은 변경하지 않는다.
- unmount 후 async/state update가 남지 않는다.

### 4단계: Tree cell renderer

- indentation/toggle wrapper는 지정 tree column의 기존 cell content를 감싸되 `itemRender`, editor icon, checkbox editor를 깨뜨리지 않는다.
- plugin/text editor가 열리면 tree chrome과 editor가 겹치지 않게 실제 geometry를 확인한다.
- Frozen tree column과 일반 tree column 양쪽 배치를 테스트한다.
- row key를 React key에 사용하여 collapse로 index가 당겨질 때 다른 행 DOM을 재사용하지 않는다.
- depth가 큰 경우에도 너비가 음수가 되거나 cell content가 viewport 밖에서 상호작용을 막지 않게 한다.

### 5단계: 상호작용 통합

- collapse 대상 하위에 active cell, selection, editor, search current match가 있을 때 각각 정책대로 정리한다.
- 선택 범위는 visible row 좌표를 사용하므로 collapse 후 bounds를 clamp한다.
- checked 상태는 전체 source row 기준으로 보존하며 다시 펼쳤을 때 복구한다.
- edit/paste 결과의 `onChangeData`는 정확한 source index와 item을 전달한다.
- `BGridChangeDataMeta.tree`에 row key, parent key, depth, source index, root-to-node path를 제공한다. 기존 필드는 유지하고 flat mode에는 `tree`가 없어야 한다.
- context menu target에 tree metadata를 추가한다면 기존 필드를 유지하고 package type fixture를 작성한다.

### 6단계: 비지원 조합 차단

- tree + Pivot, tree + row reorder, tree + cell merge의 우선순위를 `BGrid.tsx` 한 곳에서 resolve한다.
- UI만 숨기지 말고 handler/action 단계에서도 실행을 차단한다.
- 개발 경고는 Grid별로 같은 원인에 한 번만 출력한다.
- production에서는 경고 없이 결정된 fallback이 동작한다.
- 비지원 조합은 README/Learn/API 문서에 동일하게 표시한다.

### 7단계: 문서와 예제

- 최소 하나의 고정 높이 예제와 하나의 가변 높이 예제를 제공한다.
- controlled expanded 상태 예제를 포함한다.
- rowKey 필수, source/visible index 차이, 정렬·필터 의미, 비지원 조합을 한국어·영어 Learn 문서에 적는다.
- 예제는 public API만 import한다.
- API Reference에 새 prop/type을 추가하고 source type과 맞는지 검사한다.

## 필수 테스트

### Unit: tree projection

- 빈 데이터, root 하나, leaf 여러 개, 3단 이상 중첩
- children undefined와 빈 배열
- 전체 접힘, 일부 펼침, 전체 펼침
- expanded 목록의 unknown key
- row key 0과 빈 문자열을 포함한 React.Key 경계
- 누락·중복 rowKey
- 자기 참조와 조상 참조 cycle
- 매우 깊은 트리에서 call stack overflow 없음
- source index가 expand/collapse 전후 동일
- visible/source 양방향 mapping이 역함수
- 형제별 asc/desc stable sort
- 자손 filter match 시 조상 포함
- filter 제거 후 원래 expanded 상태 복구
- 입력 rows/children/values 불변성

### Component

- flat mode DOM과 callback 회귀 없음
- uncontrolled default expanded 초기화 및 toggle
- controlled expanded callback 후 parent rerender 전 상태
- 한 toggle당 callback 1회, StrictMode 중복 없음
- tree column 기본값, 명시 ID, 숨김 column fallback
- depth별 indentation과 leaf spacer
- row `aria-level`, `aria-posinset`, `aria-setsize`, toggle `aria-expanded`
- toggle click이 row click/edit/selection을 오발하지 않음
- collapse된 자식의 editor cancel과 active cell 조상 이동
- checkbox 상태를 접었다 펼쳐도 보존
- sort/filter 후 edit callback source index 정확성
- 중첩 행 edit/paste callback의 `meta.tree.path` 정확성
- tree mode에서 trailing-row paste 전체 취소와 `treeCreateRowUnsupported` 오류
- column rerender와 data rerender에서 expanded 상태 계약 유지
- 두 Grid의 expanded 상태 격리

### E2E

- pointer와 Enter/Space로 3단 트리 접기·펼치기
- 10만 visible node 트리의 처음/중간/마지막 가상 스크롤
- 빠른 반복 toggle 중 duplicate/stale row 없음
- Frozen tree column에서 토글 geometry와 가로 스크롤
- variable row height에서 collapse 후 scroll height와 `scrollToRow`
- filter로 임시 노출된 조상과 filter 제거 복귀
- child edit, paste, context menu의 source row 정확성
- 키보드 셀 navigation이 tree 도입 전과 동일함
- row reorder/Pivot/merge 비지원 조합의 UI와 handler 차단
- 실제 브라우저에서 role/name/expanded 접근성 확인

### Package와 Site

- CJS/ESM에서 tree prop 사용
- TypeScript positive fixture: nested children, controlled expanded, custom icons
- TypeScript negative fixture: 잘못된 event/key/type
- 배포 CSS에 tree class/variable 포함
- 한국어·영어 문서 route와 예제 smoke

## 성능 기준

- flat mode mount와 scroll은 tree 도입 전 기준선보다 median 5%, p95 10% 이상 악화되면 안 된다.
- collapsed tree는 전체 source node가 아니라 visible node 수를 기준으로 DOM을 생성한다.
- expanded 상태 한 개 변경 때문에 모든 셀의 `itemRender`가 다시 호출되지 않도록 stable row identity와 render count를 검증한다.
- 10만 node 정규화/flatten 시간을 기록한다. 절대 시간만 강제하지 말고 기준선과 알고리즘 복잡도를 함께 보고한다.
- tree projection은 기본적으로 O(N), toggle 후 전체 재평가가 필요하다면 그 비용과 메모리를 측정한다. 증분 갱신을 도입할 경우 stale mapping 위험을 더 강하게 테스트한다.
- 캐시가 이전 data tree를 unmount 후 붙잡지 않아야 한다.

## 금지되는 구현

- `parentItemIndex` 또는 현재 visible index를 부모 identity로 사용
- `children.splice`, row/item/value 직접 변경
- 배열 index만 React row key로 사용
- collapse 시 source data에서 자식을 삭제
- 모든 행을 DOM에 렌더한 뒤 CSS `display:none`으로 접기 구현
- 전역 sort로 부모·자식 순서를 분리
- filter match 자식만 남기고 부모 경로 제거
- controlled expanded prop을 내부에서 mutate
- 비지원 조합을 UI에서만 숨기고 keyboard/action 경로는 남겨두기
- recursion depth 제한 없이 재귀 순회
- console error를 삼키거나 테스트 warning assertion을 제거
- tree 기능과 성능 리팩터링, 수식 엔진, 대규모 스타일 변경을 한 PR에 혼합

## 완료 게이트

아래 항목이 모두 충족되어야 완료다.

- [ ] 공개 타입과 controlled/uncontrolled 계약이 문서와 일치한다.
- [ ] flat mode의 타입, DOM, callback 동작이 보존된다.
- [ ] rowKey 누락·중복과 cycle이 안전하게 처리된다.
- [ ] source index가 expanded 상태와 무관하게 안정적이다.
- [ ] sort는 형제 범위, filter는 조상 보존 규칙을 따른다.
- [ ] 가상 스크롤과 variable height가 visible tree 기준으로 정확하다.
- [ ] 편집·paste·click·check·context menu가 원본 노드를 가리킨다.
- [ ] active/selection/editor가 collapse 후 stale 상태를 남기지 않는다.
- [ ] tree + Pivot/reorder/merge가 UI와 action 양쪽에서 차단된다.
- [ ] 접근성 role, level, expanded, toggle keyboard 테스트가 통과한다.
- [ ] 두 Grid instance의 expanded 상태와 cache가 격리된다.
- [ ] flat mode 성능 회귀 기준을 통과한다.
- [ ] `npm run lint`가 통과한다.
- [ ] `npm test`가 통과한다.
- [ ] `npm run test:e2e`가 통과한다.
- [ ] `npm run test:library:consumers`가 통과한다.
- [ ] `npm run verify:library`가 통과한다.
- [ ] `npm run verify:site`가 통과한다.
- [ ] bundle 변경 시 metrics를 갱신하고 예산을 통과한다.
- [ ] `git diff --check`가 통과한다.
- [ ] 새 skip, retry, flaky test가 없다.

## 리뷰 체크리스트

리뷰어가 특히 확인할 항목:

1. `rowKey`가 실제 모든 노드에서 안정적이고 중복 검사가 있는가.
2. source index가 collapse 때 다시 번호 매겨지지 않는가.
3. controlled expanded 상태가 callback만 호출하고 prop을 기다리는가.
4. filter의 임시 ancestor 노출이 expanded prop을 오염시키지 않는가.
5. sort가 부모와 자식을 분리하지 않는가.
6. collapse된 editor가 나중에 다른 행에 stale commit하지 않는가.
7. index 기반 React key 때문에 행 DOM이나 checkbox가 다른 노드에 재사용되지 않는가.
8. Frozen 좌우에서 toggle이 중복 렌더되거나 두 번 callback하지 않는가.
9. disabled/pivot/reorder/merge 조합이 action 레벨에서도 막혔는가.
10. flat 사용자에게 tree 순회·Map·expanded state 비용이 추가되지 않았는가.
11. 깊은 트리와 cycle이 브라우저를 멈추게 하지 않는가.
12. 문서의 지원 범위가 실제 테스트 범위보다 넓게 쓰이지 않았는가.

## PR 제출 형식

다음처럼 리뷰 가능한 작은 PR로 나눈다. 다른 분할이 필요하면 첫 PR 전에 리뷰어 승인을 받는다. 각 PR은 독립적으로 green이어야 하며 공개 타입만 있고 실행 경로가 없는 중간 상태를 main에 남기지 않는다.

1. **PR A — 순수 projection과 타입**: utility, exhaustive unit test, 타입 fixture. 기능 flag 뒤에서 런타임까지 연결 가능한 완결 단위로 제출한다.
2. **PR B — 폴딩 UI와 상태**: controlled/uncontrolled expanded, tree cell, 접근성, component test.
3. **PR C — 기능 통합**: sort/filter/edit/selection/Frozen/virtual E2E와 비지원 조합 차단.
4. **PR D — 문서와 예제**: 한국어·영어 Learn, API Reference, examples, site verification. PR C가 merge되기 전까지 완료하여 기능과 문서가 함께 릴리즈되게 한다.

각 PR 설명에는 다음을 포함한다.

1. 변경 전후 데이터 흐름
2. source index와 visible index 예제
3. 공개 타입 최종안
4. controlled/uncontrolled 상태 전이 표
5. 지원·비지원 기능 조합 표
6. 추가한 unit/component/E2E 목록
7. 실행한 검증 명령과 결과
8. 성능 기준선과 변경본 비교
9. 남은 위험과 다음 PR 의존성
10. 스크린샷 또는 짧은 동영상: 3단 트리, Frozen tree column, filter 후 조상 노출

커밋·푸시·릴리즈는 별도 요청을 받은 경우에만 수행한다. 완료라고 보고할 때는 체크박스 요약만 보내지 말고 테스트 결과, 성능 결과, 알려진 제한을 함께 제출한다.
