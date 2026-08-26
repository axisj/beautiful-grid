import * as React from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import type { BGridEditorPluginProps, BGridPluginEditorConfig } from 'beautiful-grid';
import { defineEditorPlugin } from 'beautiful-grid/editors';
import './antdEditorPlugins.css';

interface Options {
  id: string;
  ariaLabel: string;
  format?: string;
  min?: string;
  max?: string;
}

export function createAntdDatePickerEditorPlugin<T>(options: Options): BGridPluginEditorConfig<T> {
  const minDate = options.min ? dayjs(options.min) : undefined;
  const maxDate = options.max ? dayjs(options.max) : undefined;

  function AntdDatePickerEditor({
    value,
    column,
    commit,
    cancel,
    getPortalContainer,
  }: BGridEditorPluginProps<T>) {
    const [open, setOpen] = React.useState(true);
    const format = options.format ?? 'YYYY-MM-DD';
    const initialValue = typeof value === 'string' && value ? dayjs(value) : null;

    return (
      <DatePicker
        aria-label={options.ariaLabel}
        autoFocus
        className='bgrid-antd-date-editor'
        classNames={{ popup: { root: 'bgrid-antd-editor-popup' } }}
        open={open}
        size='small'
        variant='borderless'
        defaultValue={initialValue}
        format={format}
        getPopupContainer={getPortalContainer}
        maxDate={maxDate}
        minDate={minDate}
        onChange={nextValue =>
          void commit([{ key: column.key, value: nextValue ? nextValue.format(format) : '' }])
        }
        onOpenChange={nextOpen => {
          setOpen(nextOpen);
          if (!nextOpen) cancel();
        }}
        onKeyDown={event => {
          if (event.key === 'Escape' || event.key === 'Esc') {
            event.preventDefault();
            cancel();
          }
        }}
      />
    );
  }

  AntdDatePickerEditor.displayName = `AntdDatePickerEditor(${options.id})`;
  return defineEditorPlugin<T>({
    id: options.id,
    component: AntdDatePickerEditor,
  });
}
