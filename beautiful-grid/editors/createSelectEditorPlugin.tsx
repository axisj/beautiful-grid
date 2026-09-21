import * as React from 'react';
import {
  BGridCellClipboardParseParams,
  BGridCellClipboardTextParams,
  BGridEditorPluginProps,
  BGridPluginEditorConfig,
} from '../types';
import { defineEditorPlugin } from './defineEditorPlugin';
import { getColumnId } from '../utils/getColumnId';

export interface BGridSelectEditorOption<Value extends string | number> {
  value: Value;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface BGridSelectEditorPluginOptions<Value extends string | number> {
  id: string;
  options: BGridSelectEditorOption<Value>[];
  ariaLabel?: string;
  placeholder?: string;
  openOnMount?: boolean;
  /**
   * Whether to allow pasting values that do not match any option value or label.
   * Defaults to false (unmatched values throw an error and report parseValueFailed).
   */
  allowCustomValue?: boolean;
  /**
   * Clipboard text mode when copying cells using this editor.
   * 'label' (default): copies the option's label if it is a string or number.
   * 'value': copies the option's raw value.
   */
  copyMode?: 'label' | 'value';
  /**
   * Custom clipboard parser for this editor.
   * Throw an error to reject the paste for this cell.
   */
  parseClipboardText?: <T>(text: string, params: BGridCellClipboardParseParams<T>) => Value | unknown;
  /**
   * Custom clipboard text getter for this editor.
   */
  getClipboardText?: <T>(params: BGridCellClipboardTextParams<T>) => any;
}

export function createSelectEditorPlugin<T, Value extends string | number = string>(
  options: BGridSelectEditorPluginOptions<Value>,
): BGridPluginEditorConfig<T> {
  function SelectEditor({ value, column, commit, cancel }: BGridEditorPluginProps<T>) {
    const selectedIndex = options.options.findIndex(option => Object.is(option.value, value));
    const selectRef = React.useRef<HTMLSelectElement>(null);
    const pickerOpenedRef = React.useRef(false);

    React.useLayoutEffect(() => {
      const select = selectRef.current as (HTMLSelectElement & { showPicker?: () => void }) | null;
      if (!select) return;

      select.focus({ preventScroll: true });
      if (options.openOnMount === false || pickerOpenedRef.current || typeof select.showPicker !== 'function') return;

      pickerOpenedRef.current = true;
      try {
        select.showPicker();
      } catch {
        // Some browsers require a transient user activation. The focused select remains usable.
      }
    }, []);

    return (
      <div className='bgrid-native-select-editor-shell'>
        <select
          ref={selectRef}
          className='bgrid-native-select-editor'
          aria-label={options.ariaLabel ?? '셀 선택 편집'}
          defaultValue={selectedIndex >= 0 ? String(selectedIndex) : ''}
          onChange={event => {
            const option = options.options[Number(event.currentTarget.value)];
            if (option) void commit([{ columnId: getColumnId(column), value: option.value }]);
          }}
          onKeyDown={event => {
            if (event.key === 'Escape' || event.key === 'Esc') {
              event.preventDefault();
              cancel();
              return;
            }
            if (event.key === 'Tab' || event.key === 'Enter') {
              event.preventDefault();
              if (event.currentTarget.value === '') {
                cancel();
                return;
              }
              const option = options.options[Number(event.currentTarget.value)];
              if (option) {
                void commit([{ columnId: getColumnId(column), value: option.value }], {
                  move: event.key === 'Tab' ? (event.shiftKey ? 'prev' : 'next') : undefined,
                });
              }
            }
          }}
        >
          {selectedIndex < 0 && (
            <option value='' disabled>
              {options.placeholder ?? '선택'}
            </option>
          )}
          {options.options.map((option, index) => (
            <option key={index} value={String(index)} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <span className='bgrid-native-select-editor-icon' aria-hidden='true'>
          <svg width='14' height='14' viewBox='0 0 16 16' fill='none' focusable='false'>
            <path d='m4 6 4 4 4-4' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
          </svg>
        </span>
      </div>
    );
  }

  SelectEditor.displayName = `BGridSelectEditor(${options.id})`;

  const defaultParseClipboardText = (text: string): Value | unknown => {
    const trimmed = text.trim();
    const matchedByValue = options.options.find(
      opt => String(opt.value) === trimmed || opt.value === (trimmed as unknown),
    );
    if (matchedByValue) return matchedByValue.value;

    const matchedByLabel = options.options.find(
      opt => (typeof opt.label === 'string' || typeof opt.label === 'number') && String(opt.label).trim() === trimmed,
    );
    if (matchedByLabel) return matchedByLabel.value;

    if (options.allowCustomValue) {
      return trimmed as unknown as Value;
    }

    throw new Error(`Invalid select value "${text}" for editor "${options.id}"`);
  };

  const defaultGetClipboardText = (params: BGridCellClipboardTextParams<T>): any => {
    const { value } = params;
    if (options.copyMode === 'value') {
      return value;
    }
    const matched = options.options.find(opt => Object.is(opt.value, value));
    if (matched && (typeof matched.label === 'string' || typeof matched.label === 'number')) {
      return String(matched.label);
    }
    return value;
  };

  return defineEditorPlugin<T>({
    id: options.id,
    component: SelectEditor,
    parseClipboardText: options.parseClipboardText ?? ((text, _params) => defaultParseClipboardText(text)),
    getClipboardText: options.getClipboardText ?? defaultGetClipboardText,
  });
}
