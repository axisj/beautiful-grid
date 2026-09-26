---
title: "플러그인 제작 가이드 (Custom Plugin Guide)"
description: "defineEditorPlugin API를 사용하여 사내 디자인 시스템이나 커스텀 컴포넌트를 BeautifulGrid와 연결하는 플러그인 제작 방법을 설명합니다."
category: "interaction"
order: 4
locale: "ko"
canonicalPath: "/plugins/custom"
features: ["editor-plugin", "defineEditorPlugin", "custom-plugin", "portal", "clipboard"]
relatedGuides: ["editor-plugins", "built-in-editors", "lookup-editor", "editing"]
relatedApi: ["/api/props#columns", "/api/props#editable"]
lastReviewedAt: "2026-09-26"
indexable: true
draft: false
---

BeautifulGrid는 내장 에디터와 공식 플러그인 외에도, 개발자가 애플리케이션의 고유한 요구사항에 맞춰 **커스텀 에디터 플러그인**을 직접 제작할 수 있는 `defineEditorPlugin` API를 제공합니다.

사내 디자인 시스템(In-house Design System) 컴포넌트, 비동기 API 검색 자동완성, 모달 팝업 조회창, 여러 컬럼을 동시에 갱신하는 복합 에디터까지 동일한 수명주기 계약에 따라 일관되게 구현할 수 있습니다.

## 플러그인 아키텍처와 핵심 원칙

BeautifulGrid의 에디터 플러그인은 그리드의 가상 스크롤, 포커스 이동, 클립보드 복사/붙여넣기, 테마 CSS 변수와 긴밀하게 연동됩니다.

플러그인을 제작할 때 지켜야 할 세 가지 핵심 원칙은 다음과 같습니다.

1. **단일 종료 호출 (Single Terminal Action)**: 편집이 완료되면 `commit(changes)`을, 취소되면 `cancel()`을 호출합니다. 두 함수를 중복 호출하거나 종료 후 추가 호출을 하지 않도록 방어 로직을 구성합니다.
2. **포털 컨테이너 연결 (`getPortalContainer`)**: 드롭다운, 팝오버, 캘린더 등 플로팅 UI는 `document.body`가 아닌 Grid가 제공하는 `getPortalContainer()` 안에 렌더링해야 스크롤 추적, 바깥 클릭 판정, 테마 상속이 정상 작동합니다.
3. **배열 기반 변경 커밋**: 단일 셀 값을 저장할 때도 `commit([{ key: column.key, value: nextValue }])`와 같이 항상 길이 1 이상의 변경 배열을 전달합니다. (다중 컬럼을 한 번에 변경할 수도 있습니다.)

---

## 1. `defineEditorPlugin` API 구조

플러그인은 `defineEditorPlugin<T>()` 헬퍼 함수로 정의합니다.

```tsx
import { defineEditorPlugin } from 'beautiful-grid/editors';
import type {
  BGridEditorPluginProps,
  BGridPluginEditorConfig,
  BGridCellClipboardTextParams,
  BGridCellClipboardParseParams,
} from 'beautiful-grid';

export interface MyEditorOptions {
  id: string;
  ariaLabel?: string;
  // 플러그인에 필요한 추가 옵션들...
}

export function createMyCustomEditorPlugin<T>(
  options: MyEditorOptions,
): BGridPluginEditorConfig<T> {
  return defineEditorPlugin<T>({
    id: options.id,
    component: MyEditorComponent,
    getClipboardText: (params: BGridCellClipboardTextParams<T>) => {
      // 복사 시 클립보드 텍스트 반환
      return String(params.value ?? '');
    },
    parseClipboardText: (text: string, params: BGridCellClipboardParseParams<T>) => {
      // 붙여넣기 시 텍스트 파싱 및 유효성 검증
      return text.trim();
    },
  });
}
```

### 플러그인 설정 필드

| 속성 | 타입 | 필수 여부 | 설명 |
| --- | --- | --- | --- |
| `id` | `string` | **필수** | 플러그인의 고유 식별자. 동일 컬럼/인스턴스 간 식별에 사용됩니다. |
| `component` | `React.ComponentType<BGridEditorPluginProps<T>>` | **필수** | 편집 모드 활성화 시 셀 위치에 마운트되는 React 컴포넌트입니다. |
| `getClipboardText` | `(params: BGridCellClipboardTextParams<T>) => string \| any` | 선택 | 셀을 복사할 때 클립보드에 들어갈 텍스트를 반환합니다. 라벨 표시나 객체 직렬화에 활용합니다. |
| `parseClipboardText` | `(text: string, params: BGridCellClipboardParseParams<T>) => unknown` | 선택 | 클립보드 텍스트를 붙여넣을 때 해당 셀 데이터 타입으로 역직렬화합니다. 부적절한 값이면 `throw`하여 붙여넣기 실패(`parseValueFailed`)로 안전하게 처리합니다. |

---

## 2. 에디터 컴포넌트 Props (`BGridEditorPluginProps<T>`)

플러그인 컴포넌트는 그리드 엔진으로부터 다음 props를 전달받습니다.

```tsx
function MyEditorComponent<T>({
  value,
  column,
  commit,
  cancel,
  getPortalContainer,
  move,
  mode,
  activation,
}: BGridEditorPluginProps<T>) {
  // ...
}
```

| Prop | 타입 | 설명 |
| --- | --- | --- |
| `value` | `unknown` | 현재 편집 대상 셀의 원본 값입니다. |
| `column` | `BGridColumn<T>` | 현재 셀이 속한 컬럼 정의 객체입니다 (`column.key` 등 포함). |
| `commit` | `(changes: readonly BGridCellValueChange<T>[], options?: { move?: 'up' \| 'down' \| 'left' \| 'right' }) => Promise<void>` | 변경 사항을 적용하고 편집을 완료합니다. 저장 후 포커스 이동 방향을 `options.move`로 지정할 수 있습니다. |
| `cancel` | `() => void` | 변경을 취소하고 원본 값을 복원한 뒤 편집 모드를 닫습니다. |
| `getPortalContainer` | `() => HTMLElement` | 그리드가 마운트된 컨텍스트의 팝업/포털 전용 DOM 컨테이너를 반환합니다. |
| `move` | `(direction: 'up' \| 'down' \| 'left' \| 'right') => void` | 현재 셀 편집을 종료하지 않고 인접 셀로 포커스를 이동할 때 사용합니다. |
| `mode` | `'preserve' \| 'replace'` | 더블클릭이나 F2로 진입하면 `'preserve'`, 알파벳/숫자 키를 바로 입력하여 편집을 시작했다면 `'replace'`입니다. |
| `activation` | `BGridCellEditActivation` | 편집 진입 경로 (`'dblclick'`, `'enter'`, `'character'`, `'api'` 등)를 나타냅니다. |
| `index` | `number` | 행의 렌더링 인덱스입니다. |
| `item` | `BGridDataItem<T>` | 래핑된 행 데이터 객체입니다 (`item.values`로 실제 레코드에 접근). |
| `values` | `T` | 현재 행 전체 데이터 객체입니다. |
| `sessionId` | `number` | 현재 편집 세션의 고유 번호입니다. |

---

## 3. 실전 예제 1: 사내 커스텀 드롭다운 플러그인

아래는 사내 디자인 시스템의 팝오버 드롭다운이나 자체 구현 셀렉트를 플러그인으로 만드는 표준 패턴입니다.

```tsx
import * as React from 'react';
import { createPortal } from 'react-dom';
import { defineEditorPlugin } from 'beautiful-grid/editors';
import type { BGridEditorPluginProps, BGridPluginEditorConfig } from 'beautiful-grid';

export interface Option<V extends string | number> {
  value: V;
  label: React.ReactNode;
}

export interface CustomSelectPluginOptions<V extends string | number> {
  id: string;
  options: Option<V>[];
  ariaLabel?: string;
}

export function createCustomSelectPlugin<T, V extends string | number = string>(
  pluginOptions: CustomSelectPluginOptions<V>,
): BGridPluginEditorConfig<T> {
  function CustomSelectEditor({
    value,
    column,
    commit,
    cancel,
    getPortalContainer,
  }: BGridEditorPluginProps<T>) {
    const [open, setOpen] = React.useState(true);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const hasFinishedRef = React.useRef(false);

    // 완료 또는 취소 시 중복 호출 방지
    const handleCommit = (selectedValue: V) => {
      if (hasFinishedRef.current) return;
      hasFinishedRef.current = true;
      void commit([{ key: column.key, value: selectedValue }]);
    };

    const handleCancel = () => {
      if (hasFinishedRef.current) return;
      hasFinishedRef.current = true;
      cancel();
    };

    // 키보드 조작 (Escape: 취소)
    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleCancel();
      }
    };

    return (
      <div className="custom-select-editor-cell" onKeyDown={handleKeyDown}>
        <span className="current-preview">{String(value ?? '')}</span>

        {open &&
          createPortal(
            <div
              ref={containerRef}
              className="custom-select-portal-menu"
              role="listbox"
              aria-label={pluginOptions.ariaLabel}
            >
              {pluginOptions.options.map(opt => (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={opt.value === value}
                  className={`custom-select-option ${opt.value === value ? 'selected' : ''}`}
                  onClick={() => handleCommit(opt.value)}
                >
                  {opt.label}
                </div>
              ))}
            </div>,
            getPortalContainer(),
          )}
      </div>
    );
  }

  return defineEditorPlugin<T>({
    id: pluginOptions.id,
    component: CustomSelectEditor,
    getClipboardText: ({ value }) => {
      const match = pluginOptions.options.find(o => o.value === value);
      return match ? (typeof match.label === 'string' ? match.label : String(match.value)) : String(value ?? '');
    },
    parseClipboardText: text => {
      const trimmed = text.trim();
      const match = pluginOptions.options.find(
        o => String(o.value) === trimmed || String(o.label) === trimmed,
      );
      if (match) return match.value;
      throw new Error(`Unmatched option: ${text}`);
    },
  });
}
```

---

## 4. 실전 예제 2: 원격 비동기 자동완성 (Async Autocomplete)

서버에서 사용자나 상품 목록을 검색하여 선택하는 비동기 자동완성 에디터입니다.

```tsx
import * as React from 'react';
import { createPortal } from 'react-dom';
import { defineEditorPlugin } from 'beautiful-grid/editors';
import type { BGridEditorPluginProps, BGridPluginEditorConfig } from 'beautiful-grid';

interface UserItem {
  id: string;
  name: string;
  department: string;
}

export function createAsyncUserEditorPlugin<T>(id = 'async-user-search'): BGridPluginEditorConfig<T> {
  function UserAutocompleteEditor({
    value,
    column,
    commit,
    cancel,
    mode,
    getPortalContainer,
  }: BGridEditorPluginProps<T>) {
    const [query, setQuery] = React.useState(mode === 'replace' ? '' : String(value ?? ''));
    const [results, setResults] = React.useState<UserItem[]>([]);
    const [loading, setLoading] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      inputRef.current?.focus();
    }, []);

    // 디바운스 검색
    React.useEffect(() => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      const timer = setTimeout(async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/users?q=${encodeURIComponent(query)}`);
          const data = await res.json();
          setResults(data);
        } catch {
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 250);

      return () => clearTimeout(timer);
    }, [query]);

    return (
      <div className="user-autocomplete-shell">
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Escape') cancel();
          }}
          placeholder="사용자명 검색..."
        />
        {results.length > 0 &&
          createPortal(
            <div className="user-autocomplete-dropdown">
              {results.map(user => (
                <div
                  key={user.id}
                  className="user-autocomplete-item"
                  onClick={() => {
                    void commit([{ key: column.key, value: user.name }]);
                  }}
                >
                  <strong>{user.name}</strong> ({user.department})
                </div>
              ))}
            </div>,
            getPortalContainer(),
          )}
      </div>
    );
  }

  return defineEditorPlugin<T>({
    id,
    component: UserAutocompleteEditor,
  });
}
```

---

## 5. 실전 예제 3: 모달 팝업 검색과 다중 컬럼 동시 커밋

고객이나 품목 검색 모달처럼, 한 셀에서 선택한 결과로 현재 행의 **여러 필드를 동시에 변경**해야 하는 경우 `commit` 배열에 여러 컬럼 변경 사항을 담을 수 있습니다.

```tsx
function CustomerLookupEditor({
  values,
  commit,
  cancel,
}: BGridEditorPluginProps<Order>) {
  const [modalOpen, setModalOpen] = React.useState(true);

  const handleSelectCustomer = (customer: Customer) => {
    // 3개 필드를 원자적(atomically)으로 동시 커밋
    void commit([
      { key: 'customerCode', value: customer.code },
      { key: 'customerName', value: customer.name },
      { key: 'customerGrade', value: customer.grade },
    ]);
  };

  return (
    <CustomerSearchModal
      open={modalOpen}
      initialSearch={values.customerName}
      onSelect={handleSelectCustomer}
      onClose={() => {
        setModalOpen(false);
        cancel();
      }}
    />
  );
}
```

자세한 동작 데모와 전체 코드는 [모달 팝업 조회 에디터 (Lookup Editor)](/learn/lookup-editor) 가이드에서 확인할 수 있습니다.

---

## 6. 클립보드 복사 및 붙여넣기 연동

Grid에서 셀 범위를 드래그하여 <kbd>Ctrl+C</kbd> / <kbd>Cmd+C</kbd>로 복사하거나 <kbd>Ctrl+V</kbd> / <kbd>Cmd+V</kbd>로 붙여넣을 때, 플러그인이 데이터 포맷을 직접 제어할 수 있습니다.

```tsx
const customDatePlugin = defineEditorPlugin<Order>({
  id: 'order-date',
  component: CustomDateEditor,

  // 1. 복사할 때: 객체나 Date를 YYYY-MM-DD 텍스트로 내보내기
  getClipboardText: ({ value }) => {
    if (!value) return '';
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value);
  },

  // 2. 붙여넣을 때: 텍스트를 검증하고 변환하기
  parseClipboardText: (text) => {
    const trimmed = text.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      // 형식이 올바르지 않으면 에러를 던집니다.
      // Grid는 현재 셀을 유지하고 onPasteError로 parseValueFailed를 보고합니다.
      throw new Error(`Invalid date format: ${text}`);
    }
    return trimmed;
  },
});
```

---

## 플러그인 제작 시 모범 사례 체크리스트

| 점검 항목 | 권장 사항 |
| --- | --- |
| **단일 종결성** | `commit`과 `cancel` 중 정확히 하나만 호출되며, 언마운트 시 중복 호출되지 않는지 확인하세요. |
| **포털 위치** | 팝업·드롭다운은 반드시 `getPortalContainer()`에 렌더링하세요. |
| **자동 포커스** | 컴포넌트 마운트 시 주 입력 엘리먼트에 `autoFocus` 또는 `focus()`가 설정되어 있는지 확인하세요. |
| **Escape 키** | <kbd>Escape</kbd> 입력 시 이벤트 전파를 막고 `cancel()`을 호출하세요. |
| **Tab/Enter 키** | <kbd>Enter</kbd>는 `commit()`, 필요에 따라 `options: { move: 'right' }`로 다음 셀 이동을 구현하세요. |
| **클립보드 검증** | 붙여넣기 시 예상치 못한 형식이 들어오면 에러를 `throw`하여 기존 데이터 손상을 방지하세요. |
