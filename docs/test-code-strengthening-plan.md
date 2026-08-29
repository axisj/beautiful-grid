# BGrid 전체 기능 테스트 마스터 플랜

> 상태: 전체 기능 기준 계획 수립 완료 · 구현 미착수  
> 작성일: 2026-08-23 (업데이트: 2026-08-29 엑셀 수식 플랜 반영)  
> 대상: `beautiful-grid`의 전체 공개 API, 내부 핵심 로직, 브라우저 동작, 배포 산출물  
> 기준 소스: `beautiful-grid/types.ts`, `beautiful-grid/index.tsx`, `beautiful-grid/editors/`, `beautiful-grid/utils/`

## 0. 이 문서의 목적

이 문서는 최근 작업분이나 현재 실패한 테스트만 보강하기 위한 계획이 아니다. `BGrid`가 제공하는 **전체 기능을 장기적으로 안전하게 개발하기 위한 테스트 마스터 명세**다.

구현 완료 후에는 다음 상태가 되어야 한다.

1. 모든 공개 prop, 컬럼 옵션, callback, union 분기가 최소 하나의 기능 ID와 테스트에 연결된다.
2. 각 기능은 기본 동작뿐 아니라 경계값, 동적 prop 변경, 오류, 관련 기능과의 조합까지 검증된다.
3. 데이터 정합성은 DOM 표시와 별도로 원본 데이터, visible/source index, callback 인자를 검증한다.
4. 실제 geometry, scroll, focus, Portal, pointer hit testing은 실제 브라우저에서 검증한다.
5. 소스 alias가 아니라 실제 npm tarball의 CJS, ESM, 타입, CSS를 소비자 관점에서 검증한다.
6. 새 기능을 추가할 때 테스트 누락 자체가 CI에서 탐지된다.

테스트 수와 단순 line coverage는 보조 지표다. 최우선 기준은 **공개 계약 추적률 100%와 기능별 의미 있는 행동 검증**이다.

## 1. 전체 기능 커버의 정의

기능 하나를 “테스트했다”고 인정하려면 가능한 범위에서 다음 다섯 축을 확인해야 한다.

| 축        | 확인 내용                                                                           |
| --------- | ----------------------------------------------------------------------------------- |
| 기본값    | prop을 생략했을 때의 기본 동작과 기본 DOM/CSS 상태                                  |
| 명시값    | 지원하는 boolean, enum, callback, renderer 분기를 모두 실행                         |
| 동적 변경 | `rerender`로 prop/data/columns가 바뀌었을 때 store와 DOM이 동기화                   |
| 경계·오류 | 0개 데이터, 최소/최대값, 잘못된 입력, callback 예외, 비동기 race, unmount           |
| 조합      | Frozen, merge, query, selection, editing, virtual scroll 등 영향을 주는 기능과 교차 |

단순 렌더링이나 callback 호출 횟수만 맞는 테스트는 전체 커버로 보지 않는다. callback 인자, 변경된 `BGridDataItem.values`, 상태 metadata, 입력 불변성, focus와 geometry 중 해당 기능에 필요한 결과를 함께 검증한다.

## 2. 테스트 계층

| 코드 | 계층      | 책임                                                  |
| ---- | --------- | ----------------------------------------------------- |
| U    | Unit      | 순수 함수, 데이터 변환, 좌표, 범위, 정규화, 상태 전이 |
| C    | Component | React 수명주기, Zustand 동기화, callback, DOM, 접근성 |
| E    | E2E       | 실제 scroll/geometry/focus/IME/Portal/pointer         |
| P    | Package   | pack된 CJS/ESM/types/CSS/manifest                     |
| S    | Site      | 예제, Learn, API Reference와 공개 API 문서 계약       |

U에서 가능한 로직을 E에만 두지 않고, happy-dom이 계산할 수 없는 결과를 억지 mock으로 C에 두지 않는다.

## 3. 공개 API 추적성

### 3.1 `BGridProps<T>` 전체 매핑

| 공개 prop                                                          | 기능 ID       | 계층       |
| ------------------------------------------------------------------ | ------------- | ---------- |
| `width`, `height`                                                  | F04           | C, E       |
| `headerHeight`, `footerHeight`, `bottomBarHeight`, `summaryHeight` | F04, F09      | C, E       |
| `itemHeight`, `itemPadding`                                        | F04, F07      | U, C, E    |
| `frozenColumnIndex`, `frozenRowCount`                              | F08           | U, C, E    |
| `columns`                                                          | F03           | U, C, P    |
| `columnsGroup`, `columnGroups`                                     | F10           | U, C, E, P |
| `onChangeColumns`                                                  | F04, F18      | C, E       |
| `data`, `onChangeData`                                             | F01, F02, F16 | U, C, E    |
| `page`                                                             | F09           | U, C, E    |
| `enableLoadMore`, `onLoadMore`, `endLoadMoreRender`                | F07           | U, C, E    |
| `scrollbar`                                                        | F20           | U, C, E, P |
| `status`, `pagination`                                             | F09           | U, C, E    |
| `className`, `style`                                               | F04, F25      | C, E       |
| `loading`, `spinning`                                              | F05           | C, E       |
| `scrollTop`, `scrollLeft`                                          | F07           | C, E       |
| `rowChecked`                                                       | F11           | U, C, E    |
| `sort`, `dataControl`, `icons`                                     | F12           | U, C, E    |
| `onClick`                                                          | F06           | C          |
| `msg.emptyList`                                                    | F05           | C, S       |
| `rowKey`, `selectedRowKey`                                         | F02, F06      | U, C       |
| `editable`, `editTrigger`                                          | F15           | C, E       |
| `showLineNumber`, `getRowClassName`                                | F06           | C, E       |
| `cellMergeOptions`                                                 | F17           | U, C, E    |
| `cellSelectionOptions`                                             | F13           | U, C, E    |
| `cellNavigationOptions`                                            | F14           | U, C, E    |
| `variant`                                                          | F25           | C, E       |
| `summary`                                                          | F09           | U, C, E    |
| `columnSortable`                                                   | F18           | C, E       |
| `reorder`, `reorderingInfo`                                        | F19           | U, C, E    |
| `pivot`                                                            | F21           | U, C, E, P |
| `searchOptions`                                                    | F22           | U, C, E, P |
| `contextMenuOptions`                                               | F23           | U, C, E, P |
| `formulaOptions`                                                   | F30           | U, C, E    |

### 3.2 `BGridColumn<T>` 전체 매핑

| 컬럼 옵션                           | 기능 ID       | 검증 내용                                              |
| ----------------------------------- | ------------- | ------------------------------------------------------ |
| `id`                                | F03, F12      | 명시/파생 ID, 중복 ID, query/toolbox 연결              |
| `key`                               | F02, F03      | string, nested string[], 누락 경로, 동일 key 복수 컬럼 |
| `label`, `width`                    | F03, F04      | ReactNode, 생략 width, resize, Frozen left             |
| `align`, `headerAlign`              | F03, F10      | left/center/right와 그룹 헤더                          |
| `sortDisable`, `sortComparator`     | F12           | sort 차단, stable 사용자 비교                          |
| `className`, `getClassName`         | F03, F25      | 정적/행별 class, rerender                              |
| `headerClassName`, `headerStyle`    | F03, F10, F25 | 일반/Frozen/그룹 헤더                                  |
| `itemRender`                        | F03, F15      | 표시와 legacy edit callback                            |
| `editor`, `editTrigger`, `editable` | F15, F16      | text/plugin과 Grid override                            |
| `editorIcon`, `onChangeValue`       | F16           | icon 분기와 변경 transaction                           |
| `getClipboardText`                  | F13, F21      | 일반/Pivot copy                                        |
| `searchable`, `getSearchText`       | F22           | 검색 포함/제외와 텍스트 override                       |
| `toolbox`, `filter`                 | F12           | boolean/config, filter 전 분기                         |
| `formula`                           | F30           | 컬럼별 수식 입력 활성화 여부 검증                      |

### 3.3 공개 union과 callback 분기

다음 분기는 모두 실행 테스트를 가져야 한다.

- `BGridDataItemStatus`: new, edit, remove
- `BGridFilterParam`: values/text/number와 contains/equals/notEquals/gt/gte/lt/lte/between
- `BGridPivotAggregate`: sum/count/avg/min/max/first/사용자 함수
- `BGridCellMoveDirection`: up/down/left/right/home/end/pageUp/pageDown/first/last/next/prev
- `BGridScrollbarVariant`: native/classic/modern
- `BGridSearchOpenReason`: shortcut/contextMenu/external/escape/closeButton/surfaceConflict
- `BGridContextMenuItem`: item/disabled/async/separator
- Clipboard copy/paste error reason 전체
- text editor의 preserve/replace, startOnInput, commitOnBlur, format/parse
- plugin editor의 activation, commit/cancel/move, Portal, stale session
- 수식 엔진 에러( `#REF!`, `#NAME?`, `#DIV/0!`, `#VALUE!`, `#CYCLE!` ) 및 다중 클립보드 포맷 분기

### 3.4 공개 선언과 실제 런타임의 일치 검사

공개 타입에 선언되었다는 이유만으로 구현된 기능으로 간주하지 않는다. 구현 1단계에서 각 공개 prop을 실제 source 사용 지점과 대조해 다음 세 상태 중 하나로 분류한다.

- `implemented`: 사용자 행동과 callback까지 구현되어 있으므로 정상·경계·조합 테스트를 작성한다.
- `compatibility-only`: deprecated 또는 과거 호환용이므로 현재 의미를 특성화하고 제거 전까지 package/type 테스트를 유지한다.
- `declared-only`: 타입에는 있지만 실행 경로가 없으므로 기능 계약을 확정해 구현하거나 공식 deprecate한다. 동작하지 않는 API를 의미 없는 렌더 테스트로 통과시키지 않는다.

2026-08-23 source 대조에서 `enableLoadMore`, `endLoadMoreRender`는 라이브러리 런타임 사용 지점이 확인되지 않았고, `onLoadMore`는 store 동기화만 확인됐다. `BGridPage.statusRender`, `BGridPage.paginationRender`, `BGridDataItem.parentItemIndex`도 실제 소비 지점을 다시 확인해야 한다. 이 항목들은 전체 기능 테스트 구현 전에 계약 결정표를 작성한다.

## 4. 전체 기능별 테스트 명세

### F01. 생성, prop 동기화, 인스턴스 수명주기

- 필수 prop만으로 생성하고 모든 기본값을 검증한다.
- data undefined/빈 배열/1개/다수와 모든 선택 prop의 rerender를 검증한다.
- 같은 값의 새 배열/객체가 scroll, active cell, editor를 불필요하게 초기화하지 않는다.
- 두 Grid의 data/query/selection/Portal/theme이 격리된다.
- unmount 후 listener, observer, RAF, Portal이 남지 않는다.
- React StrictMode에서도 callback과 listener가 중복되지 않는다.

예정: `test/component/gridLifecycle.test.tsx`, `multiGridIsolation.test.tsx`

### F02. 데이터 모델, row key, 값 읽기

- string/nested key와 0/false/빈 문자열/null/undefined/Date/배열/객체/circular 값을 검증한다.
- rowKey string/nested/undefined에서 row 식별과 callback key를 확인한다.
- data rerender 시 status, editedColumnIds, changedKeys, checked, meta를 보존한다.
- parentItemIndex가 지원 계약이면 정렬·필터·Pivot·rerender에서 보존하고, 미사용 호환 필드라면 타입 보존 테스트와 deprecation 결정을 남긴다.
- 같은 data key를 쓰는 복수 컬럼의 column ID와 changed key를 구분한다.
- 중복·누락 row key의 fallback/경고 계약을 특성화한다.
- 입력 data, wrapper, values를 직접 변경하지 않는다.

예정: `test/unit/cellValue.test.ts`, `test/component/dataLifecycle.test.tsx`

### F03. 컬럼, 헤더, 셀 renderer

- width 명시/생략, label 문자열/ReactNode, align 전 값을 검증한다.
- class/getClassName/header class/style을 일반·Frozen 영역에 적용한다.
- itemRender 인자와 primitive/ReactNode/null/잘못된 객체 fallback을 확인한다.
- 컬럼 추가/삭제/순서 변경 후 ID, width, left, active/edit cell을 재정렬한다.
- 중복 ID, 같은 key, nested key, 빈 columns 경계를 확인한다.
- left 계산이 원본 columns를 변경하지 않는다.

예정: `test/component/columnsRendering.test.tsx`, `test/unit/columnIdentity.test.ts`

### F04. 크기, container와 컬럼 resize

- width/height/header/item/summary/bottom bar 높이와 동적 변경을 검증한다.
- deprecated footerHeight와 bottomBarHeight의 우선순위·경고를 고정한다.
- itemPadding/itemHeight 조합에서 행, editor, empty row 높이를 맞춘다.
- ResizeObserver 후 visible count와 scrollbar metric을 갱신한다.
- resize 중 실시간 width, pointerup, mouseleave, cancel, 극단 width를 검증한다.
- onChangeColumns의 index/width/columns/group 정보와 입력 불변성을 검증한다.
- Frozen/그룹 leaf resize geometry를 E2E로 측정한다.

### F05. 빈 상태, loading, spinning

- 기본/사용자 empty message와 item height/colspan을 검증한다.
- loading/spinning 단독·동시·동적 상태와 overlay semantics를 검증한다.
- loading 중 interaction/pagination 정책과 page.loading 책임을 특성화한다.

### F06. 행, line number, active row, click

- line number 표시/폭, reorder handle, new/edit/remove 표시를 검증한다.
- getRowClassName과 selectedRowKey 설정/해제/rerender를 검증한다.
- click의 visible index, column, values와 query 후 source row 정합성을 확인한다.
- checkbox/editor icon/resize/toolbox 클릭이 일반 onClick을 오발하지 않는다.

### F07. 가상 스크롤, scroll 제어, load more

- 0/1/소량/대량 데이터의 range, padding, content height와 clamp를 검증한다.
- scrollTop/scrollLeft prop과 사용자 scroll의 store/DOM 동기화를 확인한다.
- wheel은 내부에서 더 이동할 수 있을 때만 소비한다.
- 긴 거리 이동 후 row/column/active/selection을 확인한다.
- load-more 1회 호출, 중복 방지, 좌표, end renderer를 검증한다.
- 현재 declared-only인 load-more API는 호출 조건과 완료/중복 방지 계약을 먼저 확정해 구현하거나 deprecate한 뒤 해당 결정을 테스트한다.
- query/data/height 변경 후 range와 scroll을 재계산한다.
- 대용량에서도 DOM 행 수 상한을 지킨다.

예정: `test/unit/visibleRange.test.ts`, `e2e/critical/virtual-scroll.spec.js`

### F08. Frozen 행·열

- index/count 0, 1, 전체 초과, 음수를 clamp한다.
- 네 사분면이 같은 논리 행·컬럼을 표시한다.
- header/body/summary/line number/checkbox/filler/gutter 경계를 각각 측정한다.
- Frozen 행은 virtual content에 중복 포함되지 않는다.
- resize/query/data/summary 변경 후 사분면 정렬을 유지한다.
- 좁은 Grid와 고 DPI에서 경계가 hit target을 가리지 않는다.

### F09. Summary, Bottom Bar, pagination, status

- summary top/bottom/없음과 column align/colSpan/class/renderer를 검증한다.
- Frozen summary 폭과 경계를 맞춘다.
- page의 모든 값, 페이지 이동, display length 경계를 검증한다.
- status 기본/ReactNode/context 함수와 total/visible/page를 검증한다.
- status/pagination/horizontal scrollbar 조합별 표시와 순서를 검증한다.
- view별 className/style과 deprecated renderer 계약을 특성화한다.
- page.statusRender/paginationRender가 실제 renderer 계약인지 미사용 호환 필드인지 확정하고, 구현 또는 deprecation 결과를 테스트한다.

### F10. 단일·다단 컬럼 그룹

- flat, legacy, nested와 1~4단 이상 uneven depth를 검증한다.
- unknown leaf, empty child, duplicate group ID는 안전하게 fallback한다.
- align/class/style과 Frozen 경계 colSpan 분할을 검증한다.
- leaf resize와 같은 부모 reorder만 허용한다.
- invalid tree 경고와 legacy/nested 동시 입력 우선순위를 고정한다.

### F11. 행 checkbox/radio

- checkbox 단일/복수/전체/indeterminate와 radio 단일 선택을 검증한다.
- checkedIndexes/checkedRowKeys controlled 입력과 disabled row를 검증한다.
- query 후 visible/source 변환, checkedAll, 숨은 선택 정책을 확인한다.
- data 순서·추가·삭제 후 stale index가 남지 않는다.
- pointer와 Space/Enter, accessible name을 검증한다.

### F12. legacy sort, DataControl, Toolbox

- legacy asc/desc/clear, single/multi, sortDisable, callback 불변성을 검증한다.
- DataControl manual/client, stable sort, null-last, nested key, custom comparator를 검증한다.
- values/text/number filter와 모든 operator를 실행한다.
- caseSensitive, values, getValue, predicate, formatValue, max list를 검증한다.
- invalid draft, unknown/duplicate column ID를 안전하게 처리한다.
- Toolbox boolean/config, icon, extra/disabled item, custom renderer를 검증한다.
- Escape/outside/scroll/resize/query 변경의 Portal 수명주기를 확인한다.
- client query 중 row reorder를 UI와 handler 양쪽에서 차단한다.

### F13. 셀 선택과 Clipboard

- enable/disable, click/drag, 역방향, Shift 확장, Ctrl/Meta 다중 범위를 검증한다.
- Escape/outside 옵션과 Grid 내부 non-cell/scrollbar click을 구분한다.
- Frozen/일반, virtual auto-scroll, merged range를 검증한다.
- copy의 tab/CR, sparse 순서, getClipboardText, nested key를 검증한다.
- Clipboard 실패 fallback과 모든 copy error reason을 검증한다.
- paste의 editable/read-only, parse, 다중 행, row status, metadata를 검증한다.
- createRowOnPaste와 모든 paste error/limit 분기를 검증한다.
- 수식 복사 시 `text/plain`과 `application/x-bgrid-formula` 다중 MIME 타입 기록을 검증한다.
- 클립보드 붙여넣기 시 AST 오프셋 시프트(Shift) 동작 및 '값만 붙여넣기(Paste Special)' 분기를 검증한다.

### F14. 활성 셀과 키보드

- controlled/uncontrolled active cell을 구분한다.
- 모든 move direction과 Arrow/Home/End/Ctrl/Meta/Page/Tab 키를 실행한다.
- wrap, 경계, 빈 Grid, bounds 축소 clamp를 검증한다.
- Shift selection, Frozen/일반 경계, merge, read-only를 검증한다.
- editOnEnter, F2/Enter/Escape, onActiveCellChange, focus 복귀를 확인한다.
- ensureCellVisible이 필요한 축만 scroll한다.

### F15. legacy 편집과 text editor

- Grid/column editable 조합과 기본/override trigger를 검증한다.
- legacy save/cancel/move의 prev/next/current를 실행한다.
- text preserve/replace, startOnInput, format/parse, aria/inputProps를 검증한다.
- commitOnBlur, 다른 셀, Escape/Enter/Tab을 검증한다.
- IME 중 editor DOM을 유지하고 완성 문자열만 commit한다.
- status/editedColumnIds/changedKeys/onChangeData meta를 검증한다.
- 외부 data/column 변경과 unmount에서 stale save를 막는다.

### F16. Plugin, editor icon, 변경 transaction

- editor factory의 타입과 런타임 연결을 검증한다.
- activation, commit/cancel/move, Portal, focus를 확인한다.
- editorIcon render/aria/visibility/onClick 유무 분기를 검증한다.
- onChangeValue sync/async, 보정, 다중 변경, cancel을 검증한다.
- nested/same key, unknown/ambiguous/duplicate change를 검증한다.
- async 중 outside click, 새 세션, data 교체, unmount race를 검증한다.
- 최초 terminal callback만 유효하고 merge backing rows를 원자 변경한다.
- onChangeData meta 전체를 검증한다.

### F17. 셀 병합

- mergeBy string/nested, wordWrap, 단일/복수 컬럼을 검증한다.
- 첫/중간/마지막/전체/단독/null 그룹을 검증한다.
- virtual range 밖에서 시작한 rowSpan과 cache invalidation을 확인한다.
- Frozen fragment를 하나의 논리 셀로 취급한다.
- click/selection/navigation/copy/paste/edit가 canonical cell과 전체 row scope를 쓴다.

### F18. 컬럼 resize와 drag reorder

- resize/drag/toolbox/sort handle이 서로 간섭하지 않는다.
- pointerup-only, mouseleave, 빠른 연속 drag를 처리한다.
- 일반/Frozen/그룹 leaf width와 left를 재계산한다.
- 같은 부모 이동만 허용하고 cancel/invalid drop은 불변이다.
- 조작 후 scroll/active/editor/toolbox target을 유지한다.

### F19. 행 reorder

- enabled, custom handle, 위/아래/동일/첫/마지막/drop cancel을 검증한다.
- onReorder의 void/true/false 계약과 metadata 보존을 고정한다.
- reorderingInfo controlled 표시를 검증한다.
- client query/Pivot/Frozen row 등 비허용 조합을 양쪽에서 차단한다.
- selection/check/active/edit source index와 virtual auto-scroll drop을 검증한다.

### F20. native/classic/modern 스크롤바

- 세 variant와 horizontal/vertical visible/class/style을 검증한다.
- track/thumb/button/keyboard, min thumb와 resize metric을 검증한다.
- Bottom Bar와 root vertical 배치를 확인한다.
- native scroll container가 source of truth인지 검증한다.
- pointer lifecycle, touch scroll, 외부 wheel boundary를 브라우저에서 확인한다.

### F21. Pivot

- enabled, rows/columns/values의 0개/복수 조합을 검증한다.
- nested field와 field 표시 속성을 검증한다.
- 모든 내장 aggregate와 사용자 aggregate를 실행한다.
- null/undefined/NaN/문자 숫자/빈 bucket과 emptyValue를 검증한다.
- label separator, itemRender/getClipboardText context를 검증한다.
- 입력 불변성과 sourceItems 연결을 확인한다.
- 비지원 selection/sort/reorder/Frozen UI 계약과 rerender를 검증한다.

### F22. Grid 검색

- enabled/shortcut/contextMenu와 controlled/uncontrolled open/query를 검증한다.
- Ctrl/Meta+F가 focus Grid에서만 동작하고 editor/외부 input을 가로채지 않는다.
- searchable, Grid/column getSearchText 우선순위와 값 정규화를 검증한다.
- previous/next/순환, query·data·columns·query 결과 변경을 검증한다.
- 대용량 chunk 취소와 stale result 무시를 확인한다.
- 모든 open reason, icon/label/result formatter, IME를 검증한다.
- highlight, active cell, Frozen/virtual ensure-visible을 검증한다.

### F23. Context Menu와 floating surface 충돌

- pointer/keyboard open, item/separator/disabled/async item을 검증한다.
- target의 cell, visible/source index, key, column, item/value를 확인한다.
- viewport clamp와 좁은 Grid를 검증한다.
- Arrow/Home/End/Enter/Escape와 focus 복귀를 검증한다.
- native menu 유지와 preventDefault 조건을 구분한다.
- search/toolbox/editor/menu 충돌과 surfaceConflict를 검증한다.
- data/query/unmount cleanup과 multi Grid 격리를 검증한다.

### F24. 내부 store와 비동기 수명주기

- 모든 prop setter와 derived state를 일관되게 갱신한다.
- source/visible 양방향 map이 역함수 관계다.
- data 변경 시 query/check/active/edit/search를 재조정한다.
- session active/resolving/committing 전이와 stale session을 검증한다.
- closeTransientSurfaces 전 분기와 listener/observer cleanup을 확인한다.
- callback 예외/rejection이 partial state를 남기지 않는다.

공개 전역 store는 만들지 않는다. 필요한 내부 순수 transition만 추출한다.

### F25. CSS, theme, variant

- 배포 CSS에 Tailwind/global/demo selector 오염이 없다.
- public `--bgrid-* ` 변수와 semantic hook을 목록 관리한다.
- default/vertical-bordered와 odd/hover/active/selected/edit/loading을 검증한다.
- Frozen/rounded/header-body-summary-footer geometry를 computed style로 확인한다.
- Grid별 theme이 모든 Portal surface에 상속된다.
- root font size, dark/high-contrast override의 hardcode 회귀를 확인한다.
- source/dist CSS 동일성과 legacy selector를 보존한다.

### F26. 접근성

- Grid/row/header/cell/check/dialog/menu role과 상태 ARIA를 검증한다.
- 모든 icon-only button의 accessible name을 확인한다.
- trigger/surface ID가 Grid별 고유하고 연결된다.
- keyboard만으로 selection/edit/sort/filter/page/scroll/search/menu를 수행한다.
- Portal 진입·종료 후 focus를 복구한다.
- 자동 axe 검사는 보조로 쓰고 실제 keyboard E2E를 유지한다.

### F27. 공개 exports, 타입, npm package

- root, `/editors`, `/style.css`를 CJS/ESM/TS에서 해석한다.
- 모든 공개 type/editor factory/utils export 누락을 탐지한다.
- generic/nested/editor/Pivot/search/menu의 positive/negative type fixture를 둔다.
- tarball exports/main/module/types/README/LICENSE/파일 목록을 검증한다.
- 최소/고정 Node에서 설치·bundle·typecheck한다.
- peer React 중복을 확인하고 source alias 없이 tarball만 쓴다.

### F28. 예제, Learn, API Reference

- 모든 demo route가 렌더되고 주요 기능별 실행 예제가 존재한다.
- API Reference와 types.ts의 누락·유령 prop을 탐지한다.
- 예제는 public API만 import한다.
- 예제 smoke와 라이브러리 행동 테스트를 분리한다.
- README 코드를 typecheck하고 deprecated API를 제한한다.

### F30. 엑셀 수식 엔진 (Formula)

- 절대 참조(`$A$1`), 상대 참조(`A1`), 혼합 참조(`$A1`, `A$1`)의 AST 토큰화 및 파싱을 검증한다.
- 다단 의존성 체인의 캐시 업데이트 트리거를 검증한다.
- 순환 참조(`A1=B1`, `B1=A1`) 발생 시 무한 루프 차단과 `#CYCLE!` 에러 반환을 확인한다.
- 외부 데이터 조작 시 수식 캐시(`formulaResults`)와 종속성 그래프가 정확히 갱신되는지 확인한다.
- 멀티 그리드 인스턴스 환경에서 캐시와 의존성 그래프가 상호 완벽히 격리되는지 검증한다.

### F29. 성능, 메모리, 호환성

- 10만/100만 행의 DOM row 상한을 검증한다.
- 초기/scroll/sort/filter/search/paste median과 p95를 기록한다.
- 반복 rerender/open/edit 후 listener/Portal/observer가 증가하지 않는다.
- Chromium PR, Firefox/WebKit/390px/320px 야간 suite를 운영한다.
- touch/wheel/pointer/focus/IME 차이를 브라우저별로 확인한다.
- 절대 시간은 안정된 runner 전까지 추세 경고로 쓰되 DOM 상한·중복 callback·누수는 즉시 실패시킨다.

## 5. 내부 유틸리티 단위 테스트 목록

| 대상                           | 필수 테스트                                        |
| ------------------------------ | -------------------------------------------------- |
| `buildHeaderMatrix`            | flat/legacy/nested/invalid/Frozen clip/불연속 leaf |
| `cellEditState`                | mark/is/clear, column ID와 key token, status 보존  |
| `cellEditTransaction`          | resolve, nested immutable set, 중복/unknown/no-op  |
| `coordinate`                   | clamp, bounds, ensure-visible, Frozen 제외         |
| `createPivotData`              | aggregate/bucket/label/context/불변성              |
| `filterData`                   | 모든 operator/type/null/Date/case/predicate        |
| `processDataQuery`             | stable sort/source map/query 조합/불변성           |
| `updateDataQuery`              | apply/clear/normalize/multi-sort index             |
| `gridSearch`                   | normalize/scan/opt-out/source map/chunk cancel     |
| `getCellSelectionAxisState`    | 단일/다중/역방향/병합 range                        |
| `getCellValue`                 | string/nested/missing/falsy                        |
| `getColumnId`                  | 명시/파생/nested/중복                              |
| `getFrozenColumnsWidth`        | line/check/reorder/Frozen 조합                     |
| `getLineNumber`                | 0/자리수 경계/reorder                              |
| `getVisibleScrollableRowRange` | empty/Frozen/clamp/viewport 경계                   |
| `mergedCells`                  | canonical/scope/range/Frozen fragment              |
| `mouseEventSubscribe`          | move/up/leave/cancel/window/cleanup                |
| `scrollbar`과 metrics          | 정규화/Bottom Bar/thumb/resize                     |
| `useBodyData`                  | virtual slice/merge cache/edit/source index        |
| `common` debounce/throttle     | leading/trailing/cancel/flush                      |
| `number/*`                     | locale/음수/NaN/precision                          |
| `delay`, `useForceUpdate`      | timer/unmount; 의미 없으면 상위 행동으로 대체      |
| `formula/*`                    | 파서(상대/절대 참조), AST 시프트 알고리즘, DAG 순환 감지 |

## 6. 핵심 조합 매트릭스

| 조합                               | 검증 결과                            |
| ---------------------------------- | ------------------------------------ |
| query × check/click                | visible/source index와 checkedAll    |
| query × reorder                    | client mode UI/handler 차단          |
| query × virtual/search             | processed data 기준 range/result     |
| Frozen × merge                     | fragment 분리와 논리 cell 통합       |
| Frozen × summary                   | geometry와 width                     |
| Frozen × selection/navigation/edit | 절대 index, scroll, 단일 transaction |
| editing × async × rerender         | stale commit 차단                    |
| editing × clipboard                | parse/commit/status/meta 동일 규칙   |
| selection × merge × virtual        | logical range와 auto-scroll          |
| resize × Frozen × scrollbar        | left/width/metric 동기화             |
| column reorder × group × Toolbox   | handle 격리와 부모 규칙              |
| row reorder × select/check         | 이동 후 상태/source row              |
| Pivot × copy/render                | source context와 aggregate           |
| Portal × multi Grid × theme        | ID/focus/CSS/listener 격리           |
| search × menu × Toolbox/editor     | 단일 surface와 focus                 |
| loading × page/load-more           | 중복 callback과 disabled 상태        |
| controlled prop × event            | callback 후 parent rerender 전 계약  |
| unmount × async/listener           | update/leak 없음                     |
| Formula × Virtual Scroll           | 화면 밖 셀 참조 시 정확한 원본 데이터 평가 여부 |
| Formula × Row Reorder / Sort       | 참조 파괴 경고 발생 및 정렬 시 계산 결과 기준 처리 여부 |

## 7. 목표 테스트 구조

```text
test/
  fixtures/
  unit/{data,query,layout,editing,selection,pivot,search}/
  component/{lifecycle,rendering,interaction,advanced}/
  contract/{publicApi,accessibility,css,examples}/
e2e/
  critical/
  compatibility/
  performance/
```

helper는 입력 준비와 사용자 event만 담당하며 제품 로직을 복제하지 않는다. 기존 테스트는 일괄 이동하지 않고 기능 보강 PR에서 점진적으로 분리한다.

## 8. API-테스트 추적 자동화

다음을 추가한다.

- `test/coverage-map.ts`: 기능 ID, public prop/type, U/C/E/P/S test 파일
- `scripts/check-test-coverage-map.mjs`: `types.ts`와 public exports의 미등록 항목 탐지

규칙:

1. BGridProps/BGridColumn property 추가 시 map과 test를 함께 추가한다.
2. 공개 union literal 추가 시 해당 literal 실행 test ID가 있어야 한다.
3. map의 test 파일과 test name이 실제로 존재해야 한다.
4. 삭제 API를 map이 참조하면 실패한다.
5. deprecated API도 제거 전까지 호환 테스트를 유지한다.
6. public type 변경에 map/test 변경이 없으면 CI가 실패한다.

## 9. 품질 기준

- BGridProps 매핑률: 100%
- BGridColumn 매핑률: 100%
- 공개 union literal 실행률: 100%
- 핵심 조합 매트릭스: 100%
- 전체 line/function coverage: 85% 이상
- 전체 branch coverage: 80% 이상
- store/query/edit/merge/selection/virtual P0: line 90%, branch 85% 이상
- P0 E2E flaky: 0%

버그 수정은 실패 재현 테스트를 먼저 둔다. 임의 sleep, 대형 snapshot, assertion 완화, 무근거 timeout 상향, retry로 실패 숨기기를 금지한다. 예상하지 않은 console error/warn과 unhandled rejection은 실패시킨다.

## 10. CI

### PR 필수

```bash
# 기본 품질 및 라이브러리/사이트 검증 (package.json의 verify 스크립트 활용)
npm run verify:library
npm run verify:site

# 추가 E2E 및 테스트맵 커버리지 검사
npm run test:e2e
node scripts/check-test-coverage-map.mjs
git diff --check
```

lint/unit, component, package, Chromium E2E, site를 병렬화한다. coverage가 루트 Vitest 전체를 실행하면 `npm test`를 중복 실행하지 않는다. PR Playwright는 retry 없이 실패를 노출하고 첫 실패부터 trace/screenshot/video를 보존한다.

### 야간·주간

- P0 Chromium `--repeat-each=10`
- Firefox/WebKit
- Chromium 390px/320px
- 지원 Node matrix tarball consumer
- performance/DOM/leak 추세

## 11. 구현 순서

| 단계 | 범위                                | 완료 결과                      |
| ---- | ----------------------------------- | ------------------------------ |
| 1    | API inventory와 coverage-map        | 공개 기능 추적률 100%          |
| 2    | fixture/helper/script/cleanup guard | 테스트 기반 통일               |
| 3    | 내부 유틸·store 불변식              | 작은 실패 격리                 |
| 4    | F01~F12                             | 기본 Grid 기능 완전 커버       |
| 5    | F13~F20                             | 핵심 상호작용 완전 커버        |
| 6    | F21~F24, F30                        | 고급 기능(수식 포함)과 비동기 수명주기 |
| 7    | F25~F28                             | CSS/accessibility/package/site |
| 8    | 조합 매트릭스와 Chromium E2E        | 실제 브라우저 회귀 방어        |
| 9    | 호환성/성능                         | 장기 운영                      |
| 10   | CI 필수화                           | 테스트 없는 새 API 차단        |

## 12. 전체 완료 정의

- F01~F29의 필수 케이스가 자동화되어 있다.
- 모든 public property와 union literal이 coverage map에 있다.
- 내부 유틸의 정상·경계·오류 경로가 검증된다.
- 조합 매트릭스 모든 행에 자동 테스트가 있다.
- U/C/E/P/S 책임이 분리되어 있다.
- 실제 tarball의 CJS/ESM/types/CSS 검사가 통과한다.
- Chromium PR과 Firefox/WebKit/mobile 야간 suite가 운영된다.
- 공개 API/code coverage/flaky 목표를 만족한다.
- 새 공개 API를 map/test 없이 추가할 수 없다.
- 신규 버그 수정에는 재현 회귀 테스트가 있다.

## 13. 보호 규칙

1. 시작 시 `git status --short --branch`와 기준선을 기록한다.
2. 기존 작업 트리 변경을 삭제·되돌리기·포맷팅하거나 섞지 않는다.
3. 배포 source of truth는 `beautiful-grid/`다.
4. 전역 Zustand store를 만들지 않는다.
5. 컬럼 left는 `BGrid.tsx`에서만 계산한다.
6. helper에 제품 로직을 복제하지 않는다.
7. 기존/환경/신규 실패를 구분한다.
8. test 삭제나 assertion 완화로 실패를 숨기지 않는다.
9. 별도 요청 없이 커밋, 푸시, 버전 변경, 배포하지 않는다.
