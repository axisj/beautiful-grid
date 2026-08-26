import * as React from 'react';
import { ColorPicker } from 'antd';
import type { BGridEditorPluginProps, BGridPluginEditorConfig } from 'beautiful-grid';
import { defineEditorPlugin } from 'beautiful-grid/editors';
import './antdEditorPlugins.css';

interface Options {
  id: string;
  ariaLabel: string;
  fallbackColor?: string;
}

export function createAntdColorPickerEditorPlugin<T>(options: Options): BGridPluginEditorConfig<T> {
  function AntdColorPickerEditor({
    value,
    column,
    commit,
    cancel,
    getPortalContainer,
  }: BGridEditorPluginProps<T>) {
    const initialColor = typeof value === 'string' && value ? value : options.fallbackColor ?? '#1677ff';
    const [color, setColor] = React.useState(initialColor);
    const [open, setOpen] = React.useState(true);

    return (
      <ColorPicker
        aria-label={options.ariaLabel}
        defaultValue={initialColor}
        disabledAlpha
        format='hex'
        getPopupContainer={getPortalContainer}
        open={open}
        rootClassName='bgrid-antd-editor-popup'
        onChange={(nextColor, cssColor) => setColor(cssColor || nextColor.toHexString())}
        onChangeComplete={nextColor =>
          void commit([{ key: column.key, value: nextColor.toHexString().toUpperCase() }])
        }
        onOpenChange={nextOpen => {
          setOpen(nextOpen);
          if (!nextOpen) cancel();
        }}
      >
        <button
          type='button'
          autoFocus
          className='bgrid-antd-color-editor'
          aria-label={options.ariaLabel}
          onKeyDown={event => {
            if (event.key === 'Escape' || event.key === 'Esc') {
              event.preventDefault();
              cancel();
            }
          }}
        >
          <span className='bgrid-antd-color-value'>{color.toUpperCase()}</span>
          <span className='bgrid-color-swatch' style={{ backgroundColor: color }} aria-hidden='true' />
        </button>
      </ColorPicker>
    );
  }

  AntdColorPickerEditor.displayName = `AntdColorPickerEditor(${options.id})`;
  return defineEditorPlugin<T>({
    id: options.id,
    component: AntdColorPickerEditor,
  });
}
