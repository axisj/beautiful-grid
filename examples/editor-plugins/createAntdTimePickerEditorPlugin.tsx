import * as React from 'react';
import { TimePicker } from 'antd';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import type { BGridEditorPluginProps, BGridPluginEditorConfig } from 'beautiful-grid';
import { defineEditorPlugin } from 'beautiful-grid/editors';
import './antdEditorPlugins.css';

dayjs.extend(customParseFormat);

interface Options {
  id: string;
  ariaLabel: string;
  format?: string;
}

export function createAntdTimePickerEditorPlugin<T>(options: Options): BGridPluginEditorConfig<T> {
  function AntdTimePickerEditor({
    value,
    column,
    commit,
    cancel,
    getPortalContainer,
  }: BGridEditorPluginProps<T>) {
    const [open, setOpen] = React.useState(true);
    const format = options.format ?? 'HH:mm';
    const initialValue = typeof value === 'string' && value ? dayjs(value, format) : null;

    return (
      <TimePicker
        aria-label={options.ariaLabel}
        autoFocus
        className='bgrid-antd-time-editor'
        classNames={{ popup: { root: 'bgrid-antd-editor-popup' } }}
        defaultValue={initialValue}
        format={format}
        getPopupContainer={getPortalContainer}
        needConfirm
        open={open}
        size='small'
        variant='borderless'
        onOk={nextValue =>
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

  AntdTimePickerEditor.displayName = `AntdTimePickerEditor(${options.id})`;
  return defineEditorPlugin<T>({
    id: options.id,
    component: AntdTimePickerEditor,
  });
}
