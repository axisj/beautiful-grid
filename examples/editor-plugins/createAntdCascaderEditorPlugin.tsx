import * as React from 'react';
import { Cascader } from 'antd';
import type { BGridEditorPluginProps, BGridPluginEditorConfig } from 'beautiful-grid';
import { defineEditorPlugin } from 'beautiful-grid/editors';
import './antdEditorPlugins.css';

export interface AntdCascaderOption {
  value: string;
  label: React.ReactNode;
  children?: AntdCascaderOption[];
}

interface Options {
  id: string;
  ariaLabel: string;
  options: AntdCascaderOption[];
}

export function createAntdCascaderEditorPlugin<T>(options: Options): BGridPluginEditorConfig<T> {
  function AntdCascaderEditor({
    value,
    column,
    commit,
    cancel,
    getPortalContainer,
  }: BGridEditorPluginProps<T>) {
    const [open, setOpen] = React.useState(true);
    const initialValue = Array.isArray(value) ? value.map(String) : [];

    return (
      <Cascader<AntdCascaderOption>
        aria-label={options.ariaLabel}
        autoFocus
        className='bgrid-antd-cascader-editor'
        classNames={{ popup: { root: 'bgrid-antd-editor-popup' } }}
        defaultValue={initialValue}
        getPopupContainer={getPortalContainer}
        open={open}
        options={options.options}
        size='small'
        variant='borderless'
        onChange={nextValue =>
          void commit([{ key: column.key, value: Array.from(nextValue, String) }])
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

  AntdCascaderEditor.displayName = `AntdCascaderEditor(${options.id})`;
  return defineEditorPlugin<T>({
    id: options.id,
    component: AntdCascaderEditor,
  });
}
