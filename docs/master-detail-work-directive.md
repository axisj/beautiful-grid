# BeautifulGrid 마스터-디테일(Master-Detail) 개발 계약

이 문서는 마스터-디테일 기능의 공개 API, 상태 전이, 레이아웃, 가상 스크롤, 접근성 및 검증 기준을 정의한다. 구현 중 선택지가 생기면 이 계약을 우선하며, 계약을 변경해야 할 경우 타입·테스트·README·예제를 함께 수정한다.

## 1. 공개 API

마스터-디테일 기능은 별도 그리드 컴포넌트를 추가하지 않고 기존 `<BGrid>`의 `masterDetail` 옵션으로 제공한다. Tree API와의 일관성 및 최상위 prop 이름 충돌 방지를 위해 펼침 상태 관련 옵션도 `masterDetail` 안에 둔다.

```tsx
<BGrid
  rowKey="id"
  data={orders}
  columns={columns}
  masterDetail={{
    detailRender: ({ item }) => (
      <BGrid rowKey="id" data={item.values.items} columns={orderItemColumns} />
    ),
    detailRowHeight: 240,
    expandColumnId: 'orderNo',
    hasDetail: item => (item.values.items?.length ?? 0) > 0,
    expandMode: 'multiple',
    defaultExpandedRowKeys: ['ORD-001'],
    onExpandedRowKeysChange: (keys, event) => {
      console.log(keys, event);
    },
  }}
/>
```

### 타입 정의

```tsx
export type BGridMasterDetailExpandMode = 'multiple' | 'single';

export interface BGridMasterDetailRenderProps<T> {
  item: BGridDataItem<T>;
  rowKey: React.Key;
  sourceIndex: number;
  visibleIndex: number;
  expanded: true;
  collapse: () => void;
}

export interface BGridMasterDetailIcons {
  expanded?: React.ReactNode;
  collapsed?: React.ReactNode;
}

export interface BGridMasterDetailChangeEvent<T> {
  rowKey: React.Key;
  expanded: boolean;
  item: BGridDataItem<T>;
  sourceIndex: number;
}

export interface BGridMasterDetailOptions<T> {
  /** false이면 기능을 비활성화한다. 기본값: true */
  enabled?: boolean;
  /** 펼쳐진 디테일 영역의 콘텐츠 렌더러 */
  detailRender: (props: BGridMasterDetailRenderProps<T>) => React.ReactNode;
  /**
   * 디테일 영역의 전체 높이(px). padding과 border를 포함한다.
   * 고정 숫자 또는 행별 높이를 반환하는 함수를 지원한다. 기본값: 200
   */
  detailRowHeight?: number | ((item: BGridDataItem<T>, sourceIndex: number) => number);
  /** 토글을 표시할 BGridColumn.id. 생략하거나 유효하지 않으면 첫 번째 표시 컬럼을 사용한다. */
  expandColumnId?: string;
  /** 행별 디테일 제공 여부. 생략하면 모든 행을 펼칠 수 있다. */
  hasDetail?: (item: BGridDataItem<T>, sourceIndex: number) => boolean;
  /** 'single'은 한 번에 한 행만 펼친다. 기본값: 'multiple' */
  expandMode?: BGridMasterDetailExpandMode;
  /** Controlled 상태. 지정하면 사용자 동작만으로 내부 상태를 변경하지 않는다. */
  expandedRowKeys?: readonly React.Key[];
  /** Uncontrolled 상태의 최초 마운트 값. 이후 변경은 반영하지 않는다. */
  defaultExpandedRowKeys?: readonly React.Key[];
  /** 사용자 동작으로 펼침 상태 변경이 요청될 때 호출한다. */
  onExpandedRowKeysChange?: (
    keys: React.Key[],
    event: BGridMasterDetailChangeEvent<T>,
  ) => void;
  /** 커스텀 토글 아이콘 */
  icons?: BGridMasterDetailIcons;
  /** 토글 버튼 접근성 라벨 */
  expandAriaLabel?: string;
  collapseAriaLabel?: string;
}
```

`BGridProps<T>`에는 `masterDetail?: BGridMasterDetailOptions<T>`를 추가한다.

### 행 식별자 계약

- `masterDetail.enabled !== false`인 경우 `rowKey`는 반드시 명시해야 한다. 현재 `BGrid`의 `rowKey`는 실제 키 값이 아니라 값을 읽을 **필드명 또는 중첩 경로**(`React.Key | React.Key[]`)이므로, 임의로 `'id'`를 기본값으로 가정하지 않는다.
- `rowKey`가 없으면 개발 모드에서 경고하고 마스터-디테일 기능만 비활성화한다. 기존 Flat Grid 렌더링은 유지한다.
- 추출된 행 키가 `null`/`undefined`이거나 중복이면 개발 모드에서 진단 가능한 경고를 출력하고, 해당 행은 펼칠 수 없도록 처리한다. 배열 인덱스로 대체하지 않는다.
- 입력 `data`와 `BGridDataItem`을 변형하지 않는다. 펼침 상태는 행 객체 참조나 인덱스가 아닌 추출된 키로만 관리한다.

## 2. 상태 계약

- `masterDetail.expandedRowKeys`가 정의되면 controlled, 아니면 uncontrolled로 동작한다.
- uncontrolled 상태는 `defaultExpandedRowKeys`를 컴포넌트 최초 마운트 시 한 번만 읽는다. `masterDetail`을 나중에 활성화하더라도 다시 초기화하지 않는다.
- 기본 상태는 전체 접힘(`[]`)이다.
- 내부에서는 부모/사용자가 지정한 **요청 키 목록**과 현재 화면에서 실제로 펼칠 수 있는 **유효 키 목록**을 구분한다. 요청 키는 입력 순서를 보존하면서 중복만 제거하고, 유효 키는 원본 데이터에 존재하며 `hasDetail`이 `true`인 키로 제한한다.
- `expandMode: 'single'`에서는 유효 키가 여러 개여도 첫 번째 키만 렌더링한다. 사용자 동작으로 새 행을 펼칠 때 콜백에는 새 키 하나만 포함된 배열을 전달한다.
- controlled 모드에서 사용자 동작이 발생하면 다음 상태를 계산해 콜백을 호출하되, 부모가 `expandedRowKeys`를 갱신하기 전에는 화면 상태를 변경하지 않는다.
- 정렬·필터로 일시적으로 보이지 않는 키와 현재 페이지에 없는 요청 키는 상태에서 제거하지 않는다. 따라서 해당 행이 다시 표시되면 기존 펼침 상태를 복원한다. `multiple` 모드의 사용자 동작으로 다음 키 목록을 만들 때도 이 키들을 보존한다.
- 원본 데이터에서 행이 삭제되거나 `hasDetail` 결과가 바뀌어 유효 키에서 제외되더라도 요청 키를 자동으로 정리하거나 `onExpandedRowKeysChange`를 호출하지 않는다. 콜백은 사용자 동작에만 반응한다.
- `collapse()`는 토글 버튼 클릭과 동일한 상태 전이 및 콜백 계약을 따른다.
- `disabled` 상태에서는 토글과 `collapse()`가 상태 변경을 요청하지 않는다.

> 구현 주의: controlled 여부는 `expandedRowKeys !== undefined`로 판단해야 한다. 빈 배열은 유효한 controlled 값이다. 또한 `defaultExpandedRowKeys`와 `expandedRowKeys` 배열 자체를 수정하지 않는다.

## 3. 데이터 좌표와 렌더링 모델

- 디테일 영역은 독립적인 데이터 행이 아니다. `sourceIndex`, `visibleIndex`, 체크 상태, 편집 좌표 및 선택 좌표를 점유하지 않고 부모 마스터 행에 종속된다.
- `sourceIndex`는 원본 데이터 기준 인덱스, `visibleIndex`는 정렬·필터·Tree projection 이후 화면 데이터 기준 인덱스라는 기존 의미를 유지한다.
- `detailRender`는 실제로 펼쳐져 있고 가상화 렌더 범위에 들어온 행에 대해서만 호출한다. 접힌 행의 콘텐츠를 숨김 상태로 미리 마운트하지 않는다.
- 디테일 컴포넌트의 로컬 상태는 가상 스크롤로 렌더 범위를 벗어나 언마운트되면 보존되지 않는다. 상태 보존이 필요하면 소비자가 행 키를 기준으로 외부 상태를 관리하도록 문서화한다.
- `detailRowHeight`와 `hasDetail` 콜백은 렌더링 중 반복 호출될 수 있으므로 부수 효과가 없어야 한다. 구현부는 데이터·키·콜백 참조가 바뀌지 않는 동안 계산 결과를 메모이즈한다.
- `detailRowHeight`가 유한한 양수가 아니거나 콜백이 예외를 던지면 개발 모드 경고 후 기본값 `200`을 사용한다. `hasDetail`이 예외를 던지면 해당 행을 펼칠 수 없는 것으로 처리한다. 한 행의 오류가 전체 그리드 렌더링을 중단하지 않도록 계산 경계를 둔다.

## 4. 가상 스크롤 및 높이 계산

디테일은 기존 가변 행 높이와 같은 논리 스크롤 좌표계를 사용하되, **마스터 행의 실제 높이**와 **레이아웃 슬롯의 높이**를 구분한다.

```text
masterHeight[i] = 기존 getRowHeight 결과 또는 기본 행 높이
detailHeight[i] = 펼침 가능하고 펼쳐진 경우 detailRowHeight, 아니면 0
layoutHeight[i] = masterHeight[i] + detailHeight[i]
layoutOffset[i + 1] = layoutOffset[i] + layoutHeight[i]
```

- `layoutOffset`과 그 합계는 가시 범위 탐색, `paddingTop`, 전체 논리 높이, 선택 오버레이 위치 및 스크롤 이동 계산에 사용한다.
- `<tr>`과 각 마스터 셀에는 반드시 `masterHeight`만 적용한다. 기존 `rowHeightMetrics.heights`에 디테일 높이를 단순 합산하면 마스터 셀 자체가 늘어나므로 금지한다.
- 구현 시 기존 메트릭을 `masterRowHeightMetrics`와 `layoutRowHeightMetrics`처럼 역할별로 분리하거나, 동등하게 두 높이를 명시적으로 보존하는 구조로 확장한다.
- 가시 범위는 `layoutOffset`을 이진 탐색해 계산한다. 디테일 패널 일부가 뷰포트와 겹치면 그 부모 마스터 행을 렌더 범위에 포함한다.
- 기존 overscan 정책을 유지하되, 행 개수가 아니라 누적 높이를 기준으로 시작·끝 경계를 검증한다. 매우 큰 디테일 하나가 뷰포트보다 높아도 부모 행이 누락되어서는 안 된다.
- 펼침/접힘으로 `totalHeight`가 바뀌면 custom scrollbar의 logical/physical window 변환, 최대 `scrollTop`, frozen-row offset, `scrollToCell`/키보드 이동 및 선택 오버레이 좌표를 같은 커밋에서 갱신한다.
- 사용자 토글로 현재 보이는 행의 높이가 바뀔 때는 마스터 행의 화면상 상단 위치를 가능한 한 유지하고, 결과 `scrollTop`은 새 최대값으로 clamp한다. controlled prop 갱신으로 뷰포트 위쪽 행의 높이가 바뀌는 경우에도 불필요한 화면 점프가 없도록 scroll anchoring 테스트를 둔다.

## 5. Full-width 렌더링과 Frozen 영역

- 마스터 행은 기존처럼 Frozen Body와 Scrollable Body에 나누어 렌더링한다. 디테일은 양쪽 테이블에 복제하지 않고 공통 body detail layer에 **한 번만** 렌더링한다.
- 디테일의 세로 위치는 `layoutOffset[visibleIndex] + masterHeight[visibleIndex]`를 기준으로 계산하고, virtual scroll base와 frozen-row offset을 기존 body layer와 동일한 순서로 보정한다.
- 디테일의 너비는 데이터 전체 폭이 아니라 그리드 body viewport의 가시 폭이다. 가로 스크롤에 따라 움직이지 않도록 공통 레이어에서 `left: 0`에 고정하며, 넓은 내부 콘텐츠는 디테일 컨테이너 자체에서 가로 스크롤한다.
- 공통 레이어의 빈 영역은 마스터 셀의 pointer event를 가로채지 않아야 한다. 레이어는 `pointer-events: none`, 실제 디테일 패널은 `pointer-events: auto`와 같은 방식으로 hit testing 범위를 제한한다.
- 디테일 패널의 배경, 경계선, z-index, 클리핑 기준을 명시해 Frozen 컬럼·선택 오버레이·편집기 포털보다 의도치 않게 앞이나 뒤에 놓이지 않도록 한다.
- `expandColumnId`가 숨겨졌거나 존재하지 않으면 첫 번째 표시 컬럼으로 폴백한다. 표시 컬럼이 없으면 토글을 렌더링하지 않고 개발 모드에서 경고한다.
- 토글은 해당 컬럼이 속한 Frozen/Scrollable 영역 중 한 곳에만 렌더링하여 중복 버튼과 중복 이벤트를 방지한다.

### Frozen Rows 정책

초기 구현에서는 `frozenRowCount > 0`과 `masterDetail`의 동시 사용을 지원하지 않는다. 함께 지정되면 개발 모드에서 경고하고 `masterDetail`을 비활성화한다. Frozen Rows를 지원 범위에 넣으려면 다음을 별도 설계·검증해야 한다.

- 고정 행 안에서 펼친 디테일까지 고정할지 여부
- 고정 영역과 스크롤 영역 사이의 높이·클리핑·z-index
- `frozenRowsHeight` 및 가상 스크롤 기준점 재계산

Frozen **Columns**는 필수 지원 범위이며 Frozen **Rows**와 혼동하지 않는다.

## 6. 이벤트, 포커스 및 중첩 그리드 격리

디테일 내부의 상호작용은 마스터 그리드의 선택·편집·드래그·컨텍스트 메뉴를 실행하지 않아야 하지만, 디테일 내부 컨트롤과 중첩 `<BGrid>`의 이벤트는 정상 동작해야 한다.

- 디테일 루트에 소유 그리드를 식별할 수 있는 마커(예: `data-bgrid-detail-owner`)를 둔다.
- 마스터 그리드의 capture 단계 핸들러(`pointerdown`, `pointerover`, `contextmenu` 등)는 이벤트 경로가 자신의 디테일 경계 안에서 시작되었는지 확인하고 즉시 반환한다. 디테일 래퍼의 bubble 단계 `stopPropagation()`만으로는 이미 실행된 ancestor capture 핸들러를 막을 수 없다.
- 디테일 경계에서는 마스터로 올라가면 충돌하는 bubble 이벤트만 차단한다. 모든 이벤트에 일괄적으로 `preventDefault()`를 적용하지 않는다.
- `Tab`/`Shift+Tab`의 기본 동작은 막지 않는다. 입력 요소의 Space, Enter, 방향키도 기본 동작을 유지하면서 마스터 그리드의 키보드 내비게이션에만 전달되지 않게 한다.
- 중첩 `<BGrid>`는 자체 Zustand Store, 포털 컨테이너, 이벤트 소유권 및 ARIA ID를 가져야 한다. 가장 가까운 grid owner만 이벤트를 처리하도록 경계를 판별한다.
- 디테일이 접힐 때 포커스가 그 내부에 있으면 해당 마스터 행의 토글 버튼으로 포커스를 복귀시킨다. 가상화로 포커스된 디테일이 언마운트되는 상황도 같은 원칙으로 처리하거나, 포커스가 있는 행을 렌더 범위에 고정한다.

## 7. 정렬, 필터, 편집 및 상태 기능과의 관계

- 정렬·필터 후에도 펼침 상태는 `sourceIndex`가 아니라 `rowKey`로 보존한다.
- 필터로 마스터 행이 제외되면 디테일도 함께 숨기되, 키는 보존하여 필터 해제 시 다시 펼친다.
- 정렬 후 `sourceIndex`와 `visibleIndex`를 혼용하지 않는다. 콜백에는 원본 기준 `sourceIndex`를 전달하고, 렌더 위치에는 `visibleIndex`를 사용한다.
- 디테일은 셀 선택, 복사·붙여넣기, 셀 편집, 체크박스, 컨텍스트 메뉴 및 줄 번호의 인덱스에 포함되지 않는다.
- 마스터 행을 접을 때 그 디테일 내부의 React 트리는 정상 언마운트되어야 한다. 타이머·구독 정리는 소비자 컴포넌트의 책임이지만, 그리드가 DOM을 숨긴 채 유지해서는 안 된다.

## 8. UI 및 접근성(A11y)

### 토글 버튼

- 실제 `<button type="button">`을 사용한다.
- `aria-expanded`, `aria-controls` 및 동작을 설명하는 `aria-label`을 제공한다.
- 아이콘은 장식 요소로 `aria-hidden="true"`를 적용한다.
- 클릭 시 셀 선택이나 편집을 시작하지 않되, 키보드 포커스 표시를 제거하지 않는다.
- `hasDetail(...) === false`인 행은 비활성 버튼 대신 동일한 폭의 `aria-hidden` spacer를 렌더링해 정렬을 유지한다.

### 디테일 영역

- 디테일은 데이터 행이 아니므로 가짜 `row`/`gridcell` 역할을 부여하지 않는다. 기본적으로 `role="region"`을 사용한다.
- React `useId()` 또는 충돌 없는 grid instance ID와 행 키를 조합해 안정적인 DOM ID를 만들고, 토글의 `aria-controls`와 디테일의 `aria-labelledby`를 연결한다. 행 키 원문을 그대로 DOM ID에 삽입하지 않는다.
- 디테일 콘텐츠에 별도 제목이 있으면 그 제목을 `aria-labelledby` 대상으로 우선 사용한다.
- 접힌 디테일은 DOM에서 제거하므로 `aria-hidden`으로 중복 관리하지 않는다.

## 9. 기능 조합 정책

### 필수 지원

1. 고정/가변 마스터 행 높이와 고정/함수형 `detailRowHeight`
2. 가상 스크롤 및 logical/physical virtual window
3. 좌/우 Frozen Columns와 full-width 디테일
4. Controlled/Uncontrolled 펼침 상태
5. `multiple`/`single` 모드
6. 중첩 `<BGrid>` 및 임의의 커스텀 컴포넌트
7. 정렬·필터 후 `rowKey` 기반 상태 보존
8. 이벤트·포커스·포털 격리

### 초기 비지원 조합

아래 조합은 조용히 오동작하게 두지 않는다. 개발 모드에서 한 번만 경고하고 마스터-디테일을 비활성화하거나, 기존 기능을 유지하는 명시적 우선순위를 코드와 테스트에 동일하게 적용한다.

- `tree` — 계층 projection과 펼침 상태 모델이 겹침
- `pivot` — 원본 행 키 및 행 모델이 변환됨
- `reorder.enabled` — 가변 슬롯 높이와 드래그 좌표 계산이 충돌함
- `cellMergeOptions` — 병합 범위와 디테일 슬롯의 행 좌표가 충돌함
- `frozenRowCount > 0` — 고정 행 영역의 detail layer 정책이 정의되지 않음
- ResizeObserver 기반 자동 디테일 높이 — 초기에는 고정값 또는 함수 반환값만 지원

비지원 조합의 검사와 경고는 `BGrid.tsx`의 기존 feature-resolution 패턴에 맞추고, production에서는 불필요한 로그를 출력하지 않는다.

## 10. 구현 순서 및 영향 파일

1. `beautiful-grid/types.ts`: 공개 타입과 `BGridProps.masterDetail` 추가
2. `beautiful-grid/BGrid.tsx`: 기능 조합 해석, 키 검증, controlled/uncontrolled 상태, 유효 키 projection, 높이 메트릭 생성
3. `beautiful-grid/utils/rowHeightMetrics.ts`: master height와 layout slot height를 분리한 누적 오프셋 계산 및 이진 탐색 보강
4. `beautiful-grid/components/`: 토글 셀 장식, 공통 detail layer, 포커스 복귀 및 이벤트 owner 경계 추가
5. `beautiful-grid/components/Table.tsx`: 가시 범위·scroll anchoring·selection overlay·scroll-to-cell 좌표를 layout offset에 연결
6. `beautiful-grid/style.css`: `bgrid-*` 클래스와 `--bgrid-*` 변수만 사용해 detail layer 스타일 추가
7. 단위/통합/E2E 테스트, README, `site/`, 예제 순으로 동기화

## 11. 완료 기준(Definition of Done)

### 타입 및 API

- 관련 공개 타입이 `beautiful-grid/types.ts`에서 export된다.
- `rowKey` 누락·결측·중복, 잘못된 높이, 없는/숨겨진 `expandColumnId`, 비지원 기능 조합의 동작과 경고가 테스트로 고정된다.
- 기존 API에 마스터-디테일을 사용하지 않을 때 동작 및 번들 영향이 합리적인 수준인지 확인한다.

### 상태 테스트

- controlled/uncontrolled/default 상태와 빈 controlled 배열을 검증한다.
- `multiple`/`single`, 중복 키, 존재하지 않는 키, `hasDetail` 변화, 정렬·필터 후 복원을 검증한다.
- `collapse()`와 disabled 상태의 콜백 계약을 검증한다.

### 레이아웃 및 가상 스크롤 테스트

- 마스터 행 높이는 유지되고 layout slot에만 디테일 높이가 더해지는지 검증한다.
- 첫/중간/마지막 행, 뷰포트보다 큰 디테일, 여러 행 동시 펼침의 offset과 전체 높이를 검증한다.
- custom scrollbar virtual window가 활성화될 만큼 큰 데이터에서도 가시 범위와 물리/논리 좌표 변환을 검증한다.
- 펼침/접힘 전후 scroll anchoring, `scrollToCell`, 키보드 이동, 선택 오버레이 위치를 검증한다.
- Frozen Columns가 있을 때 디테일이 한 번만 렌더링되고 viewport 전체 폭을 차지하며 가로 스크롤에 흔들리지 않는지 검증한다.

### 상호작용 및 접근성 테스트

- 토글 클릭이 마스터 셀 선택·편집을 시작하지 않는지 검증한다.
- 디테일의 버튼·입력·Tab 이동·컨텍스트 메뉴가 정상 동작하고 마스터 이벤트는 실행되지 않는지 검증한다.
- 중첩 `<BGrid>`의 선택·편집·스크롤·포털이 부모와 독립적으로 동작하는지 검증한다.
- 접기 및 가상화 언마운트 시 포커스 복귀를 검증한다.
- `aria-expanded`, `aria-controls`, region label 연결 및 중복 ID 부재를 검증한다.

### 문서와 회귀 검증

- `README.md`의 기능 가이드와 Props Reference를 업데이트한다.
- `examples/MasterDetailExample.tsx` 및 관련 `site/` 문서를 추가한다.
- 기존 Flat 모드, Frozen Columns, 가변 행 높이, 가상 스크롤에 회귀가 없어야 한다.
- 다음 명령이 모두 통과해야 한다.

```bash
npm run test:library:readme
npm run verify:library
npm run verify:site
git diff --check
```

- 실제 브라우저 E2E에서 세로·가로 스크롤, 중첩 그리드 키보드 조작, 포커스 이동 및 접근성 트리를 확인한다.
