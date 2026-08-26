import * as React from 'react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { AppModelColumn, BGridFilterParam, BGridFilterValue } from '../../types';
import { useAppStore } from '../../store';
import { getCellValueByRowKey, filterRows, normalizeValueForFilter } from '../../utils';

interface Props<T> {
  column: AppModelColumn<T>;
  columnId: string;
}

export function ToolboxValueFilterSection<T>({ column, columnId }: Props<T>) {
  const sourceData = useAppStore(s => (s.sourceData.length > 0 ? s.sourceData : s.data));
  const columns = useAppStore(s => s.columns);
  const dataQuery = useAppStore(s => s.dataQuery);
  const dataControl = useAppStore(s => s.dataControl);
  const filterDrafts = useAppStore(s => s.filterDrafts);
  const setFilterDraft = useAppStore(s => s.setFilterDraft);
  const applyColumnFilter = useAppStore(s => s.applyColumnFilter);
  const clearColumnFilter = useAppStore(s => s.clearColumnFilter);

  const filterConfig = column.filter !== false ? column.filter : undefined;
  const mode = dataControl?.mode ?? 'manual';
  const isManual = mode === 'manual';

  // Compute distinct values
  const distinctValues: BGridFilterValue[] = useMemo(() => {
    if (isManual) {
      return filterConfig?.values ?? [];
    }

    // Client mode: apply other columns' active filters except this column
    const otherFilters = (dataQuery?.filterParams ?? []).filter(f => f.columnId !== columnId);
    const candidateRows = filterRows(sourceData, columns, otherFilters);

    const seen = new Set<unknown>();
    const result: BGridFilterValue[] = [];

    for (let i = 0; i < candidateRows.length; i++) {
      const item = candidateRows[i].item;
      const rawVal = filterConfig?.getValue
        ? filterConfig.getValue(item)
        : getCellValueByRowKey(column.key, item.values);

      const normalized = normalizeValueForFilter(rawVal);

      // Skip object/array values that cannot be represented by BGridFilterValue.
      if (normalized !== null && typeof normalized === 'object') {
        continue;
      }

      const serialized = normalized as BGridFilterValue;

      if (!seen.has(serialized)) {
        seen.add(serialized);
        result.push(serialized);
      }
    }

    return result;
  }, [column.key, columnId, columns, dataQuery?.filterParams, filterConfig, isManual, sourceData]);

  // Current draft or applied filter
  const currentDraft = filterDrafts[columnId];
  const appliedFilter = dataQuery?.filterParams.find(f => f.columnId === columnId);

  // Selected values in draft
  const initialSelectedValues = useMemo(() => {
    if (currentDraft && currentDraft.type === 'values') {
      return new Set(currentDraft.values.map(v => normalizeValueForFilter(v)));
    }
    if (appliedFilter && appliedFilter.type === 'values') {
      return new Set(appliedFilter.values.map(v => normalizeValueForFilter(v)));
    }
    // Default to all selected
    return new Set(distinctValues.map(v => normalizeValueForFilter(v)));
  }, [appliedFilter, currentDraft, distinctValues]);

  const [selectedSet, setSelectedSet] = useState<Set<unknown>>(initialSelectedValues);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (currentDraft && currentDraft.type === 'values') {
      setSelectedSet(new Set(currentDraft.values.map(v => normalizeValueForFilter(v))));
    } else if (appliedFilter && appliedFilter.type === 'values') {
      setSelectedSet(new Set(appliedFilter.values.map(v => normalizeValueForFilter(v))));
    } else {
      setSelectedSet(new Set(distinctValues.map(v => normalizeValueForFilter(v))));
    }
  }, [appliedFilter, currentDraft, distinctValues]);

  useEffect(() => {
    if (searchTimeoutRef.current !== null) {
      window.clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = window.setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 150);

    return () => {
      if (searchTimeoutRef.current !== null) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const filteredDistinctValues = useMemo(() => {
    if (!debouncedSearch.trim()) return distinctValues;
    const query = debouncedSearch.trim().toLowerCase();

    return distinctValues.filter(val => {
      const displayStr =
        val === null || val === undefined
          ? '(빈 값)'
          : filterConfig?.formatValue
          ? String(filterConfig.formatValue(val))
          : String(val);

      return displayStr.toLowerCase().includes(query);
    });
  }, [debouncedSearch, distinctValues, filterConfig]);

  const handleToggleValue = (val: unknown) => {
    const next = new Set(selectedSet);
    const norm = normalizeValueForFilter(val);
    if (next.has(norm)) {
      next.delete(norm);
    } else {
      next.add(norm);
    }
    setSelectedSet(next);

    const draftParam: BGridFilterParam = {
      columnId,
      key: column.key,
      type: 'values',
      values: Array.from(next) as BGridFilterValue[],
    };
    setFilterDraft(columnId, draftParam);
  };

  const handleSelectAll = (checked: boolean) => {
    let next: Set<unknown>;
    if (checked) {
      next = new Set(distinctValues.map(v => normalizeValueForFilter(v)));
    } else {
      next = new Set();
    }
    setSelectedSet(next);

    const draftParam: BGridFilterParam = {
      columnId,
      key: column.key,
      type: 'values',
      values: Array.from(next) as BGridFilterValue[],
    };
    setFilterDraft(columnId, draftParam);
  };

  const allSelected = distinctValues.length > 0 && selectedSet.size === distinctValues.length;
  const isIndeterminate = selectedSet.size > 0 && selectedSet.size < distinctValues.length;

  const handleApply = () => {
    // If all distinct values are selected and no applied filter, treat as clear
    if (selectedSet.size === distinctValues.length) {
      clearColumnFilter(columnId);
    } else {
      const draftParam: BGridFilterParam = {
        columnId,
        key: column.key,
        type: 'values',
        values: Array.from(selectedSet) as BGridFilterValue[],
      };
      setFilterDraft(columnId, draftParam);
      applyColumnFilter(columnId);
    }
  };

  const handleClear = () => {
    clearColumnFilter(columnId);
  };

  if (isManual && distinctValues.length === 0) {
    return (
      <div className="bgrid-toolbox-section">
        <div className="bgrid-toolbox-section-title">필터</div>
        <div className="bgrid-toolbox-empty-notice">사용 가능한 값 목록이 없습니다.</div>
      </div>
    );
  }

  const maxDisplayItems = filterConfig?.maxValueListItems ?? 300;
  const isListCapped = filteredDistinctValues.length > maxDisplayItems;
  const displayItems = isListCapped
    ? filteredDistinctValues.slice(0, maxDisplayItems)
    : filteredDistinctValues;

  return (
    <div className="bgrid-toolbox-section bgrid-toolbox-values-filter-section">
      <div className="bgrid-toolbox-section-title">값 필터</div>

      <div className="bgrid-toolbox-search-box">
        <input
          type="text"
          className="bgrid-toolbox-search-input"
          placeholder="검색..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bgrid-toolbox-values-container">
        <div className="bgrid-toolbox-select-all-row">
          <label className="bgrid-toolbox-checkbox-label">
            <input
              type="checkbox"
              checked={allSelected}
              ref={el => {
                if (el) el.indeterminate = isIndeterminate;
              }}
              onChange={e => handleSelectAll(e.target.checked)}
            />
            <span>(전체 선택)</span>
          </label>
        </div>

        <div className="bgrid-toolbox-values-list">
          {displayItems.map((val, idx) => {
            const norm = normalizeValueForFilter(val);
            const isChecked = selectedSet.has(norm);
            const display =
              val === null || val === undefined ? (
                <span className="bgrid-toolbox-empty-value">(빈 값)</span>
              ) : filterConfig?.formatValue ? (
                filterConfig.formatValue(val)
              ) : (
                String(val)
              );

            return (
              <label key={idx} className="bgrid-toolbox-checkbox-label">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleValue(val)}
                />
                <span className="bgrid-toolbox-value-text">{display}</span>
              </label>
            );
          })}

          {filteredDistinctValues.length === 0 && (
            <div className="bgrid-toolbox-empty-notice">검색 결과가 없습니다.</div>
          )}

          {isListCapped && (
            <div className="bgrid-toolbox-capped-notice">
              +{filteredDistinctValues.length - maxDisplayItems}개 항목이 더 있습니다. 검색을 이용하세요.
            </div>
          )}
        </div>
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
