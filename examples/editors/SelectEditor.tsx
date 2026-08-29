import { t } from '../i18n';
import * as React from 'react';
import type { BGridItemRenderProps, MoveDirection } from 'beautiful-grid';
import { Select } from 'antd';

export const SelectEditor = <T,>({ editable, value, handleSave, handleCancel, handleMove }: BGridItemRenderProps<T>) => {
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
    async evt => {
      switch (evt.key) {
        case 'Tab':
          evt.preventDefault();
          if (evt.shiftKey) {
            handleSaveEdit(evt.currentTarget.value, 'prev', 'current');
          } else {
            handleSaveEdit(evt.currentTarget.value, 'next', 'current');
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

  const onBlur = React.useCallback<React.FocusEventHandler<HTMLElement>>(() => {
    handleCancelEdit();
  }, [handleCancelEdit]);

  const onSelect = React.useCallback(
    (nextValue: any) => {
      handleSaveEdit(nextValue);
    },
    [handleSaveEdit],
  );

  if (editable) {
    return (
      <div className={'editor-select-container'}>
        <Select
          variant={'borderless'}
          size={'small'}
          autoFocus
          open
          options={[
            { value: 'Y', label: t('사용', 'Used') },
            { value: 'N', label: '사용안함' },
          ]}
          defaultValue={value}
          onSelect={onSelect}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        />
      </div>
    );

    // return <EditorInput ref={inputRef} defaultValue={currentValue} onKeyUp={onKeyUp} onBlur={onBlur} />;
  }

  return <>{value}</>;
};
