import * as React from 'react';
import { AppModelColumn, BGridToolboxConfig } from '../../types';
import { useAppStore } from '../../store';

interface Props<T> {
  column: AppModelColumn<T>;
  columnId: string;
  columnIndex: number;
  config: BGridToolboxConfig<T>;
  close: () => void;
}

export function ToolboxCustomSection<T>({ column, columnId, columnIndex, config, close }: Props<T>) {
  if (config.render) {
    const CustomRender = config.render;
    return (
      <div className="bgrid-toolbox-custom-content">
        <CustomRender
          column={column}
          columnId={columnId}
          columnIndex={columnIndex}
          close={close}
        />
      </div>
    );
  }

  if (config.extraItems && config.extraItems.length > 0) {
    return (
      <div className="bgrid-toolbox-section bgrid-toolbox-custom-section">
        <div className="bgrid-toolbox-section-title">추가 메뉴</div>
        <div className="bgrid-toolbox-menu-list">
          {config.extraItems.map(item => (
            <button
              key={item.id}
              type="button"
              className="bgrid-toolbox-menu-item"
              disabled={item.disabled}
              onClick={() => {
                item.onClick({ column, columnId, columnIndex });
                close();
              }}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
