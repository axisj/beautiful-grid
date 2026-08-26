import * as React from 'react';
import { BGrid } from 'beautiful-grid';
import type { BGridColumn } from 'beautiful-grid';
import { useContainerSize } from '../hooks/useContainerSize';
import DataGridContainer from '../components/DataGridContainer';
import { Segmented, Switch, Select } from 'antd';

const columns: BGridColumn<any>[] = [
  { key: 'id', label: 'ID', width: 80, align: 'center' },
  { key: 'title', label: 'Title', width: 300 },
  { key: 'count', label: 'Count', width: 100, align: 'right' },
  { key: 'desc', label: 'Description', width: 600 },
];

const data = Array.from({ length: 150 }).map((_, i) => ({
  values: {
    id: i + 1,
    title: `Scrollbar test item ${i + 1}`,
    count: i * 10,
    desc: `Description for item ${i + 1}. This is to make the row longer to test horizontal scrolling.`,
  }
}));

export default function ScrollbarExample() {
  const [variant, setVariant] = React.useState<'native' | 'classic' | 'modern'>('classic');
  const [statusVisible, setStatusVisible] = React.useState(true);
  const [statusContentMode, setStatusContentMode] = React.useState<'default' | 'custom text' | 'custom render'>('default');

  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width: containerWidth, height: containerHeight } = useContainerSize(containerRef);

  const getStatusContent = () => {
    if (statusContentMode === 'custom text') return 'Last synced: 10:30 AM';
    if (statusContentMode === 'custom render') {
      return ({ totalItems, visibleItems }: any) => (
        <span style={{ color: 'blue', fontWeight: 600 }}>
          {visibleItems} / {totalItems} Custom Render
        </span>
      );
    }
    return undefined;
  };

  return (
    <>
      <div className='flex flex-wrap items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm mb-4'>
        <div className='flex items-center gap-2'>
          <span className='text-xs text-slate-500 font-medium'>Variant:</span>
          <Segmented
            value={variant}
            onChange={val => setVariant(val as any)}
            options={['native', 'classic', 'modern']}
          />
        </div>

        <div className='flex items-center gap-2'>
          <span className='text-xs text-slate-500 font-medium'>Status Visible:</span>
          <Switch checked={statusVisible} onChange={setStatusVisible} size="small" />
        </div>

        <div className='flex items-center gap-2'>
          <span className='text-xs text-slate-500 font-medium'>Status Content:</span>
          <Select
            value={statusContentMode}
            onChange={setStatusContentMode}
            options={[
              { label: 'Default', value: 'default' },
              { label: 'Custom Text', value: 'custom text' },
              { label: 'Custom Render', value: 'custom render' }
            ]}
            style={{ width: 140 }}
            size="small"
          />
        </div>
      </div>

      <DataGridContainer ref={containerRef}>
        <BGrid
          width={containerWidth}
          height={containerHeight}
          columns={columns}
          data={data}
          scrollbar={{
            variant,
          }}
          status={{
            visible: statusVisible,
            content: getStatusContent(),
          }}
          frozenColumnIndex={1}
        />
      </DataGridContainer>
    </>
  );
}
