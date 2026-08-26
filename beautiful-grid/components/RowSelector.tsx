import * as React from 'react';
import { useAppStore } from '../store';

interface Props {
  checked?: boolean;
  isRadio?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  handleChange?: (checked: boolean) => void;
}

function RowSelector({ checked = false, isRadio, indeterminate, handleChange, disabled }: Props) {
  const itemHeight = useAppStore(s => s.itemHeight);
  const checkboxHeight = isRadio ? 15 : Math.min(15, itemHeight);
  const afterWidth = Math.max(checkboxHeight - 10, 2);
  const afterHeight = Math.max(checkboxHeight - 7, 4);
  const radioSize = checkboxHeight - 8;

  const stateClassName = [
    'bgrid-row-selector',
    isRadio ? 'bgrid-row-selector--radio' : '',
    checked && !isRadio ? 'bgrid-row-selector--checked' : '',
    checked && isRadio ? 'bgrid-row-selector--checked bgrid-row-selector--checked-radio' : '',
    indeterminate ? 'bgrid-row-selector--indeterminate' : '',
    disabled ? 'bgrid-row-selector--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={'bgrid-row-selector-container'}
      onClick={() => {
        if (disabled) return;
        handleChange?.(!checked);
      }}
    >
      <div
        role={isRadio ? 'radio' : 'checkbox'}
        aria-checked={indeterminate ? 'mixed' : checked}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={event => {
          if (disabled || (event.key !== ' ' && event.key !== 'Enter')) return;
          event.preventDefault();
          event.stopPropagation();
          handleChange?.(!checked);
        }}
        className={stateClassName}
        style={
          {
            width: `${checkboxHeight}px`,
            height: `${checkboxHeight}px`,
            '--bgrid-selector-after-width': `${afterWidth}px`,
            '--bgrid-selector-after-height': `${afterHeight}px`,
            '--bgrid-selector-radio-size': `${radioSize}px`,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

export default RowSelector;
