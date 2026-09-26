---
title: "Custom Plugin Guide"
description: "Learn how to build custom editor plugins with the defineEditorPlugin API to integrate internal design systems or custom input components with BeautifulGrid."
category: "interaction"
order: 4
locale: "en"
canonicalPath: "/en/plugins/custom"
features: ["editor-plugin", "defineEditorPlugin", "custom-plugin", "portal", "clipboard"]
relatedGuides: ["editor-plugins", "built-in-editors", "lookup-editor", "editing"]
relatedApi: ["/en/api/props#columns", "/en/api/props#editable"]
lastReviewedAt: "2026-09-26"
indexable: true
draft: false
---

In addition to built-in editors and official integrations, BeautifulGrid provides the `defineEditorPlugin` API so developers can build **custom editor plugins** tailored to their application requirements.

Whether connecting an in-house design system, asynchronous remote search autocompletes, modal lookup dialogs, or composite multi-column updates, custom plugins follow the same robust lifecycle contract as official packages.

## Architecture and Core Principles

Editor plugins in BeautifulGrid integrate closely with virtual scrolling, keyboard cell navigation, clipboard copy/paste, and theme CSS variables.

Follow these three core principles when authoring a plugin:

1. **Single Terminal Action**: When editing finishes successfully, call `commit(changes)`. When editing is aborted, call `cancel()`. Guard against calling either function multiple times or calling `cancel` after `commit`.
2. **Portal Container Integration (`getPortalContainer`)**: Floating UI elements such as dropdown menus, popovers, or calendar pickers must render inside the DOM node returned by `getPortalContainer()`, never directly into `document.body`. This guarantees correct scroll tracking, outside-click detection, and theme inheritance.
3. **Array-Based Commit Changes**: Even when updating a single cell value, pass an array of changes: `commit([{ key: column.key, value: nextValue }])`. This allows multi-field atomic updates when necessary.

---

## 1. `defineEditorPlugin` API Structure

Plugins are defined using the `defineEditorPlugin<T>()` helper function.

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
  // Additional plugin-specific options...
}

export function createMyCustomEditorPlugin<T>(
  options: MyEditorOptions,
): BGridPluginEditorConfig<T> {
  return defineEditorPlugin<T>({
    id: options.id,
    component: MyEditorComponent,
    getClipboardText: (params: BGridCellClipboardTextParams<T>) => {
      // Returns plain text representation when copying cells
      return String(params.value ?? '');
    },
    parseClipboardText: (text: string, params: BGridCellClipboardParseParams<T>) => {
      // Parses and validates plain text during paste operations
      return text.trim();
    },
  });
}
```

### Plugin Configuration Fields

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string` | **Required** | Unique identifier for the plugin. Used for caching and deduplication. |
| `component` | `React.ComponentType<BGridEditorPluginProps<T>>` | **Required** | The React component rendered inside the active editing cell. |
| `getClipboardText` | `(params: BGridCellClipboardTextParams<T>) => string \| any` | Optional | Custom serializer returning text for clipboard copy operations. |
| `parseClipboardText` | `(text: string, params: BGridCellClipboardParseParams<T>) => unknown` | Optional | Custom deserializer validating text pasted into the cell. Throw an error to reject invalid input safely. |

---

## 2. Editor Component Props (`BGridEditorPluginProps<T>`)

The editor component receives the following props from the Grid engine:

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

| Prop | Type | Description |
| --- | --- | --- |
| `value` | `unknown` | Current raw value of the editing cell. |
| `column` | `BGridColumn<T>` | Column definition object containing `key`, `label`, etc. |
| `commit` | `(changes: readonly BGridCellValueChange<T>[], options?: { move?: 'up' \| 'down' \| 'left' \| 'right' }) => Promise<void>` | Commits changes and closes the editor. Accepts an optional target direction to move focus after saving. |
| `cancel` | `() => void` | Aborts editing, restores the previous value, and closes the editor. |
| `getPortalContainer` | `() => HTMLElement` | Returns the designated DOM container for floating popups and dropdowns. |
| `move` | `(direction: 'up' \| 'down' \| 'left' \| 'right') => void` | Triggers active cell navigation without committing custom edits. |
| `mode` | `'preserve' \| 'replace'` | `'preserve'` when activated via double-click, F2, or Enter; `'replace'` when initiated by typing a character. |
| `activation` | `BGridCellEditActivation` | Activation trigger source (`'dblclick'`, `'enter'`, `'character'`, `'api'`). |
| `index` | `number` | Rendered row index. |
| `item` | `BGridDataItem<T>` | Wrapped row item wrapper (`item.values` holds the underlying record). |
| `values` | `T` | Current complete row data record. |
| `sessionId` | `number` | Unique identifier for the current editing session. |

---

## 3. Practical Example 1: In-House Custom Select Plugin

The standard pattern for wrapping a custom popover or select dropdown:

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

    // Prevent duplicate terminal calls
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

## 4. Practical Example 2: Remote Async Autocomplete

An autocomplete editor querying a remote API with debounced user input:

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

    // Debounced search
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
          placeholder="Search user..."
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

## 5. Practical Example 3: Modal Lookup Dialog with Multi-Column Commit

When picking a record in a search modal needs to update **multiple columns at once**, provide multiple entries in the `commit` array:

```tsx
function CustomerLookupEditor({
  values,
  commit,
  cancel,
}: BGridEditorPluginProps<Order>) {
  const [modalOpen, setModalOpen] = React.useState(true);

  const handleSelectCustomer = (customer: Customer) => {
    // Atomically commit updates to 3 fields in the current row
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

For a full interactive example, see the [Lookup Editor Guide](/en/learn/lookup-editor).

---

## 6. Clipboard Copy & Paste Integration

Control how values are serialized to plain text on copy, and deserialized on paste:

```tsx
const customDatePlugin = defineEditorPlugin<Order>({
  id: 'order-date',
  component: CustomDateEditor,

  // 1. On Copy: Format dates as YYYY-MM-DD strings
  getClipboardText: ({ value }) => {
    if (!value) return '';
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value);
  },

  // 2. On Paste: Validate text format before storing
  parseClipboardText: (text) => {
    const trimmed = text.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      // Throwing an error preserves the existing cell value
      // and reports parseValueFailed via onPasteError.
      throw new Error(`Invalid date format: ${text}`);
    }
    return trimmed;
  },
});
```

---

## Authoring Best Practices Checklist

| Checkpoint | Recommendation |
| --- | --- |
| **Terminal Cleanliness** | Call either `commit` or `cancel` exactly once. Guard against duplicate unmount calls with a ref. |
| **Portal Destination** | Always render floating popups inside `getPortalContainer()`, never `document.body`. |
| **Autofocus** | Focus the primary input element on mount. |
| **Escape Key** | Prevent event propagation and call `cancel()` on <kbd>Escape</kbd>. |
| **Tab/Enter Key** | Call `commit()`, optionally passing `{ move: 'right' }` on <kbd>Enter</kbd> or <kbd>Tab</kbd>. |
| **Clipboard Safety** | Throw an Error in `parseClipboardText` on malformed inputs to avoid corrupting existing cell values. |
