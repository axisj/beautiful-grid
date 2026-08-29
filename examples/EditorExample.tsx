import * as React from 'react';
import { BGrid } from 'beautiful-grid';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';
import useEditorGrid, { Item } from './useEditorGrid';
import { Button, Divider, Radio } from 'antd';
import { t } from './i18n';

function EditorExample() {
  const {
    columns,
    handleColumnsChange,
    list,
    handleAddList,
    checkedKeys,
    setCheckedKeys,
    selectedRowKey,
    setSelectedRowKey,
    handleRemoveList,
    handleCommitList,
    createRowOnPaste,
    handleDataChange,
  } = useEditorGrid();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width: containerWidth, height: containerHeight } = useContainerSize(containerRef);

  const [editTrigger, setEditTrigger] = React.useState<'dblclick' | 'click'>('dblclick');
  const [lastChange, setLastChange] = React.useState(t('아직 편집된 셀이 없습니다.', 'No cell has been edited yet.'));

  return (
    <div className='space-y-3'>
      <div className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700'>
        <strong className='text-slate-900'>{t('편집기 구분:', 'Editor Types:')}</strong> {t('주문 코드·고객명은 내장', 'Order Code and Customer Name use built-in')} <code>text</code>{t(', 사용 여부·납기일은 기본 제공 plugin, 우선순위는', ', Usage and Delivery Date use built-in plugin, Priority uses')} <code>defineEditorPlugin()</code>{t('으로 연결한 Ant Design plugin입니다.', ' connected Ant Design plugin.')}
        {t('text 셀에 포커스를 둔 뒤 바로 한글을 입력하거나 Enter/F2로 기존 값을 편집해 보세요.', 'Try typing directly after focusing on a text cell, or edit existing values with Enter/F2.')}
        <br />{t('여러 셀을 선택해 Ctrl/Cmd+C로 복사한 뒤 대상 셀을 선택하고 Ctrl/Cmd+V를 누르면 표 형태로 붙여넣습니다.', 'Select multiple cells, copy with Ctrl/Cmd+C, select a target cell and press Ctrl/Cmd+V to paste as a table.')} {t('읽기 전용 열과 삭제 대기 행은 자동으로 건너뛰고, 행이 부족하면 I 상태의 새 행을 추가합니다.', 'Read-only columns and rows waiting to be deleted are automatically skipped. If rows are insufficient, new rows with status I are added.')}
        <br />{t('행 번호의 I/U/D는 추가·수정·삭제 대기 상태입니다.', 'The I/U/D in row numbers mean Insert/Update/Delete pending states.')} {t('새 행은 선택 삭제 시 즉시 제거되고, 기존 행은 D로 표시된 뒤 변경 커밋 시 제거됩니다.', 'New rows are removed immediately when selected for deletion, and existing rows are marked with D and removed upon commit.')} {t('값이 바뀐 셀은 별도 편집 셀 색상으로 표시되고 커밋 시 해제됩니다.', 'Cells with changed values are displayed in a separate edited cell color, which is cleared upon commit.')}
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <span className='text-xs font-semibold text-slate-600'>{t('편집 시작', 'Start Editing')}</span>
        <Radio.Group value={editTrigger} onChange={e => setEditTrigger(e.target.value)}>
          <Radio value='click'>{t('한 번 클릭', 'Single Click')}</Radio>
          <Radio value='dblclick'>{t('두 번 클릭', 'Double Click')}</Radio>
        </Radio.Group>
        <Button size={'small'} type='primary' onClick={handleAddList}>
          {t('행 추가', 'Add Row')}
        </Button>
        <Button size={'small'} onClick={handleRemoveList}>
          {t('선택 행 삭제', 'Delete Selected Rows')}
        </Button>
        <Button size={'small'} onClick={handleCommitList}>
          {t('변경 커밋', 'Commit Changes')}
        </Button>
        <Divider type='vertical' />
        <Button
          size={'small'}
          type='default'
          onClick={() => {
            console.log('Save', JSON.stringify(list));
          }}
        >
          {t('현재 데이터 확인', 'Check Current Data')}
        </Button>
      </div>

      <DataGridContainer ref={containerRef} className={'editor-example'}>
        <BGrid<Item>
          frozenColumnIndex={2}
          showLineNumber
          width={containerWidth}
          height={containerHeight}
          data={list}
          columns={columns}
          onChangeColumns={handleColumnsChange}
          onChangeData={(ri, ci, item, _column, meta) => {
            handleDataChange(ri, item, meta);
            setLastChange(`${t('행', 'Row')} ${ri + 1}, ${t('열', 'Column')} ${(ci ?? 0) + 1}: ${JSON.stringify(item)}`);
          }}
          cellSelectionOptions={{ createRowOnPaste }}
          rowChecked={{
            // checkedIndexes: [],
            checkedRowKeys: checkedKeys,
            onChange: (ids, keys, selectedAll) => {
              // console.log('onChange rowSelection', ids, keys, selectedAll);
              setCheckedKeys(keys);
            },
          }}
          onClick={item => {
            setSelectedRowKey(item.item.uuid);
          }}
          editable
          editTrigger={editTrigger}
          rowKey={'uuid'}
          selectedRowKey={selectedRowKey}
        />
      </DataGridContainer>

      <p className='m-0 truncate text-xs text-slate-500' aria-live='polite'>
        {t('마지막 변경:', 'Last Change:')} {lastChange}
      </p>
    </div>
  );
}

export default EditorExample;
