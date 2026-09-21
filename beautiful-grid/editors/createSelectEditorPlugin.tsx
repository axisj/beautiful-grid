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
   * Whether to allow clearing cell values by pasting empty or whitespace-only text.
   * Defaults to false (unmatched empty text throws parseValueFailed).
   * When true, pastes `emptyValue` into the cell.
   */
  allowEmpty?: boolean;
  /**
   * Value written when an empty text is pasted and `allowEmpty` is true.
   * Defaults to undefined.
   */
  emptyValue?: Value | null;
  /**
   * Whether to allow pasting options that have `disabled: true`.
   * Defaults to false (pasting a disabled option throws an error).
   */
  allowDisabledOptions?: boolean;
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

  // Precompute lookup maps for O(1) clipboard parsing and copying
  const valueMap = new Map<string, BGridSelectEditorOption<Value>>();
  const labelMap = new Map<string, BGridSelectEditorOption<Value>>();
  const valueToLabelMap = new Map<unknown, string>();
  const isNumericValue = options.options.some(opt => typeof opt.value === 'number');

  for (const opt of options.options) {
    const valKey = String(opt.value);
    if (!valueMap.has(valKey)) {
      valueMap.set(valKey, opt);
    }
    if (typeof opt.label === 'string' || typeof opt.label === 'number') {
      const labelText = String(opt.label);
      const trimmedLabel = labelText.trim();
      if (!labelMap.has(trimmedLabel)) {
        labelMap.set(trimmedLabel, opt);
      }
      if (!valueToLabelMap.has(opt.value)) {
        valueToLabelMap.set(opt.value, labelText);
      }
    }
  }

  const defaultParseClipboardText = (text: string): Value | unknown => {
    const trimmed = text.trim();

    // Check empty input
    if (trimmed === '') {
      const emptyOption =
        options.copyMode === 'value'
          ? (valueMap.get('') ?? labelMap.get(''))
          : (labelMap.get('') ?? valueMap.get(''));
      if (emptyOption) {
        if (emptyOption.disabled && !options.allowDisabledOptions) {
          throw new Error(`Disabled select option for editor "${options.id}"`);
        }
        return emptyOption.value;
      }
      if (options.allowEmpty) {
        return options.emptyValue !== undefined ? options.emptyValue : ('' as unknown as Value);
      }
    }

    // Match order depends on copyMode:
    // If copyMode is 'label' (default), match by label first, then by value.
    // If copyMode is 'value', match by value first, then by label.
    const matched =
      options.copyMode === 'value'
        ? (valueMap.get(trimmed) ?? labelMap.get(trimmed))
        : (labelMap.get(trimmed) ?? valueMap.get(trimmed));

    if (matched) {
      if (matched.disabled && !options.allowDisabledOptions) {
        throw new Error(`Disabled select option "${text}" for editor "${options.id}"`);
      }
      return matched.value;
    }

    if (options.allowCustomValue) {
      if (isNumericValue) {
        const num = Number(trimmed);
        if (!Number.isNaN(num)) {
          return num as unknown as Value;
        }
      }
      return trimmed as unknown as Value;
    }

    throw new Error(`Invalid select value "${text}" for editor "${options.id}"`);
  };

  const defaultGetClipboardText = (params: BGridCellClipboardTextParams<T>): any => {
    const { value } = params;
    if (options.copyMode === 'value') {
      return value;
    }
    const label = valueToLabelMap.get(value);
    if (label !== undefined) {
      return label;
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
