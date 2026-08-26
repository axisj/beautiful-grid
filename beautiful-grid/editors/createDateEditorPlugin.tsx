import * as React from 'react';
import { BGridEditorPluginProps, BGridPluginEditorConfig } from '../types';
import { defineEditorPlugin } from './defineEditorPlugin';
import { getColumnId } from '../utils/getColumnId';

export interface BGridDateEditorPluginOptions {
  id: string;
  min?: string;
  max?: string;
  ariaLabel?: string;
}

export function createDateEditorPlugin<T>(options: BGridDateEditorPluginOptions): BGridPluginEditorConfig<T> {
  function DateEditor({ value, column, activation, commit, cancel }: BGridEditorPluginProps<T>) {
    const dateValue = typeof value === 'string' ? value : '';
    const inputRef = React.useRef<HTMLInputElement>(null);
    const pickerOpenedRef = React.useRef(false);

    React.useLayoutEffect(() => {
      const input = inputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
      if (!input) return;

      input.focus({ preventScroll: true });
      if (activation !== 'editorIcon' || pickerOpenedRef.current || typeof input.showPicker !== 'function') return;

      pickerOpenedRef.current = true;
      try {
        input.showPicker();
      } catch {
        // Browsers without transient user activation keep the focused numeric date input usable.
      }
    }, [activation]);

    return (
      <div className='bgrid-native-date-editor-shell'>
        <input
          ref={inputRef}
          className='bgrid-native-date-editor'
          type='date'
          aria-label={options.ariaLabel ?? '셀 날짜 편집'}
          min={options.min}
          max={options.max}
          defaultValue={dateValue}
          onChange={event =>
            void commit([{ columnId: getColumnId(column), value: event.currentTarget.value }])
          }
          onKeyDown={event => {
            if (event.key === 'Escape' || event.key === 'Esc') {
              event.preventDefault();
              cancel();
              return;
            }
            if (event.key === 'Tab' || event.key === 'Enter') {
              event.preventDefault();
              void commit([{ columnId: getColumnId(column), value: event.currentTarget.value }], {
                move: event.key === 'Tab' ? (event.shiftKey ? 'prev' : 'next') : undefined,
              });
            }
          }}
        />
        <span className='bgrid-native-date-editor-icon' aria-hidden='true'>
          <svg
            width='14'
            height='14'
            viewBox='0 0 16 16'
            fill='none'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
            focusable='false'
          >
            <rect x='2.5' y='3.5' width='11' height='10' rx='1.5' />
            <path d='M5 2.5v2M11 2.5v2M2.5 6.5h11' />
          </svg>
        </span>
      </div>
    );
  }

  DateEditor.displayName = `BGridDateEditor(${options.id})`;
  return defineEditorPlugin<T>({
    id: options.id,
    component: DateEditor,
  });
}
