import * as React from 'react';
import { BGrid } from 'beautiful-grid';
import type { BGridColumn, BGridDataItem, BGridDataQuery } from 'beautiful-grid';
import { Collapse, ColorPicker } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createGridTheme as makeTheme, type ThemePalette } from '../../data/datagridThemePalettes';
import { alphaThemeColorTokens, themeColorGroups } from '../../data/datagridThemeTokenGroups';
import { playgroundCustomers, playgroundManagers } from './mockData';
import { PlaygroundWorkspace } from './PlaygroundWorkspace';
import type { Locale } from '../../i18n';

interface ThemeRow {
  orderNo: string;
  customer: string;
  channel: string;
  status: string;
  quantity: number;
  amount: number;
  region: string;
  deliveryMethod: string;
  orderDate: string;
  owner: string;
}

const themePresets = [
  { id: 'cloud', name: 'Cloud', palette: makeTheme({}) },
  {
    id: 'graphite',
    name: 'Graphite',
    palette: makeTheme({
      '--bgrid-primary-color': '#38bdf8',
      '--bgrid-header-bg': '#1e293b',
      '--bgrid-header-color': '#f8fafc',
      '--bgrid-header-hover-bg': '#334155',
      '--bgrid-header-group-bg': '#273549',
      '--bgrid-footer-bg': '#172033',
      '--bgrid-summary-bg': '#1d3344',
      '--bgrid-border-color-base': '#475569',
      '--bgrid-border-color-light': '#3d4b60',
      '--bgrid-border-color-subtle': '#334155',
      '--bgrid-header-separator-color': '#526176',
      '--bgrid-frozen-boundary-color': '#64748b',
      '--bgrid-row-selector-color': '#0f172a',
      '--bgrid-body-bg': '#111827',
      '--bgrid-body-color': '#dbe4ef',
      '--bgrid-body-odd-bg': '#172033',
      '--bgrid-body-hover-bg': '#243248',
      '--bgrid-body-hover-odd-bg': '#293950',
      '--bgrid-body-active-bg': '#153e5a',
      '--bgrid-cell-selected-bg': '#153e5a',
      '--bgrid-cell-selected-border-color': '#38bdf8',
      '--bgrid-selection-axis-bg': '#164e63',
      '--bgrid-selection-axis-color': '#7dd3fc',
      '--bgrid-selection-axis-border-color': '#38bdf8',
      '--bgrid-cell-edited-bg': '#422006',
      '--bgrid-cell-edited-color': '#fdba74',
      '--bgrid-cell-edited-border-color': '#ea580c',
      '--bgrid-cell-value-changed-bg': '#422006',
      '--bgrid-cell-value-changed-color': '#fdba74',
      '--bgrid-cell-value-changed-border-color': '#ea580c',
      '--bgrid-scroll-bg': '#111827',
      '--bgrid-scroll-track-bg': '#1f2937',
      '--bgrid-scroll-thumb-bg': '#64748b',
      '--bgrid-scroll-thumb-hover-bg': '#94a3b8',
      '--bgrid-scroll-corner-bg': '#475569',
      '--bgrid-scrollbar-modern-track-bg': '#1f2937',
      '--bgrid-scrollbar-modern-thumb-bg': '#64748b',
      '--bgrid-scrollbar-modern-thumb-hover-bg': '#94a3b8',
      '--bgrid-scrollbar-modern-button-hover-bg': '#334155',
      '--bgrid-scrollbar-modern-icon-color': '#94a3b8',
      '--bgrid-scrollbar-modern-gutter-bg': '#1f2937',
      '--bgrid-scrollbar-modern-gutter-border-color': '#475569',
      '--bgrid-loading-second-color': '#cbd5e1',
      '--bgrid-toolbox-bg': '#111827',
      '--bgrid-toolbox-color': '#dbe4ef',
      '--bgrid-toolbox-muted-color': '#94a3b8',
      '--bgrid-toolbox-control-bg': '#172033',
      '--bgrid-toolbox-control-color': '#dbe4ef',
      '--bgrid-toolbox-control-border-color': '#475569',
      '--bgrid-toolbox-control-placeholder-color': '#64748b',
      '--bgrid-toolbox-hover-bg': '#243248',
      '--bgrid-toolbox-active-bg': '#153e5a',
      '--bgrid-toolbox-danger-color': '#fda4af',
      '--bgrid-toolbox-danger-bg': '#4c1d2a',
      '--bgrid-toolbox-button-bg': '#1e293b',
      '--bgrid-toolbox-primary-hover-color': '#0ea5e9',
      '--bgrid-toolbox-primary-contrast-color': '#082f49',
      '--bgrid-toolbox-notice-bg': '#172033',
      '--bgrid-toolbox-scroll-thumb-bg': '#64748b',
      '--bgrid-toolbox-scroll-track-bg': '#1f2937',
      '--bgrid-toolbox-focus-ring-color': '#0ea5e9',
    }),
  },
  {
    id: 'forest',
    name: 'Forest',
    palette: makeTheme({
      '--bgrid-primary-color': '#059669',
      '--bgrid-header-bg': '#ecfdf5',
      '--bgrid-header-color': '#064e3b',
      '--bgrid-header-hover-bg': '#d1fae5',
      '--bgrid-header-group-bg': '#d9f8e8',
      '--bgrid-footer-bg': '#f0fdf4',
      '--bgrid-summary-bg': '#dcfce7',
      '--bgrid-border-color-base': '#a7d8c2',
      '--bgrid-border-color-light': '#bfe4d2',
      '--bgrid-border-color-subtle': '#d8f0e4',
      '--bgrid-header-separator-color': '#b4ddca',
      '--bgrid-frozen-boundary-color': '#83bba2',
      '--bgrid-body-color': '#23443a',
      '--bgrid-body-odd-bg': '#f7fdf9',
      '--bgrid-body-hover-bg': '#ecfdf5',
      '--bgrid-body-hover-odd-bg': '#e0f8ec',
      '--bgrid-body-active-bg': '#d1fae5',
      '--bgrid-cell-selected-bg': '#d1fae5',
      '--bgrid-cell-selected-border-color': '#34d399',
      '--bgrid-selection-axis-bg': '#d1fae5',
      '--bgrid-selection-axis-color': '#047857',
      '--bgrid-selection-axis-border-color': '#10b981',
      '--bgrid-scroll-track-bg': '#e8f5ee',
      '--bgrid-scroll-thumb-bg': '#8bbba5',
      '--bgrid-scroll-thumb-hover-bg': '#5f9d82',
      '--bgrid-scroll-corner-bg': '#8bbba5',
      '--bgrid-scrollbar-modern-track-bg': '#e8f5ee',
      '--bgrid-scrollbar-modern-thumb-bg': '#8bbba5',
      '--bgrid-scrollbar-modern-thumb-hover-bg': '#5f9d82',
      '--bgrid-scrollbar-modern-button-hover-bg': '#d1fae5',
      '--bgrid-scrollbar-modern-icon-color': '#5f9d82',
      '--bgrid-scrollbar-modern-gutter-bg': '#e8f5ee',
      '--bgrid-scrollbar-modern-gutter-border-color': '#a7d8c2',
      '--bgrid-loading-second-color': '#047857',
      '--bgrid-toolbox-bg': '#ffffff',
      '--bgrid-toolbox-color': '#23443a',
      '--bgrid-toolbox-muted-color': '#5f7f72',
      '--bgrid-toolbox-control-bg': '#f7fdf9',
      '--bgrid-toolbox-control-color': '#23443a',
      '--bgrid-toolbox-control-border-color': '#a7d8c2',
      '--bgrid-toolbox-control-placeholder-color': '#7ea393',
      '--bgrid-toolbox-hover-bg': '#ecfdf5',
      '--bgrid-toolbox-active-bg': '#d1fae5',
      '--bgrid-toolbox-danger-color': '#be123c',
      '--bgrid-toolbox-danger-bg': '#fff1f2',
      '--bgrid-toolbox-button-bg': '#f0fdf4',
      '--bgrid-toolbox-primary-hover-color': '#047857',
      '--bgrid-toolbox-primary-contrast-color': '#ffffff',
      '--bgrid-toolbox-notice-bg': '#f7fdf9',
      '--bgrid-toolbox-scroll-thumb-bg': '#8bbba5',
      '--bgrid-toolbox-scroll-track-bg': '#e8f5ee',
      '--bgrid-toolbox-focus-ring-color': '#a7f3d0',
    }),
  },
  {
    id: 'violet',
    name: 'Violet',
    palette: makeTheme({
      '--bgrid-primary-color': '#7c3aed',
      '--bgrid-header-bg': '#f5f3ff',
      '--bgrid-header-color': '#3b1d69',
      '--bgrid-header-hover-bg': '#ede9fe',
      '--bgrid-header-group-bg': '#eee9fa',
      '--bgrid-footer-bg': '#faf8ff',
      '--bgrid-summary-bg': '#ede9fe',
      '--bgrid-border-color-base': '#d5c9eb',
      '--bgrid-border-color-light': '#e2daf1',
      '--bgrid-border-color-subtle': '#eee9f7',
      '--bgrid-header-separator-color': '#dcd2ed',
      '--bgrid-frozen-boundary-color': '#b4a6cd',
      '--bgrid-body-color': '#443658',
      '--bgrid-body-odd-bg': '#fcfbff',
      '--bgrid-body-hover-bg': '#f5f3ff',
      '--bgrid-body-hover-odd-bg': '#eee9ff',
      '--bgrid-body-active-bg': '#ede9fe',
      '--bgrid-cell-selected-bg': '#ede9fe',
      '--bgrid-cell-selected-border-color': '#a78bfa',
      '--bgrid-selection-axis-bg': '#ede9fe',
      '--bgrid-selection-axis-color': '#6d28d9',
      '--bgrid-selection-axis-border-color': '#8b5cf6',
      '--bgrid-scroll-track-bg': '#f1eef8',
      '--bgrid-scroll-thumb-bg': '#b7a8d0',
      '--bgrid-scroll-thumb-hover-bg': '#947db8',
      '--bgrid-scroll-corner-bg': '#b7a8d0',
      '--bgrid-scrollbar-modern-track-bg': '#f1eef8',
      '--bgrid-scrollbar-modern-thumb-bg': '#b7a8d0',
      '--bgrid-scrollbar-modern-thumb-hover-bg': '#947db8',
      '--bgrid-scrollbar-modern-button-hover-bg': '#ede9fe',
      '--bgrid-scrollbar-modern-icon-color': '#947db8',
      '--bgrid-scrollbar-modern-gutter-bg': '#f1eef8',
      '--bgrid-scrollbar-modern-gutter-border-color': '#d5c9eb',
      '--bgrid-loading-second-color': '#6d28d9',
      '--bgrid-toolbox-bg': '#ffffff',
      '--bgrid-toolbox-color': '#443658',
      '--bgrid-toolbox-muted-color': '#7c6c91',
      '--bgrid-toolbox-control-bg': '#fcfbff',
      '--bgrid-toolbox-control-color': '#443658',
      '--bgrid-toolbox-control-border-color': '#d5c9eb',
      '--bgrid-toolbox-control-placeholder-color': '#9b8daf',
      '--bgrid-toolbox-hover-bg': '#f5f3ff',
      '--bgrid-toolbox-active-bg': '#ede9fe',
      '--bgrid-toolbox-danger-color': '#be123c',
      '--bgrid-toolbox-danger-bg': '#fff1f2',
      '--bgrid-toolbox-button-bg': '#faf8ff',
      '--bgrid-toolbox-primary-hover-color': '#6d28d9',
      '--bgrid-toolbox-primary-contrast-color': '#ffffff',
      '--bgrid-toolbox-notice-bg': '#fcfbff',
      '--bgrid-toolbox-scroll-thumb-bg': '#b7a8d0',
      '--bgrid-toolbox-scroll-track-bg': '#f1eef8',
      '--bgrid-toolbox-focus-ring-color': '#ddd6fe',
    }),
  },
  {
    id: 'coral',
    name: 'Coral',
    palette: makeTheme({
      '--bgrid-primary-color': '#e11d48',
      '--bgrid-header-bg': '#fff1f2',
      '--bgrid-header-color': '#881337',
      '--bgrid-header-hover-bg': '#ffe4e6',
      '--bgrid-header-group-bg': '#ffe8eb',
      '--bgrid-footer-bg': '#fff7f7',
      '--bgrid-summary-bg': '#ffe4e6',
      '--bgrid-border-color-base': '#ebc3ca',
      '--bgrid-border-color-light': '#f1d4d9',
      '--bgrid-border-color-subtle': '#f8e6e9',
      '--bgrid-header-separator-color': '#edcdd2',
      '--bgrid-frozen-boundary-color': '#d5a7b0',
      '--bgrid-body-color': '#59343c',
      '--bgrid-body-odd-bg': '#fffbfb',
      '--bgrid-body-hover-bg': '#fff1f2',
      '--bgrid-body-hover-odd-bg': '#ffe8eb',
      '--bgrid-body-active-bg': '#ffe4e6',
      '--bgrid-cell-selected-bg': '#ffe4e6',
      '--bgrid-cell-selected-border-color': '#fb7185',
      '--bgrid-selection-axis-bg': '#ffe4e6',
      '--bgrid-selection-axis-color': '#be123c',
      '--bgrid-selection-axis-border-color': '#f43f5e',
      '--bgrid-scroll-track-bg': '#faeef0',
      '--bgrid-scroll-thumb-bg': '#d2a6ae',
      '--bgrid-scroll-thumb-hover-bg': '#b97985',
      '--bgrid-scroll-corner-bg': '#d2a6ae',
      '--bgrid-scrollbar-modern-track-bg': '#faeef0',
      '--bgrid-scrollbar-modern-thumb-bg': '#d2a6ae',
      '--bgrid-scrollbar-modern-thumb-hover-bg': '#b97985',
      '--bgrid-scrollbar-modern-button-hover-bg': '#ffe4e6',
      '--bgrid-scrollbar-modern-icon-color': '#b97985',
      '--bgrid-scrollbar-modern-gutter-bg': '#faeef0',
      '--bgrid-scrollbar-modern-gutter-border-color': '#ebc3ca',
      '--bgrid-loading-second-color': '#be123c',
      '--bgrid-toolbox-bg': '#ffffff',
      '--bgrid-toolbox-color': '#59343c',
      '--bgrid-toolbox-muted-color': '#8c6870',
      '--bgrid-toolbox-control-bg': '#fffbfb',
      '--bgrid-toolbox-control-color': '#59343c',
      '--bgrid-toolbox-control-border-color': '#ebc3ca',
      '--bgrid-toolbox-control-placeholder-color': '#ad8b92',
      '--bgrid-toolbox-hover-bg': '#fff1f2',
      '--bgrid-toolbox-active-bg': '#ffe4e6',
      '--bgrid-toolbox-danger-color': '#be123c',
      '--bgrid-toolbox-danger-bg': '#fff1f2',
      '--bgrid-toolbox-button-bg': '#fff7f7',
      '--bgrid-toolbox-primary-hover-color': '#be123c',
      '--bgrid-toolbox-primary-contrast-color': '#ffffff',
      '--bgrid-toolbox-notice-bg': '#fffbfb',
      '--bgrid-toolbox-scroll-thumb-bg': '#d2a6ae',
      '--bgrid-toolbox-scroll-track-bg': '#faeef0',
      '--bgrid-toolbox-focus-ring-color': '#fecdd3',
    }),
  },
] as const;

const colorPickerPresets = [
  { label: 'Brand', colors: ['#2563eb', '#059669', '#7c3aed', '#e11d48', '#ea580c', '#0891b2'] },
  { label: 'Surface', colors: ['#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#1e293b', '#111827'] },
  { label: 'Soft', colors: ['#dbeafe', '#d1fae5', '#ede9fe', '#ffe4e6', '#ffedd5', '#cffafe'] },
];

const themeColumns: BGridColumn<ThemeRow>[] = [
  { id: 'orderNo', key: 'orderNo', label: '주문 번호', width: 112, toolbox: true, filter: { type: 'text' } },
  { id: 'customer', key: 'customer', label: '고객', width: 170, toolbox: true, filter: { type: 'values' } },
  { id: 'channel', key: 'channel', label: '주문 채널', width: 104, toolbox: true, filter: { type: 'values' } },
  { id: 'status', key: 'status', label: '상태', width: 104, toolbox: true, filter: { type: 'values' } },
  {
    id: 'quantity',
    key: 'quantity',
    label: '수량',
    width: 84,
    align: 'right',
    toolbox: true,
    filter: { type: 'number' },
  },
  {
    id: 'amount',
    key: 'amount',
    label: '금액',
    width: 124,
    align: 'right',
    toolbox: true,
    filter: { type: 'number' },
    itemRender: ({ value }) => <>{Number(value).toLocaleString()}원</>,
  },
  { id: 'region', key: 'region', label: '권역', width: 92, toolbox: true, filter: { type: 'values' } },
  {
    id: 'deliveryMethod',
    key: 'deliveryMethod',
    label: '배송 방식',
    width: 108,
    toolbox: true,
    filter: { type: 'values' },
  },
  { id: 'orderDate', key: 'orderDate', label: '주문일', width: 112, toolbox: true, filter: { type: 'text' } },
  { id: 'owner', key: 'owner', label: '담당자', width: 96, toolbox: true, filter: { type: 'values' } },
];

const themeData: BGridDataItem<ThemeRow>[] = Array.from({ length: 300 }, (_, index) => ({
  values: {
    orderNo: `ORD-${2401 + index}`,
    customer: playgroundCustomers[index % playgroundCustomers.length],
    channel: ['온라인', '파트너', '전화', '방문'][index % 4],
    status: ['완료', '배송 중', '준비'][index % 3],
    quantity: ((index * 7) % 18) + 1,
    amount: 98000 + ((index * 49000) % 620000),
    region: ['수도권', '충청', '영남', '호남'][index % 4],
    deliveryMethod: ['택배', '직배송', '방문 수령'][index % 3],
    orderDate: `2026-08-${String((index % 28) + 1).padStart(2, '0')}`,
    owner: playgroundManagers[index % playgroundManagers.length],
  },
}));

const englishThemeColumns: BGridColumn<ThemeRow>[] = themeColumns.map(column => ({
  ...column,
  label: ({ orderNo: 'Order no.', customer: 'Customer', channel: 'Channel', status: 'Status', quantity: 'Quantity', amount: 'Amount', region: 'Region', deliveryMethod: 'Delivery method', orderDate: 'Order date', owner: 'Owner' } as Record<string, string>)[String(column.id)] ?? column.label,
  itemRender: column.id === 'amount' ? (({ value }) => <>{Number(value).toLocaleString('en-US')} KRW</>) : column.itemRender,
}));

const englishThemeData: BGridDataItem<ThemeRow>[] = themeData.map((item, index) => ({
  ...item,
  values: {
    ...item.values,
    customer: ['IMTSOFT', 'Golden Circle', 'Purni', 'Spicy', 'Weepo', 'Taein Sports'][index % 6],
    channel: ['Online', 'Partner', 'Phone', 'In person'][index % 4],
    status: ['Complete', 'Shipping', 'Ready'][index % 3],
    region: ['Capital', 'Central', 'Southeast', 'Southwest'][index % 4],
    deliveryMethod: ['Courier', 'Direct', 'Pickup'][index % 3],
    owner: ['Jordan Jang', 'Ian Kook', 'Dylan Jung', 'Avery Yang', 'Sora Koo', 'Sam Jang', 'Helen Park', 'Daniel Kim'][index % 8],
  },
}));

export default function ThemePlayground({ locale = 'ko' }: { locale?: Locale }) {
  const isEn = locale === 'en';
  const t = (ko: string, en: string) => isEn ? en : ko;
  const [palette, setPalette] = useState<ThemePalette>(themePresets[0].palette);
  const [selectedPreset, setSelectedPreset] = useState<string>('cloud');
  const [dataQuery, setDataQuery] = useState<BGridDataQuery>({ sortParams: [], filterParams: [] });
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewWidth, setPreviewWidth] = useState(900);

  useEffect(() => {
    const element = previewRef.current;
    if (!element) return;

    const updateWidth = () => setPreviewWidth(Math.max(280, Math.floor(element.clientWidth)));
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const source = useMemo(
    () => `.inventory-grid {
${Object.entries(palette)
  .map(([key, value]) => `  ${key}: ${value};`)
  .join('\n')}
}

/* React */
import { useState } from 'react';
import { BGrid } from 'beautiful-grid';
import 'beautiful-grid/style.css';

const [query, setQuery] = useState({ sortParams: [], filterParams: [] });

<div className="inventory-grid">
  <BGrid
    width={960}
    height={520}
    data={data}
    columns={columns}
    dataControl={{ mode: 'client', query, onChange: setQuery }}
    scrollbar={{ variant: 'modern' }}
    showLineNumber
  />
</div>`,
    [palette],
  );

  const controls = (
    <div className='playground-control-form'>
      <div className='theme-preset-grid' aria-label={t('테마 프리셋', 'Theme presets')}>
        {themePresets.map(preset => (
          <button
            key={preset.id}
            className='theme-preset-card'
            type='button'
            aria-pressed={selectedPreset === preset.id}
            onClick={() => {
              setSelectedPreset(preset.id);
              setPalette({ ...preset.palette });
            }}
          >
            <span className='theme-preset-swatches' aria-hidden='true'>
              <i style={{ background: preset.palette['--bgrid-primary-color'] }} />
              <i style={{ background: preset.palette['--bgrid-header-bg'] }} />
              <i style={{ background: preset.palette['--bgrid-body-bg'] }} />
              <i style={{ background: preset.palette['--bgrid-body-active-bg'] }} />
            </span>
            {preset.name}
          </button>
        ))}
      </div>

      <Collapse
        defaultActiveKey={['core', 'body']}
        items={themeColorGroups.map(group => ({
          key: group.key,
          label: isEn ? group.label : (
            {
              'Core & header palette': '코어 & 헤더 팔레트',
              'Body & interaction palette': '바디 & 상호작용 팔레트',
              'Borders, selection & edit palette': '테두리, 선택 및 편집 팔레트',
              'Scrollbar & loading palette': '스크롤바 & 로딩 팔레트',
              'Classic scrollbar palette': '클래식 스크롤바 팔레트',
              'Filter & toolbox palette': '필터 & 툴박스 팔레트',
              'Search & context menu palette': '검색 & 컨텍스트 메뉴 팔레트',
            }[group.label] || group.label
          ),
          children: (
            <div className='theme-color-list'>
              {group.fields.map(([key, label]) => (
                <div className='theme-color-row' key={key}>
                  <div className='theme-color-meta'>
                    <strong>{label}</strong>
                    <code>{key}</code>
                  </div>
                  <ColorPicker
                    value={palette[key]}
                    format='hex'
                    disabledAlpha={!alphaThemeColorTokens.has(key)}
                    showText
                    presets={colorPickerPresets}
                    onChange={(_, css) => {
                      setSelectedPreset('custom');
                      setPalette(current => ({ ...current, [key]: css }));
                    }}
                  />
                </div>
              ))}
            </div>
          ),
        }))}
      />
    </div>
  );

  const preview = (
    <div className='theme-preview-wrap' style={palette as React.CSSProperties}>
      <div className='theme-preview-head'>
        <div>
          <h3>{t('주문 워크스페이스', 'Order workspace')}</h3>
          <p>{t('헤더, 행, 선택, 편집, 요약과 스크롤 색을 한 화면에서 확인합니다.', 'Inspect header, row, selection, editing, summary, and scrollbar colors in one screen.')}</p>
        </div>
        <span className='theme-preview-badge'>{selectedPreset === 'custom' ? 'Custom' : selectedPreset}</span>
      </div>
      <div ref={previewRef}>
        <BGrid<ThemeRow>
          width={previewWidth}
          height={520}
          style={palette as React.CSSProperties}
          data={isEn ? englishThemeData : themeData}
          columns={isEn ? englishThemeColumns : themeColumns}
          dataControl={{
            mode: 'client',
            query: dataQuery,
            onChange: nextQuery => setDataQuery(nextQuery),
          }}
          frozenColumnIndex={1}
          frozenRowCount={1}
          showLineNumber
          columnSortable
          variant='vertical-bordered'
          rowKey='orderNo'
          selectedRowKey='ORD-2404'
          rowChecked={{ checkedIndexes: [1, 3], onChange: () => undefined }}
          summary={{
            position: 'bottom',
            columns: [
              { columnIndex: 0, itemRender: () => <>{t('합계', 'Total')}</> },
              {
                columnIndex: 5,
                align: 'right',
                itemRender: ({ data }) => (
                  <>{data.reduce((sum, item) => sum + item.values.amount, 0).toLocaleString(isEn ? 'en-US' : 'ko-KR')}{isEn ? ' KRW' : '원'}</>
                ),
              },
            ],
          }}
          status={{ content: ({ totalItems }) => isEn ? `${totalItems} orders` : `총 ${totalItems}개 주문` }}
          scrollbar={{ variant: 'modern' }}
          cellSelectionOptions={{ enabled: true }}
        />
      </div>
    </div>
  );

  return (
    <PlaygroundWorkspace
      eyebrow='Theme studio'
      title={t('테마 빌더', 'Theme builder')}
      description={t('5개 완성형 테마에서 시작하거나, 검증된 색 프리셋으로 각 팔레트 값을 조정합니다.', 'Start from five complete themes or tune each palette value with curated color presets.')}
      controls={controls}
      preview={preview}
      source={source}
      sourceTitle={t('현재 테마 CSS와 사용 코드', 'Current theme CSS and usage')}
      locale={locale}
    />
  );
}
