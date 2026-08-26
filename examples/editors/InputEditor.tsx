import * as React from 'react';
import type { BGridItemRenderProps, MoveDirection } from 'beautiful-grid';
import { Input } from 'antd';

export const InputEditor = <T,>({ editable, value, handleSave, handleCancel, handleMove }: BGridItemRenderProps<T>) => {
  const finishedRef = React.useRef(false);

  const handleSaveEdit = React.useCallback(
    (newValue: any, columnDirection?: MoveDirection, rowDirection?: MoveDirection) => {
      if (finishedRef.current) return;
      finishedRef.current = true;

      if (value === newValue) {
        handleCancel?.();
        if (columnDirection && rowDirection) {
          handleMove?.(columnDirection, rowDirection);
        }
        return;
      }
      handleSave?.(newValue, columnDirection, rowDirection);
    },
    [value, handleCancel, handleSave, handleMove],
  );

  const handleCancelEdit = React.useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    handleCancel?.();
  }, [handleCancel]);

  const onKeyDown = React.useCallback<React.KeyboardEventHandler<HTMLInputElement>>(
    evt => {
      switch (evt.key) {
        case 'Down':
        case 'ArrowDown':
          handleSaveEdit(evt.currentTarget.value, 'current', 'next');
          break;
        case 'Up':
        case 'ArrowUp':
          handleSaveEdit(evt.currentTarget.value, 'current', 'prev');
          break;
        case 'Tab':
          evt.preventDefault();
          if (evt.shiftKey) {
            handleSaveEdit(evt.currentTarget.value, 'prev', 'current');
          } else {
            handleSaveEdit(evt.currentTarget.value, 'next', 'current');
          }
          break;
        case 'Enter':
          handleSaveEdit(evt.currentTarget.value);
          break;
        case 'Esc':
        case 'Escape':
          handleCancelEdit();
          break;
        default:
          return;
      }
    },
    [handleCancelEdit, handleSaveEdit],
  );

  const onBlur = React.useCallback<React.FocusEventHandler<HTMLInputElement>>(
    evt => {
      handleSaveEdit(evt.target.value);
    },
    [handleSaveEdit],
  );

  if (editable) {
    return (
      <div className={'editor-input-container'}>
        <Input
          variant={'borderless'}
          autoFocus
          size={'small'}
          defaultValue={value}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
        />
      </div>
    );
  }
  return <>{value}</>;
};
