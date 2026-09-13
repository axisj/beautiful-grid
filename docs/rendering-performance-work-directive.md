# BeautifulGrid 렌더링 성능 개선 작업 지시서

> 우선순위: P0  
> 대상 저장소: `axisj/beautiful-grid`  
> 기준 브랜치: 작업 시작 시 최신 `main`  
> 작업 성격: 측정 기반 성능 개선. 기능 추가나 공개 API 변경이 목적이 아니다.

## 작업 목표

현재 제공하는 행·열 가상화, Frozen 영역, 편집, 선택, 검색, 병합, 가변 행 높이를 보존하면서 다음 병목을 측정하고 개선한다.

1. 대용량 `data`를 처음 전달하거나 같은 데이터로 다시 렌더할 때 발생하는 불필요한 전체 행 매핑과 메모리 할당을 줄인다.
2. 스크롤 또는 한 셀의 상태 변경이 보이는 모든 행·셀의 불필요한 React 렌더로 확산되지 않게 한다.
3. 실제 화면에 필요한 행·열보다 지나치게 많은 DOM을 만들지 않는다.
4. 결과를 재현 가능한 벤치마크와 회귀 테스트로 남겨 이후 기능 개발이 성능을 되돌리지 못하게 한다.

“코드가 더 빨라 보인다”, 단일 실행 시간이 줄었다, `memo`를 추가했다는 사실만으로 완료 처리하지 않는다. 동일한 환경과 입력에서 기준선과 변경본을 반복 측정하고, 기능 회귀가 없으며, 병목 원인이 제거됐다는 증거가 있어야 한다.

## 현행 구조와 반드시 지킬 제약

- 배포 대상 소스는 `beautiful-grid/`이다. 데모 앱만 최적화해서는 안 된다.
- 각 `<BGrid>`는 `AppStoreProvider`가 생성하는 독립 Zustand store를 사용한다. 전역 store 또는 Grid 간 공유 mutable cache를 만들지 않는다.
- 컬럼 `left`는 `beautiful-grid/BGrid.tsx`에서만 계산한다.
- 정렬·필터 전 원본은 `sourceData`, 화면 행은 `data`, 양쪽 인덱스는 `sourceIndexByVisibleIndex`와 `visibleIndexBySourceIndex`로 연결된다.
- 행 편집 callback의 index는 source index다. 화면 index를 넘기거나 정렬·필터 후 다른 행을 수정하면 중대한 회귀다.
- Frozen 열이 있으면 같은 논리 행이 좌·우 영역에 나뉘어 렌더된다. 두 영역의 높이, hover, selection, editing 상태가 일치해야 한다.
- 가변 행 높이는 전체 offset 계산과 이진 탐색을 사용한다. 높이가 고정인 기본 경로에 같은 O(n) 비용을 추가하지 않는다.
- 정적 CSS와 `bgrid-*`, `--bgrid-*` 규칙을 유지한다. 성능을 이유로 런타임 CSS-in-JS를 도입하지 않는다.
- 기존 공개 타입, callback 순서, selection/editing 의미를 변경하지 않는다. 공개 API 변경이 불가피하면 구현 전에 별도 설계 메모와 호환성 근거를 제출하고 승인을 기다린다.

검토할 주요 코드:

- `beautiful-grid/BGrid.tsx`: data projection, identity index mapping, row height metrics
- `beautiful-grid/components/Table.tsx`: scroll scheduling, visible range, selection geometry
- `beautiful-grid/components/TableBody.tsx`: store 구독, 행·셀 생성, visible column range
- `beautiful-grid/components/TableBodyCell.tsx`: 셀 renderer와 memo 경계
- `beautiful-grid/store/createAppStore.tsx`: data 갱신과 편집 transaction
- `beautiful-grid/utils/getVisibleScrollableRowRange.ts`
- `beautiful-grid/utils/virtualScrollWindow.ts`
- `beautiful-grid/utils/rowHeightMetrics.ts`
- `scripts/perf-runtime-compare.mjs`

## 비범위

이번 작업에서 다음을 함께 구현하지 않는다.

- 트리 데이터와 폴딩
- Excel 수식 엔진
- Canvas/WebGL 렌더러 전환
- React 이외 프레임워크 지원
- 공개 API의 삭제 또는 의미 변경
- 정렬·필터 알고리즘의 Web Worker 이전
- 서버 페이징 정책 변경
- 디자인, 색상, 간격 변경
- 테스트 timeout/retry 상향으로 느림이나 flaky를 숨기는 조치

측정 결과 다른 병목이 더 크더라도 위 범위를 넘어서는 변경은 별도 제안으로 남기고 임의로 확장하지 않는다.

## 공개 계약

성능 작업 전후에 다음 사용자 관찰 계약이 동일해야 한다.

1. `data`와 `columns`를 같은 reference로 다시 렌더하면 active cell, selection, editor session, scroll 위치가 불필요하게 초기화되지 않는다.
2. 새로운 배열 reference가 오면 내용이 같더라도 controlled prop으로 동기화된다.
3. client sort/filter 후 click, check, edit, paste, context menu의 `sourceIndex`가 원본 행을 가리킨다.
4. `rowKey`가 있으면 행의 정체성을 `rowKey`로 판단한다. 없을 때는 기존 index 기반 호환 동작을 유지한다.
5. Frozen/일반 영역은 같은 논리 셀을 표시하며 한쪽만 stale 상태가 되지 않는다.
6. `itemRender`, `getClassName`, `getRowClassName`, `getRowHeight`는 문서화된 인자를 받는다. 최적화 과정에서 callback을 생략하거나 오래된 결과를 재사용하지 않는다.
7. cell merge, selection overlay, search highlight, text/plugin/checkbox editor가 현재와 동일하게 동작한다.
8. 100만 행 논리 스크롤의 처음·중간·마지막 위치와 행 번호가 유지된다.
9. 입력 `data`, row wrapper, `values`, `columns`를 새로 mutate하지 않는다. 기존 mutation 지점이 발견되면 별도 회귀 테스트 없이 범위를 넓혀 수정하지 말고 보고한다.
10. 개발 모드의 경고와 production 동작이 달라지지 않는다.

## 성능 측정 계약

### 측정 환경 고정

- 기준선과 변경본을 같은 머신, 같은 Node, 같은 Chromium, 같은 viewport에서 연속 측정한다.
- 다른 프로세스 부하가 큰 실행은 폐기한다.
- 각 시나리오는 warm-up 1회 후 최소 7회 실행한다.
- 원시 결과를 JSON으로 저장하고 median, p95, 최악 frame gap을 계산한다.
- 평균만 보고하지 않는다. 기준선과 변경본의 git SHA, Node/Chromium 버전, CPU throttle, viewport를 함께 기록한다.
- 벤치마크 스크립트는 실패 시 non-zero로 종료해야 하며, 단순 로그 도구로 끝내지 않는다.

### 필수 시나리오

| ID | 데이터/컬럼 | 기능 조합 | 측정값 |
|---|---:|---|---|
| P01 | 10,000행 × 20열 | 기본 고정 높이 | mount, heap, DOM node 수 |
| P02 | 100,000행 × 20열 | 기본 고정 높이 | mount, 최초/중간/마지막 이동 |
| P03 | 1,000,000행 × 20열 | modern scrollbar | mount, heap, 160-step scroll frame |
| P04 | 10,000행 × 100열 | Frozen 3열 | 가로 스크롤, DOM cell 수 |
| P05 | 10,000행 × 20열 | selection + search highlight | 한 셀 선택 변경의 commit 수 |
| P06 | 10,000행 × 20열 | text editing | 편집 시작·저장 후 commit 수와 callback |
| P07 | 10,000행 × 20열 | variable row height | mount와 수직 스크롤 |
| P08 | 10,000행 × 20열 | client sort/filter | 처리 시간과 source mapping 정확성 |

가능하면 React Profiler의 `actualDuration`, commit count와 브라우저 Performance metric의 Task/Script/Layout/RecalcStyle를 함께 기록한다. Profiler가 제품 bundle에 포함되거나 production 성능을 왜곡하면 테스트 전용 harness에서만 사용한다.

### 판정 규칙

- 선택한 주 병목 시나리오에서 관련 median 지표가 기준선보다 최소 15% 개선되어야 한다.
- 비대상 필수 시나리오의 median이 5%를 초과해 느려지거나 p95가 10%를 초과해 악화되면 회귀로 간주한다.
- 경계값 근처면 실행 횟수를 15회로 늘려 재측정한다.
- 브라우저 시간 측정이 불안정해도 DOM node 수, React commit 수, 할당 자료구조 크기처럼 결정 가능한 지표는 반드시 단정적으로 검증한다.
- 숫자 목표를 통과시키기 위해 테스트 데이터, viewport, overscan, 기능 조합을 기준선과 다르게 만들지 않는다.
- 개선이 15% 미만이면 병목 가설이 틀렸거나 사용자 영향이 작은 것으로 보고, 코드를 억지로 합치지 말고 측정 결과와 다음 후보를 제출한다.

## 구현 단계

### 0단계: 기준선 확정

제품 코드를 수정하기 전에 다음을 완료한다.

1. `scripts/perf-runtime-compare.mjs`의 현재 실행 조건과 route 유효성을 확인한다.
2. 위 P01~P08을 재현할 benchmark fixture 또는 전용 route를 만든다. 데모의 랜덤 데이터나 네트워크에 의존하지 않는다.
3. 결과 JSON schema와 비교 실패 기준을 코드로 작성한다.
4. 기준선 결과를 저장하되 머신 절대 시간이 저장소마다 달라지는 경우 구조적 지표와 상대 비교 설정을 분리한다.
5. 제품 코드 변경 전 기준선 SHA의 결과를 PR에 첨부한다.

기준선 없이 제품 코드를 먼저 바꾸면 해당 변경은 리뷰하지 않는다.

### 1단계: identity mapping 할당 제거

현재 client query가 없어도 `resolvedData.map`으로 index 배열과 `Map`을 만든다. 대용량 기본 경로에서는 identity mapping을 명시 자료구조로 만들지 않는 방향을 우선 검토한다.

요구사항:

- 정렬·필터·Pivot 등 실제 projection이 있을 때만 명시 매핑을 만든다.
- identity 상태는 `undefined`, 전용 상수/타입 또는 lazy accessor 중 하나로 표현한다.
- 타입 변경 전 `sourceIndexByVisibleIndex`와 `visibleIndexBySourceIndex`의 모든 consumer를 `rg`로 목록화한다.
- fallback은 반드시 `mapped ?? visibleIndex`처럼 source index 0을 보존해야 한다. `mapped || visibleIndex`를 금지한다.
- 편집 transaction, checkbox/radio, click, search, selection paste, context menu, row reorder callback을 각각 검사한다.
- 외부에서 명시 매핑을 전달하는 내부 `Table` 경로와 client query 경로는 유지한다.
- 100만 행 기본 렌더에서 100만 길이 배열과 100만 entry `Map`이 생성되지 않는 테스트를 추가한다.

### 2단계: 렌더 경계와 key 안정화

측정으로 TableBody 전체 재렌더가 병목임을 확인한 후 진행한다.

- 행 렌더를 `TableBodyRow` 같은 독립 컴포넌트로 분리하고 memo 비교 기준을 명시한다.
- `rowKey`가 있으면 React key에 사용한다. 중복·누락 key는 개발 경고와 안전한 fallback 정책을 테스트한다.
- 정렬·필터·향후 폴딩으로 visible index가 바뀌어도 다른 행의 local/editor DOM이 재사용되지 않아야 한다.
- inline handler 때문에 모든 `TableBodyCell` memo가 무효화되지 않게 callback 경계를 재설계한다.
- callback 안정화를 위해 stale closure를 만들지 않는다. handler가 최신 column, item, mapping, disabled 상태를 읽는지 테스트한다.
- `itemRender` 결과 자체를 무조건 캐시하지 않는다. row/column/value 또는 외부 closure 변화의 의미를 보존해야 한다.
- Frozen 좌·우의 동일 행이 같은 stable identity를 사용하되 DOM key 충돌은 각 React tree 내부에서만 판단한다.

### 3단계: store 구독 세분화

- 각 component가 실제 필요한 Zustand field만 구독하게 한다.
- scrollTop 변경 시 Frozen top rows, header, pagination, toolbox가 불필요하게 다시 렌더되지 않는지 측정한다.
- 한 셀의 edit/search/check 상태 변경이 무관한 모든 행의 renderer 호출로 확산되지 않게 한다.
- mutable `Map`을 제자리 변경한 뒤 같은 reference로 set하여 selector가 갱신을 놓치는 패턴을 만들지 않는다.
- selector 최적화로 state transition 자체를 누락하지 않는다.
- 최적화 전후 render count 테스트는 제품 구현 세부 횟수에 과도하게 결합하지 말고 “무관한 행은 증가하지 않는다” 같은 계약을 검증한다.

### 4단계: overscan과 스크롤 scheduling

P03/P04 측정에서 DOM 수나 frame gap이 병목일 때만 변경한다.

- 키보드 연속 이동에 필요한 최소 window와 포인터/휠 스크롤 overscan을 분리한다.
- 빠른 스크롤 중 빈 화면이 보이지 않는 범위에서 adaptive overscan을 검토한다.
- requestAnimationFrame당 store scroll update는 최대 1회여야 한다.
- scroll 종료 시 최종 좌표를 반드시 commit한다.
- native/classic/modern scrollbar를 각각 검증한다.
- 임의 debounce로 입력 지연을 만들거나 focus/selection 위치를 늦게 반영하지 않는다.

### 5단계: 통합과 문서화

- benchmark 명령을 `package.json`에 명확한 이름으로 연결한다.
- CI에서는 안정적인 구조 지표를 필수화하고, 시간 지표는 runner 변동성을 고려해 추세 또는 넓은 회귀 guard로 운영한다.
- 성능 관련 공개 설명이 실제 동작과 다르면 `site/src/content/learn/{ko,en}/virtual-scroll.md`를 함께 갱신한다.
- bundle 크기가 바뀌면 `npm run update:library:bundle-metrics`를 실행하고 생성 파일을 포함한다.

## 필수 테스트

### Unit

- identity mapping과 explicit mapping의 양방향 변환
- source index 0 처리
- 빈 데이터, 1행, 100만 행 논리 길이
- visible row/column range 경계와 overscan
- 고정/가변 행 높이 offset
- 중복·누락 rowKey fallback

### Component

- 동일 reference rerender가 editor/selection/scroll을 초기화하지 않음
- 한 행 변경 시 무관한 행의 `itemRender` 호출이 증가하지 않음
- 정렬·필터 후 stable key가 올바른 row DOM과 연결됨
- Frozen 좌우가 같은 행 값을 표시함
- checkbox, text/plugin editor, paste가 정확한 source row를 변경함
- search result와 context menu target의 source index가 정확함
- StrictMode에서 listener와 callback이 중복되지 않음

### E2E

- 100만 행 처음/중간/마지막 이동
- 빠른 수직·수평 스크롤 중 빈 body나 stale row가 노출되지 않음
- Frozen 3열 상태의 가로 스크롤과 click/edit
- variable height 상태의 `scrollToRow`
- 스크롤 직후 선택·편집·context menu가 화면의 실제 셀을 대상으로 함
- Chromium 필수. Firefox/WebKit은 환경이 이미 준비된 경우 실행하고 결과를 첨부하되, 환경 미설치를 이유로 Chromium 검증을 생략하지 않는다.

## 금지되는 구현

- 테스트 assertion 삭제·완화, retry/timeout 증가만으로 통과시키기
- `sourceIndexByVisibleIndex`를 무시하고 visible index를 callback에 전달하기
- 모든 store 상태를 하나의 selector로 읽고 `React.memo`만 추가하기
- 매 render마다 JSON stringify/deep equality 수행하기
- module 전역에 Grid별 mutable cache를 두기
- props나 `BGridDataItem.values`를 직접 변경하기
- row/cell virtualization을 끄거나 테스트 데이터 규모를 줄여 지표를 맞추기
- benchmark 결과 중 좋은 실행만 선택하기
- unrelated formatting, API 추가, 디자인 변경을 같은 PR에 포함하기

## 완료 게이트

아래 항목이 모두 충족되어야 완료다.

- [ ] 제품 변경 전 기준선 SHA와 P01~P08 원시 측정 결과가 있다.
- [ ] 병목 가설, 변경 내용, 측정 결과의 인과관계가 설명되어 있다.
- [ ] 주 병목 median 15% 이상 개선 또는 구조적 비용 제거가 독립 테스트로 입증됐다.
- [ ] 비대상 시나리오 회귀 기준을 통과했다.
- [ ] 100만 행 기본 경로에서 identity 배열·Map 전체 할당이 제거됐다.
- [ ] source/visible index 계약의 모든 consumer를 검증했다.
- [ ] stable row key와 정렬·필터 rerender 회귀 테스트가 있다.
- [ ] `npm run lint`가 통과한다.
- [ ] `npm test`가 통과한다.
- [ ] `npm run test:e2e`가 통과한다.
- [ ] `npm run verify:library`가 통과한다.
- [ ] 사이트 문서를 변경했다면 `npm run verify:site`가 통과한다.
- [ ] `git diff --check`가 통과한다.
- [ ] 실패·skip·flaky test가 새로 생기지 않았다.
- [ ] bundle metrics 변경 여부를 확인했다.

## 리뷰 체크리스트

리뷰어가 특히 확인할 항목:

1. 측정 이전에 결론을 정하고 유리한 시나리오만 만든 것은 아닌가.
2. identity mapping 제거가 source index 0과 client query를 망가뜨리지 않는가.
3. memo 비교 함수가 callback 또는 renderer 변경을 무시하지 않는가.
4. stable key가 중복 rowKey에서 잘못된 DOM을 재사용하지 않는가.
5. Frozen 영역의 duplicate rendering이 상태 불일치를 만들지 않는가.
6. benchmark가 두 서버의 동일 route와 동일 fixture를 비교하는가.
7. 개발 편의를 위한 cache가 Grid unmount 후 데이터를 붙잡고 있지 않은가.
8. 성능 숫자 외에 사용자가 체감하는 스크롤·편집 정확성이 보존되는가.

## PR 제출 형식

PR 설명에 다음 순서를 그대로 사용한다.

1. **병목 가설**: 어떤 코드 경로가 왜 느린지
2. **기준선**: SHA, 환경, P01~P08 결과 표와 원시 JSON 위치
3. **변경 내용**: 파일별 역할과 공개 계약 영향
4. **개선 결과**: 동일 조건의 median/p95/worst frame/heap/DOM 비교
5. **정확성 증거**: 추가한 unit/component/E2E 목록
6. **검증 결과**: 실행한 명령, 성공/실패/skip 수
7. **위험과 롤백**: 가장 위험한 회귀와 되돌릴 단위
8. **남은 후보**: 이번 범위에서 제외한 최적화

측정 JSON과 스크린샷 또는 trace가 크면 PR artifact로 첨부하고, 저장소에는 비교 요약과 재현 명령만 커밋한다. 커밋·푸시·릴리즈는 별도 요청을 받은 경우에만 수행한다.
