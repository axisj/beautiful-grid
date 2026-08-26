import * as React from 'react';
import { useState, useEffect } from 'react';
import { AppModelColumn, BGridFilterOperator, BGridFilterParam } from '../../types';
import { useAppStore } from '../../store';

interface Props<T> {
  column: AppModelColumn<T>;
  columnId: string;
}

export function ToolboxNumberFilterSection<T>({ column, columnId }: Props<T>) {
  const dataQuery = useAppStore(s => s.dataQuery);
  const filterDrafts = useAppStore(s => s.filterDrafts);
  const setFilterDraft = useAppStore(s => s.setFilterDraft);
  const applyColumnFilter = useAppStore(s => s.applyColumnFilter);
  const clearColumnFilter = useAppStore(s => s.clearColumnFilter);

  const appliedFilter = dataQuery?.filterParams.find(f => f.columnId === columnId);
  const currentDraft = filterDrafts[columnId];

  const initialOperator: Exclude<BGridFilterOperator, 'contains'> =
    (currentDraft?.type === 'number' && currentDraft.operator) ||
    (appliedFilter?.type === 'number' && appliedFilter.operator) ||
    'gte';

  const initialValue =
    (currentDraft?.type === 'number' && currentDraft.value !== undefined ? String(currentDraft.value) : '') ||
    (appliedFilter?.type === 'number' && appliedFilter.value !== undefined ? String(appliedFilter.value) : '');

  const initialMin =
    (currentDraft?.type === 'number' && currentDraft.min !== undefined ? String(currentDraft.min) : '') ||
    (appliedFilter?.type === 'number' && appliedFilter.min !== undefined ? String(appliedFilter.min) : '');

  const initialMax =
    (currentDraft?.type === 'number' && currentDraft.max !== undefined ? String(currentDraft.max) : '') ||
    (appliedFilter?.type === 'number' && appliedFilter.max !== undefined ? String(appliedFilter.max) : '');

  const [operator, setOperator] = useState<Exclude<BGridFilterOperator, 'contains'>>(initialOperator);
  const [valStr, setValStr] = useState(initialValue);
  const [minStr, setMinStr] = useState(initialMin);
  const [maxStr, setMaxStr] = useState(initialMax);

  const isBetween = operator === 'between';
  const minNum = minStr.trim() !== '' ? Number(minStr) : undefined;
  const maxNum = maxStr.trim() !== '' ? Number(maxStr) : undefined;
  const valNum = valStr.trim() !== '' ? Number(valStr) : undefined;

  const isBetweenInvalid =
    isBetween && minNum !== undefined && maxNum !== undefined && !Number.isNaN(minNum) && !Number.isNaN(maxNum) && minNum > maxNum;

  useEffect(() => {
    let draftParam: BGridFilterParam | undefined;

    if (isBetween) {
      if (minNum !== undefined && maxNum !== undefined && !Number.isNaN(minNum) && !Number.isNaN(maxNum) && !isBetweenInvalid) {
        draftParam = {
          columnId,
          key: column.key,
          type: 'number',
          operator: 'between',
          min: minNum,
          max: maxNum,
        };
      }
    } else {
      if (valNum !== undefined && !Number.isNaN(valNum)) {
        draftParam = {
          columnId,
          key: column.key,
          type: 'number',
          operator,
          value: valNum,
        };
      }
    }

    setFilterDraft(columnId, draftParam);
  }, [column.key, columnId, isBetween, isBetweenInvalid, maxNum, minNum, operator, setFilterDraft, valNum]);

  const isValid = isBetween
    ? minNum !== undefined && maxNum !== undefined && !Number.isNaN(minNum) && !Number.isNaN(maxNum) && !isBetweenInvalid
    : valNum !== undefined && !Number.isNaN(valNum);

  const handleApply = () => {
    if (!isValid) return;
    applyColumnFilter(columnId);
  };

  const handleClear = () => {
    setValStr('');
    setMinStr('');
    setMaxStr('');
    clearColumnFilter(columnId);
  };

  const handleApplyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;

    e.preventDefault();
    e.stopPropagation();
    handleApply();
  };

  return (
    <div className="bgrid-toolbox-section bgrid-toolbox-number-filter-section">
      <div className="bgrid-toolbox-section-title">숫자 필터</div>

      <div className="bgrid-toolbox-form-row">
        <select
          className="bgrid-toolbox-select"
          value={operator}
          onChange={e => setOperator(e.target.value as any)}
        >
          <option value="equals">일치 (=)</option>
          <option value="notEquals">불일치 (≠)</option>
          <option value="gt">초과 (&gt;)</option>
          <option value="gte">이상 (&ge;)</option>
          <option value="lt">미만 (&lt;)</option>
          <option value="lte">이하 (&le;)</option>
          <option value="between">범위 (Between)</option>
        </select>
      </div>

      {isBetween ? (
        <div className="bgrid-toolbox-range-row">
          <input
            type="number"
            className="bgrid-toolbox-input"
            placeholder="최소값"
            value={minStr}
            onChange={e => setMinStr(e.target.value)}
            onKeyDown={handleApplyKeyDown}
          />
          <span className="bgrid-toolbox-range-separator">~</span>
          <input
            type="number"
            className="bgrid-toolbox-input"
            placeholder="최대값"
            value={maxStr}
            onChange={e => setMaxStr(e.target.value)}
            onKeyDown={handleApplyKeyDown}
          />
        </div>
      ) : (
        <div className="bgrid-toolbox-form-row">
          <input
            type="number"
            className="bgrid-toolbox-input"
            placeholder="숫자 입력..."
            value={valStr}
            onChange={e => setValStr(e.target.value)}
            onKeyDown={handleApplyKeyDown}
          />
        </div>
      )}

      {isBetweenInvalid && (
        <div className="bgrid-toolbox-error-text">최소값이 최대값보다 클 수 없습니다.</div>
      )}

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
          disabled={!isValid}
          onClick={handleApply}
        >
          적용
        </button>
      </div>
    </div>
  );
}
