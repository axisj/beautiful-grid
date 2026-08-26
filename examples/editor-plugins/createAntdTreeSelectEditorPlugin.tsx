import * as React from 'react';
import { TreeSelect } from 'antd';
import type { BGridEditorPluginProps, BGridPluginEditorConfig } from 'beautiful-grid';
import { defineEditorPlugin } from 'beautiful-grid/editors';
import './antdEditorPlugins.css';

export interface AntdTreeSelectNode {
  value: string;
  title: React.ReactNode;
  children?: AntdTreeSelectNode[];
}

interface Options {
  id: string;
  ariaLabel: string;
  treeData: AntdTreeSelectNode[];
}

export function createAntdTreeSelectEditorPlugin<T>(options: Options): BGridPluginEditorConfig<T> {
  function AntdTreeSelectEditor({
    value,
    column,
    commit,
    cancel,
    getPortalContainer,
  }: BGridEditorPluginProps<T>) {
    const [open, setOpen] = React.useState(true);

    return (
      <TreeSelect<string, AntdTreeSelectNode>
        aria-label={options.ariaLabel}
        autoFocus
        className='bgrid-antd-tree-select-editor'
        classNames={{ popup: { root: 'bgrid-antd-editor-popup' } }}
        defaultValue={typeof value === 'string' ? value : undefined}
        getPopupContainer={getPortalContainer}
        open={open}
        size='small'
        treeData={options.treeData}
        treeDefaultExpandAll
        variant='borderless'
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

  AntdTreeSelectEditor.displayName = `AntdTreeSelectEditor(${options.id})`;
  return defineEditorPlugin<T>({
    id: options.id,
    component: AntdTreeSelectEditor,
  });
}
