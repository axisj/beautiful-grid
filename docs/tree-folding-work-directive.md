# BeautifulGrid 트리 폴딩 개발 계약

## 공개 API

트리 기능은 별도 `BGridTree` 컴포넌트를 만들지 않고 기존 `<BGrid>`의 `tree` prop으로 제공한다.

```tsx
<BGrid
  rowKey='id'
  tree={{
    parentRowKey: 'parentId',
    treeColumnId: 'name',
  }}
  columns={columns}
  data={data}
/>
```

- `rowKey`는 현재 행의 고유 키가 들어 있는 필드를 지정한다.
- `parentRowKey`는 부모 행의 `rowKey` 값이 들어 있는 필드를 지정한다.
- `treeColumnId`는 들여쓰기와 폴딩 아이콘을 표시할 `BGridColumn.id`다.
- `treeColumnId`를 생략하거나 해당 컬럼이 숨겨지면 첫 번째 표시 컬럼을 사용한다.
- 입력은 기존과 동일한 평면 `BGridDataItem<T>[]`이며 원본 배열과 행을 변경하지 않는다.

## 상태 계약

- `expandedRowKeys`가 있으면 controlled, 없으면 uncontrolled다.
- uncontrolled 상태는 `defaultExpandedRowKeys`로 최초 한 번 초기화한다.
- 기본 상태는 전체 접힘이다.
- callback에는 다음 펼침 키 목록과 토글한 행의 `rowKey`, `item`, `sourceIndex`를 전달한다.
- 펼침 목록에 존재하지 않는 키가 있어도 오류를 발생시키거나 목록을 임의로 변경하지 않는다.

## 데이터와 인덱스

트리 투영은 원본 평면 배열을 부모 관계에 따라 pre-order 화면 행으로 만든다.

- `sourceIndex`는 원본 평면 배열의 위치이며 폴딩으로 변경되지 않는다.
- `visibleIndex`는 현재 표시 행의 위치이며 폴딩으로 변경될 수 있다.
- 체크, 편집, 검색, context menu는 공통 `sourceIndexByVisibleIndex` 매핑을 사용한다.
- 부모가 없는 행은 루트로 처리한다.
- 누락·중복 row key 또는 cycle을 발견하면 개발 경고 후 flat mode로 fallback한다.
- 순회는 깊은 트리에서도 call stack을 소모하지 않는 반복 방식으로 구현한다.

## 정렬과 필터

- client sort 결과는 같은 부모의 형제 순서를 정하는 데 사용하며 부모와 자식을 분리하지 않는다.
- 자식이 client filter에 일치하면 루트부터 해당 자식까지의 조상을 함께 표시한다.
- 필터 때문에 표시되는 조상은 controlled `expandedRowKeys`를 변경하지 않는다.
- manual mode에서는 사용자가 전달한 데이터 순서를 기준으로 트리를 구성한다.

## UI와 접근성

- 셀 구조는 `[depth 들여쓰기] [토글 또는 leaf spacer] [기존 셀 콘텐츠]`다.
- 기존 `itemRender`, built-in editor, plugin editor와 editor icon을 보존한다.
- tree mode의 root role은 `treegrid`다.
- 행에는 `aria-level`, `aria-posinset`, `aria-setsize`를 제공한다.
- 자식이 있는 행과 토글 버튼에 `aria-expanded`를 제공한다.
- 토글은 실제 button이며 클릭이 셀 선택이나 편집으로 전파되지 않는다.
- leaf는 비활성 button 대신 동일 너비 spacer를 사용한다.

## 지원 범위

필수 지원:

- 가상 스크롤과 variable row height
- frozen columns와 frozen rows
- 편집, 개별 행 체크, 검색, context menu
- 셀 선택과 기존 spreadsheet 키보드 이동
- controlled/uncontrolled 폴딩 상태

초기 비지원 조합:

- tree와 Pivot 동시 사용: Pivot 우선
- tree와 row reorder 동시 사용: reorder 비활성화
- tree와 cell merge 동시 사용: merge 비활성화
- 비동기 자식 로딩
- 부모 체크의 자식 cascade
- 부모가 바뀌는 drag-and-drop

## 완료 기준

- 별도 `BGridTree`, `BGridTreeProps`, 관련 export가 없다.
- 공개 타입과 한국어·영어 문서가 실제 구현과 일치한다.
- flat mode의 DOM, callback, 성능 경로가 보존된다.
- tree projection, controlled 상태, 아이콘 위치, 접근성 테스트가 통과한다.
- 정렬·필터, 편집 source index, 체크 상태, frozen/virtual 경로가 검증된다.
- `npm run verify:library`, `npm run verify:site`, `git diff --check`가 통과한다.
