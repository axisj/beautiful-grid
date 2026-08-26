import * as React from 'react';
import { Select } from 'antd';
import type { BGridEditorPluginProps, BGridPluginEditorConfig } from 'beautiful-grid';
import { defineEditorPlugin } from 'beautiful-grid/editors';
import './antdEditorPlugins.css';

interface Option<Value extends string | number> {
  value: Value;
  label: React.ReactNode;
}

interface Options<Value extends string | number> {
  id: string;
  ariaLabel: string;
  options: Option<Value>[];
}

export function createAntdSelectEditorPlugin<T, Value extends string | number>(
  options: Options<Value>,
): BGridPluginEditorConfig<T> {
  function AntdSelectEditor({ value, column, commit, cancel, getPortalContainer }: BGridEditorPluginProps<T>) {
    const [open, setOpen] = React.useState(true);

    return (
      <Select
        aria-label={options.ariaLabel}
        autoFocus
        className='bgrid-antd-select-editor'
        classNames={{ popup: { root: 'bgrid-antd-editor-popup' } }}
        open={open}
        size='small'
        variant='borderless'
        defaultValue={value as Value}
        options={options.options}
        getPopupContainer={getPortalContainer}
        onChange={nextValue => void commit([{ key: column.key, value: nextValue }])}
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

  AntdSelectEditor.displayName = `AntdSelectEditor(${options.id})`;
  return defineEditorPlugin<T>({
    id: options.id,
    component: AntdSelectEditor,
  });
}
