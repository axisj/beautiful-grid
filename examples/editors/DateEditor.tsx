import * as React from 'react';
import type { BGridItemRenderProps, MoveDirection } from 'beautiful-grid';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

export const DateEditor = <T,>({ editable, value, handleSave, handleCancel, handleMove }: BGridItemRenderProps<T>) => {
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

  const onKeyDown = React.useCallback<React.KeyboardEventHandler<HTMLElement>>(
    evt => {
      const input = evt.currentTarget as HTMLInputElement;

      switch (evt.key) {
        case 'Down':
        case 'ArrowDown':
          handleSaveEdit(input.value, 'current', 'next');
          break;
        case 'Up':
        case 'ArrowUp':
          handleSaveEdit(input.value, 'current', 'prev');
          break;
        case 'Tab':
          evt.preventDefault();
          if (evt.shiftKey) {
            handleSaveEdit(input.value, 'prev', 'current');
          } else {
            handleSaveEdit(input.value, 'next', 'current');
          }
          break;
        case 'Enter':
          break;
        case 'Esc':
        case 'Escape':
          handleCancelEdit();
          break;
        default:
          return; // 키 이벤트를 처리하지 않는다면 종료합니다.
      }
    },
    [handleCancelEdit, handleSaveEdit],
  );

  const onSelect = React.useCallback(
    (nextValue: dayjs.Dayjs | null) => {
      handleSaveEdit(nextValue ? nextValue.format('YYYY-MM-DD') : '');
    },
    [handleSaveEdit],
  );

  if (editable) {
    const defaultValue = value ? dayjs(value) : undefined;

    return (
      <div className={'editor-date-container'}>
        <DatePicker
          autoFocus
          open
          size={'small'}
          variant={'borderless'}
          defaultValue={defaultValue}
          onChange={onSelect}
          onOpenChange={open => {
            if (!open) handleCancelEdit();
          }}
          onKeyDown={onKeyDown}
        />
      </div>
    );

    // return <EditorInput ref={inputRef} defaultValue={currentValue} onKeyUp={onKeyUp} onBlur={onBlur} />;
  }

  return <>{value}</>;
};
