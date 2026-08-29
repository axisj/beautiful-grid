---
title: "접근성 및 키보드 사용 (Accessibility & Keyboard)"
description: "최신 소스가 제공하는 셀 이동, 선택, 편집, 검색, 컨텍스트 메뉴와 행 재정렬 단축키를 기능별로 확인합니다."
category: "styling-and-accessibility"
order: 5
locale: "ko"
canonicalPath: "/learn/accessibility-and-keyboard"
features: ["accessibility", "keyboard", "cell-navigation", "row-selection", "cell-selection", "focus", "search", "context-menu", "row-reorder"]
relatedGuides: ["cell-navigation", "editing", "search", "context-menu", "row-selection", "row-reorder", "focus"]
relatedApi: ["/api/props#cellnavigationoptions", "/api/props#cellselectionoptions", "/api/props#searchoptions", "/api/props#contextmenuoptions", "/api/props#reorder", "/api/props#selectedrowkey"]
lastReviewedAt: "2026-08-29"
indexable: true
draft: false
---

## 1. 현재 제공 범위

BeautifulGrid는 Canvas가 아니라 DOM 기반 테이블 요소로 셀을 렌더링합니다. 그리드 루트는 키보드 포커스를 받을 수 있으며, 활성 셀은 시각적 테두리와 `data-bgrid-cell-active` 상태로 구분됩니다. 행 선택 컨트롤은 실제 `checkbox` 또는 `radio` 역할과 `aria-checked`, `aria-disabled` 상태를 제공합니다.

셀 이동과 선택뿐 아니라 편집, 검색, 컨텍스트 메뉴, 행 선택과 행 재정렬까지 키보드로 조작할 수 있습니다. 아래 목록은 현재 런타임의 키 이벤트 처리와 테스트를 기준으로 정리했습니다. 활성 셀의 제어형 상태 예제는 [셀 포커스와 키보드 이동 가이드](/learn/cell-navigation)에서 확인할 수 있습니다.

다만 현재 구현을 완전한 WAI-ARIA Grid 패턴 준수로 간주해서는 안 됩니다. 애플리케이션에서 요구하는 접근성 기준은 실제 사용 화면에서 스크린 리더와 키보드로 별도 검증하세요.

---

## 2. 단축키가 동작하는 조건

- `Ctrl`은 Windows/Linux, `Cmd`는 macOS의 보조 키를 뜻합니다.
- 셀 이동 단축키는 그리드 또는 그리드 내부에 포커스가 있고 `cellNavigationOptions.enabled !== false`일 때 동작합니다.
- 범위 선택·전체 선택·복사·붙여넣기는 `cellSelectionOptions.enabled: true`일 때 동작합니다. 붙여넣기는 그리드의 `editable`도 `true`여야 합니다.
- 검색은 `searchOptions`가 있고 `enabled`와 `shortcut`이 `false`가 아니어야 합니다. 컨텍스트 메뉴는 실제로 표시할 메뉴 항목, 행 재정렬은 `reorder.enabled: true`가 구성되어야 합니다.
- 그리드는 일반적인 `input`, `textarea`, `select`, `button`, `contenteditable`에서 발생한 키를 가로채지 않습니다. 단, 내장 셀 에디터는 저장·취소·이동을 위해 아래 편집 키를 직접 처리합니다.

## 3. 셀 이동과 범위 선택

| 키 | 동작 | 조건·비고 |
|---|---|---|
| 방향키 | 위·아래·왼쪽·오른쪽의 인접 셀로 이동 | 필요하면 내부 스크롤을 함께 조정합니다. `wrap: true`이면 같은 축의 반대쪽 끝으로 순환합니다. |
| Ctrl/Cmd + 방향키 | 현재 열의 첫/마지막 행 또는 현재 행의 첫/마지막 열로 이동 | `Ctrl/Cmd + ↑/↓/←/→` 각각의 축 경계로 이동합니다. |
| Home / End | 현재 행의 첫 열 / 마지막 열로 이동 | `Shift`를 함께 누르면 현재 선택 기준점부터 범위를 확장합니다. |
| Ctrl/Cmd + Home / End | 그리드의 첫 셀 / 마지막 셀로 이동 | `Shift`를 함께 누르면 그 위치까지 범위를 확장합니다. |
| PageUp / PageDown | 현재 열에서 보이는 본문 높이만큼 위 / 아래로 이동 | `Shift`를 함께 누르면 이동한 셀까지 범위를 확장합니다. |
| Tab / Shift + Tab | 다음 / 이전 셀로 이동 | 행 끝에서는 다음 행 첫 셀 또는 이전 행 마지막 셀로 이동합니다. 전체 경계 순환은 `wrap: true`일 때만 적용됩니다. |
| Shift + 방향키 | 현재 선택 기준점부터 한 셀씩 범위 확장 | 셀 범위 선택이 활성화된 경우에만 선택 영역이 만들어집니다. |
| Ctrl/Cmd + A | 모든 셀 선택 | 셀 범위 선택이 활성화되고 데이터와 열이 있을 때만 브라우저 기본 전체 선택을 막습니다. |
| Escape | 셀 범위 선택 해제 | `cellSelectionOptions.clearOnEscape !== false`일 때 동작합니다. 편집 중이면 선택보다 편집 취소가 먼저 처리됩니다. |

## 4. 셀 활성화와 편집

| 상태 | 키 | 동작 |
|---|---|---|
| 일반 셀 | Enter | 기본값으로 편집 가능한 셀의 편집을 시작합니다. `editOnEnter: false`, 읽기 전용 열 또는 읽기 전용 그리드에서는 셀 `onClick`을 실행합니다. |
| 일반 셀 | Space | 편집 상태를 바꾸지 않고 현재 셀의 `onClick`을 실행합니다. |
| 일반 셀 | F2 | 편집 가능한 현재 셀의 편집을 시작합니다. |
| 내장 텍스트·선택·날짜 에디터 | Enter | 현재 값을 저장합니다. |
| 내장 텍스트·선택·날짜 에디터 | Tab / Shift + Tab | 현재 값을 저장하고 다음 / 이전 셀로 이동합니다. |
| 내장 텍스트·선택·날짜 에디터 | Escape | 변경을 취소하고 편집을 종료합니다. |

커스텀 `itemRender`나 외부 에디터 플러그인이 자체 입력 요소를 렌더링한다면 그 요소의 키보드 동작은 구현자가 결정합니다. `itemRender`는 `handleSave`, `handleCancel`, `handleMove`를 연결해 같은 저장·취소·이동 규칙을 만들 수 있습니다.

## 5. 클립보드

| 키 | 동작 | 조건·비고 |
|---|---|---|
| Ctrl/Cmd + C | 선택된 셀을 탭과 줄바꿈으로 구분한 텍스트로 복사 | 여러 선택 범위도 행·열 순서로 정렬해 복사합니다. 열별 `getClipboardText`와 복사 제한 옵션이 적용됩니다. |
| Ctrl/Cmd + V | 활성 셀부터 표 형태 텍스트 붙여넣기 | 셀 선택과 편집이 모두 활성화되어야 합니다. 읽기 전용 열과 삭제 상태 행은 건너뛰며 컬럼의 `parseClipboardText`, text editor의 `parseValue`, `createRowOnPaste`, 붙여넣기 제한 옵션을 적용합니다. |

붙여넣기는 별도 `keydown` 단축키가 아니라 브라우저의 `paste` 이벤트를 처리합니다. Grid가 지원하는 입력 형식은 `text/plain`입니다. 이미지·파일처럼 `text/plain` 타입이 없는 클립보드는 셀 값을 빈 문자열로 바꾸지 않고 무시하며, `cellSelectionOptions.onPasteError`에 `unsupportedClipboardData`를 전달합니다. 명시적인 `text/plain` 빈 문자열은 빈 셀 값으로 붙여넣을 수 있습니다.

`text/plain`은 배열·객체·숫자·불리언·날짜의 원래 JavaScript 타입을 자동으로 복원할 수 없습니다. `getClipboardText`로 복사 문자열을 정하고 `parseClipboardText`로 그 문자열을 저장 타입으로 되돌리세요. `parseClipboardText`가 없으면 text editor의 `parseValue`를 사용하고, 둘 다 없으면 붙여넣은 문자열을 그대로 저장합니다.

병합 셀은 클립보드에서도 하나의 논리 셀입니다. 병합 셀만 복사하면 anchor 값을 한 번만 기록합니다. 병합 셀과 옆의 일반 셀을 함께 복사할 때는 TSV 행·열 정렬을 유지하도록 병합 continuation 위치를 빈 칸으로 둡니다. 붙여넣기는 하나의 값을 병합 그룹의 모든 실제 행에 같은 값 인스턴스로 적용합니다. 여러 클립보드 행이 같은 병합 셀에 도착하면 동일한 문자열은 한 번만 파싱하고, 서로 다른 문자열은 `mergedCellConflict`로 그 병합 셀 전체를 변경하지 않습니다.

## 6. 검색과 컨텍스트 메뉴

| 대상 | 키 | 동작 |
|---|---|---|
| 그리드 검색 | Ctrl/Cmd + F | 검색창을 열고 입력값을 선택합니다. 이미 열려 있어도 검색 입력으로 포커스를 이동합니다. |
| 검색 입력 | Enter / Shift + Enter | 다음 / 이전 검색 결과로 이동합니다. IME 조합 중이거나 검색 중일 때는 결과를 이동하지 않습니다. |
| 검색 입력 | Escape | 검색창을 닫고 이전 그리드 포커스를 복원합니다. |
| 활성 셀 | Context Menu 키 / Shift + F10 | 현재 셀의 컨텍스트 메뉴를 키보드 모드로 엽니다. 활성화된 메뉴 항목이 없으면 열리지 않습니다. |
| 컨텍스트 메뉴 | ↑ / ↓ | 비활성 항목과 구분선을 제외하고 이전 / 다음 항목으로 순환합니다. |
| 컨텍스트 메뉴 | Home / End | 첫 / 마지막 활성 메뉴 항목으로 이동합니다. |
| 컨텍스트 메뉴 | Enter / Space | 포커스된 메뉴 항목을 실행합니다. |
| 컨텍스트 메뉴 | Escape / Tab | 메뉴를 닫습니다. 키보드로 연 메뉴는 그리드 포커스를 복원합니다. |

## 7. 행 선택, 행 재정렬과 헤더 툴박스

| 대상 | 키 | 동작 |
|---|---|---|
| 행 선택 checkbox/radio | Space / Enter | 포커스된 행 선택 상태를 토글합니다. 비활성 행은 포커스와 토글 대상에서 제외됩니다. |
| 행 재정렬 핸들 | Space / Enter | 키보드 재정렬을 시작하고, 이동 중에는 현재 위치에 놓습니다. |
| 행 재정렬 중 | ↑ / ↓ | 놓을 행 위치를 한 칸씩 이동합니다. |
| 행 재정렬 중 | Escape | 재정렬을 취소하고 기존 선택 상태를 복원합니다. |
| 헤더 툴박스 | Tab / Shift + Tab | 열린 툴박스 안의 포커스를 순환합니다. |
| 헤더 툴박스 | ↑ / ↓ | 포커스 가능한 항목 사이를 순환합니다. 텍스트·숫자 입력과 `select`에서는 기본 방향키 동작을 유지합니다. |
| 헤더 필터 입력 | Enter | 현재 필터 값을 적용하고 툴박스를 닫습니다. |
| 헤더 툴박스 | Escape | 툴박스를 닫습니다. |

---

## 8. 적용 시 점검 목록

- `rowChecked.disabled`로 선택 불가 행을 지정하고 시각 상태와 `aria-disabled`가 함께 반영되는지 확인합니다.
- 마우스 없이 활성 셀 이동, 행 선택, 셀 범위 선택, 복사·붙여넣기와 필요한 오버레이 조작이 가능한지 실제 브라우저에서 확인합니다.
- 포커스 표시가 서비스 테마에서도 충분한 대비를 갖는지 확인합니다.
- 커스텀 `itemRender` 내부 입력 요소가 포커스 순서를 깨거나 필요한 키 이벤트를 누락하지 않는지 확인합니다. 일반 입력 요소에서는 그리드 단축키가 실행되지 않는 것이 정상입니다.
- 제어형 `activeCell`을 사용한다면 `onActiveCellChange` 값을 다시 props로 전달하는지 확인합니다.
- 서비스의 목표 접근성 수준이 높다면 자동 검사뿐 아니라 스크린 리더와 키보드 전용 사용 시나리오를 수행합니다.
