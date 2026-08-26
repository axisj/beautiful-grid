import * as React from 'react';
import { useState, useEffect } from 'react';
import { AppModelColumn, BGridFilterParam } from '../../types';
import { useAppStore } from '../../store';

interface Props<T> {
  column: AppModelColumn<T>;
  columnId: string;
}

export function ToolboxTextFilterSection<T>({ column, columnId }: Props<T>) {
  const dataQuery = useAppStore(s => s.dataQuery);
  const filterDrafts = useAppStore(s => s.filterDrafts);
  const setFilterDraft = useAppStore(s => s.setFilterDraft);
  const applyColumnFilter = useAppStore(s => s.applyColumnFilter);
  const clearColumnFilter = useAppStore(s => s.clearColumnFilter);

  const appliedFilter = dataQuery?.filterParams.find(f => f.columnId === columnId);
  const currentDraft = filterDrafts[columnId];

  const initialOperator =
    (currentDraft?.type === 'text' && currentDraft.operator) ||
    (appliedFilter?.type === 'text' && appliedFilter.operator) ||
    'contains';

  const initialValue =
    (currentDraft?.type === 'text' && currentDraft.value) ||
    (appliedFilter?.type === 'text' && appliedFilter.value) ||
    '';

  const [operator, setOperator] = useState<'contains' | 'equals' | 'notEquals'>(initialOperator);
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const draftParam: BGridFilterParam = {
      columnId,
      key: column.key,
      type: 'text',
      operator,
      value,
    };
    setFilterDraft(columnId, draftParam);
  }, [column.key, columnId, operator, setFilterDraft, value]);

  const handleApply = () => {
    if (!value.trim()) {
      clearColumnFilter(columnId);
    } else {
      applyColumnFilter(columnId);
    }
  };

  const handleClear = () => {
    setValue('');
    clearColumnFilter(columnId);
  };

  const handleApplyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;

    e.preventDefault();
    e.stopPropagation();
    handleApply();
  };

  return (
    <div className="bgrid-toolbox-section bgrid-toolbox-text-filter-section">
      <div className="bgrid-toolbox-section-title">텍스트 필터</div>

      <div className="bgrid-toolbox-form-row">
        <select
          className="bgrid-toolbox-select"
          value={operator}
          onChange={e => setOperator(e.target.value as any)}
        >
          <option value="contains">포함</option>
          <option value="equals">일치</option>
          <option value="notEquals">불일치</option>
        </select>
      </div>

      <div className="bgrid-toolbox-form-row">
        <input
          type="text"
          className="bgrid-toolbox-input"
          placeholder="검색어 입력..."
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleApplyKeyDown}
        />
      </div>

      <div className="bgrid-toolbox-button-row">
        <button
          type="button"
          className="bgrid-toolbox-btn bgrid-toolbox-btn-clear"
          onClick={handleClear}
        >
          초기화
        </button>
        <button
          type="button"
          className="bgrid-toolbox-btn bgrid-toolbox-btn-apply"
          onClick={handleApply}
        >
          적용
        </button>
      </div>
    </div>
  );
}
