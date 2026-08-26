---
title: "셀 포커스와 키보드 이동 (Cell Navigation)"
description: "활성 셀을 제어하고 방향키, Tab, Home/End, PageUp/PageDown으로 이동하며 선택과 인라인 편집을 연결합니다."
category: "interaction"
order: 20
locale: "ko"
canonicalPath: "/learn/cell-navigation"
demoId: "cell-navigation"
features: ["cellNavigationOptions", "activeCell", "keyboard-navigation", "cell-selection", "inline-editing"]
relatedGuides: ["editing", "row-selection", "focus", "accessibility-and-keyboard", "frozen-columns", "cell-merge"]
relatedApi: ["/api/props#cellnavigationoptions", "/api/props#cellselectionoptions", "/api/props#editable"]
lastReviewedAt: "2026-08-19"
indexable: true
draft: false
---

## 1. 언제 사용하나요?

마우스보다 키보드 입력이 많은 주문, 재고, 정산 화면에서는 현재 작업 중인 셀이 분명하게 보여야 하고 다음 셀로 빠르게 이동할 수 있어야 합니다. `cellNavigationOptions`는 그리드 인스턴스별 활성 셀과 이동 정책을 설정합니다.

위 라이브 데모에서 셀을 클릭한 뒤 방향키를 눌러 보세요. 고정 컬럼과 스크롤 영역을 오갈 때도 같은 절대 컬럼 인덱스를 사용하며, 화면 밖 셀로 이동하면 그리드 내부 스크롤이 자동으로 따라갑니다.

---

## 2. 지원 키

| 키 입력 | 동작 |
|---|---|
| <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> | 인접 셀로 이동 |
| <kbd>Shift</kbd> + 방향키 | 활성 셀을 이동하며 선택 범위 확장 |
| <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + 방향키 | 현재 행 또는 컬럼의 경계로 이동 |
| <kbd>Home</kbd> / <kbd>End</kbd> | 현재 행의 첫 번째/마지막 컬럼으로 이동 |
| <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>Home</kbd>/<kbd>End</kbd> | 그리드의 첫 번째/마지막 셀로 이동 |
| <kbd>PageUp</kbd> / <kbd>PageDown</kbd> | 현재 viewport 높이를 기준으로 페이지 이동 |
| <kbd>Tab</kbd> / <kbd>Shift</kbd> + <kbd>Tab</kbd> | 다음/이전 셀로 이동 |
| <kbd>Enter</kbd> | 편집 가능한 셀이면 편집을 시작하고, 그 외에는 현재 셀의 `onClick` 콜백 실행 |
| <kbd>Space</kbd> | 현재 셀의 `onClick` 콜백 실행 |
| <kbd>F2</kbd> | 편집 가능한 활성 셀에서 편집 시작 |
| <kbd>Escape</kbd> | 편집 취소 또는 셀 선택 해제 |

`input`, `textarea`, `select`, `button`, `contenteditable` 요소가 이벤트 대상이면 그리드 단축키가 입력을 가로채지 않습니다. 커스텀 편집기는 필요한 키를 자체적으로 처리하고 `handleSave`, `handleCancel`, `handleMove`를 호출해야 합니다.

---

## 3. 기본값과 제어형 상태

초기 셀만 지정하려면 `defaultActiveCell`을 사용합니다.

```tsx
<BGrid
  width={800}
  height={420}
  columns={columns}
  data={data}
  cellNavigationOptions={{
    defaultActiveCell: { rowIndex: 0, columnIndex: 0 },
    wrap: false,
    editOnEnter: true,
    keyRepeat: { interval: 16 },
  }}
/>
```

외부 화면 상태와 활성 셀을 연결하려면 `activeCell`과 `onActiveCellChange`를 함께 전달합니다. 제어형 모드에서는 콜백으로 받은 값을 다시 전달하기 전까지 화면의 활성 셀이 바뀌지 않습니다.

```tsx
const [activeCell, setActiveCell] = useState({ rowIndex: 0, columnIndex: 1 });

<BGrid
  width={800}
  height={420}
  columns={columns}
  data={data}
  cellNavigationOptions={{
    activeCell,
    onActiveCellChange: cell => {
      if (cell) setActiveCell(cell);
    },
    wrap: true,
  }}
/>
```

데이터나 컬럼 수가 줄어 활성 셀이 범위를 벗어나면 현재 마지막 유효 셀로 보정됩니다. 빈 데이터에서는 활성 셀이 해제되고 데이터가 다시 생기면 제어값 또는 기본값을 기준으로 복원됩니다.

---

## 4. 선택·병합·편집과의 관계

- 셀 선택은 기본 활성화됩니다. 필요하지 않으면 `cellSelectionOptions={{ enabled: false }}`로 끌 수 있으며, 키보드 포커스 이동은 독립적으로 계속 사용할 수 있습니다.
- `Shift` + 방향키는 `cellSelectionOptions.enabled`가 활성화된 경우에만 범위를 만듭니다.
- 병합 컬럼으로 이동하면 병합 그룹의 첫 행이 활성 셀이 됩니다. 좌우로 병합 셀을 통과할 때는 진입 전 행을 유지하고, 위아래 이동은 현재 병합 그룹을 건너 다음 그룹으로 진행합니다.
- `editable`과 커스텀 `itemRender`를 사용하면 <kbd>F2</kbd> 또는 <kbd>Enter</kbd>로 편집을 시작할 수 있습니다.
- `editOnEnter: false`이면 편집 가능한 셀에서도 <kbd>Enter</kbd>가 편집을 시작하지 않고 현재 셀의 `onClick` 콜백을 실행합니다.
- 방향키를 길게 누르면 첫 운영체제 반복 이벤트부터 프레임 동기화 반복으로 전환됩니다. `keyRepeat.interval`로 이동 간격(ms)을 조정하고, 운영체제 기본 반복 속도를 유지하려면 `keyRepeat.enabled: false`를 사용합니다.
- 읽기 전용 셀에서는 <kbd>Enter</kbd>와 <kbd>Space</kbd>가 마우스 클릭과 같은 `BGridProps.onClick` 인자를 전달합니다. 활성 셀은 이동하지 않으므로 위아래 이동에는 방향키를 사용합니다.
- `wrap: true`이면 방향키와 Tab 이동이 그리드 경계를 넘어 반대쪽 끝으로 순환합니다.

셀 포커스는 행 강조용 `selectedRowKey`와 별개의 상태입니다. 행과 상세 화면을 연결하려면 [포커스 및 선택 가이드](/learn/focus), 셀 입력 구현은 [인라인 셀 편집 가이드](/learn/editing)를 함께 확인하세요.

---

## 5. 적용 전 확인 사항

- 그리드 루트에 실제 포커스가 있을 때만 키보드 이동이 동작합니다. 셀 클릭은 그리드에 포커스를 전달합니다.
- 활성 셀과 선택 영역은 현재 표시 데이터의 인덱스를 사용합니다. 정렬·필터 후 외부 상태가 특정 원본 행을 계속 가리켜야 한다면 `rowKey` 기반 애플리케이션 상태와 함께 관리하세요.
- DOM 기반 셀과 키보드 이동을 제공하지만 이것만으로 완전한 WAI-ARIA Grid 적합성을 보장하지는 않습니다. 목표 접근성 수준에 맞춰 실제 브라우저와 보조 기술로 별도 검증하세요.
