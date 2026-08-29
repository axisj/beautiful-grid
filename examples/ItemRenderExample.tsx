import { t } from './i18n';
import * as React from 'react';
import { BGrid, BGridColumn, BGridDataItem } from 'beautiful-grid';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';
import './ItemRenderExample.css';

type CenterStatus = string;

interface FulfillmentCenter {
  centerId: string;
  centerName: string;
  region: string;
  status: CenterStatus;
  throughput: number[];
  utilization: number[];
  sla: number;
  alerts: number;
  updatedAt: string;
}

const initialRows: BGridDataItem<FulfillmentCenter>[] = [
  [
    'FC-SEO-01',
    t('서울 동부 센터', 'Seoul East Center'),
    t('수도권', 'Metropolitan Area'),
    t('정상', 'Normal'),
    [72, 78, 76, 84, 88, 91, 96, 102],
    [42, 51, 64, 72, 78, 83, 76, 69, 62, 58, 47, 39],
    98,
    0,
    '10:42',
  ],
  [
    'FC-GMP-02',
    t('김포 허브', 'Gimpo Hub'),
    t('수도권', 'Metropolitan Area'),
    t('관찰', 'Observation'),
    [96, 92, 99, 104, 101, 112, 108, 118],
    [55, 62, 74, 88, 94, 96, 91, 85, 72, 61, 53, 48],
    91,
    2,
    '10:41',
  ],
  [
    'FC-ICN-01',
    t('인천 항공 센터', 'Incheon Aviation Center'),
    t('수도권', 'Metropolitan Area'),
    t('정상', 'Normal'),
    [64, 70, 74, 72, 79, 81, 86, 89],
    [31, 37, 42, 48, 55, 61, 66, 63, 54, 46, 39, 34],
    96,
    0,
    '10:40',
  ],
  [
    'FC-DAE-01',
    t('대전 중앙 허브', 'Daejeon Central Hub'),
    t('충청권', 'Chungcheong Region'),
    t('대응 필요', 'Response Required'),
    [122, 119, 116, 111, 106, 101, 95, 88],
    [68, 78, 86, 92, 97, 99, 96, 91, 84, 76, 67, 59],
    82,
    5,
    '10:39',
  ],
  [
    'FC-BUS-02',
    t('부산 남부 센터', 'Busan South Center'),
    t('영남권', 'Yeongnam Region'),
    t('정상', 'Normal'),
    [51, 55, 54, 61, 65, 69, 72, 76],
    [28, 34, 39, 45, 52, 58, 62, 57, 49, 42, 35, 30],
    97,
    0,
    '10:38',
  ],
  [
    'FC-DAE-03',
    t('대구 라스트마일', 'Daegu Last Mile'),
    t('영남권', 'Yeongnam Region'),
    t('관찰', 'Observation'),
    [83, 87, 91, 96, 94, 101, 98, 104],
    [44, 52, 61, 73, 84, 89, 86, 79, 68, 57, 49, 41],
    89,
    3,
    '10:37',
  ],
  [
    'FC-GWJ-01',
    t('광주 서부 센터', 'Gwangju West Center'),
    t('호남권', 'Honam Region'),
    t('정상', 'Normal'),
    [46, 48, 52, 55, 58, 63, 61, 67],
    [25, 29, 35, 41, 48, 54, 59, 55, 46, 38, 32, 27],
    95,
    0,
    '10:36',
  ],
  [
    'FC-JEJ-01',
    t('제주 배송 거점', 'Jeju Delivery Hub'),
    t('제주권', 'Jeju Region'),
    t('관찰', 'Observation'),
    [38, 41, 39, 45, 51, 48, 56, 53],
    [22, 28, 34, 47, 64, 72, 68, 55, 43, 35, 29, 24],
    90,
    1,
    '10:35',
  ],
].map(([centerId, centerName, region, status, throughput, utilization, sla, alerts, updatedAt]) => ({
  values: {
    centerId: String(centerId),
    centerName: String(centerName),
    region: String(region),
    status: status as CenterStatus,
    throughput: throughput as number[],
    utilization: utilization as number[],
    sla: Number(sla),
    alerts: Number(alerts),
    updatedAt: String(updatedAt),
  },
}));

const statusTone: Record<CenterStatus, string> = {
  
  
  '대응 필요': 'critical',
  'Response Required': 'critical',
  '정상': 'healthy',
  'Normal': 'healthy',
  '관찰': 'watch',
  'Observation': 'watch',
};

const CenterIdentity = React.memo(function CenterIdentity({ values }: { values: FulfillmentCenter }) {
  return (
    <div className='item-render-center'>
      <span className='item-render-center__mark' aria-hidden='true'>
        {values.region.slice(0, 1)}
      </span>
      <span className='item-render-center__copy'>
        <strong>{values.centerName}</strong>
        <small>
          {values.centerId} · {values.region}
        </small>
      </span>
    </div>
  );
});

const SparklineCanvas = React.memo(function SparklineCanvas({
  values,
  status,
}: {
  values: number[];
  status: CenterStatus;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const latest = values[values.length - 1];
  const previous = values[values.length - 2];
  const delta = latest - previous;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const width = 118;
    const height = 28;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);

    const color = status === t('대응 필요', 'Response Required') ? '#dc2626' : status === t('관찰', 'Observation') ? '#d97706' : '#2563eb';
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(1, max - min);
    const points = values.map((value, index) => ({
      x: 2 + (index / (values.length - 1)) * (width - 4),
      y: height - 3 - ((value - min) / range) * (height - 7),
    }));

    context.beginPath();
    points.forEach((point, index) =>
      index === 0 ? context.moveTo(point.x, point.y) : context.lineTo(point.x, point.y),
    );
    context.lineTo(points[points.length - 1].x, height - 2);
    context.lineTo(points[0].x, height - 2);
    context.closePath();
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, `${color}42`);
    gradient.addColorStop(1, `${color}05`);
    context.fillStyle = gradient;
    context.fill();

    context.beginPath();
    points.forEach((point, index) =>
      index === 0 ? context.moveTo(point.x, point.y) : context.lineTo(point.x, point.y),
    );
    context.strokeStyle = color;
    context.lineWidth = 1.8;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.stroke();

    const last = points[points.length - 1];
    context.beginPath();
    context.arc(last.x, last.y, 2.5, 0, Math.PI * 2);
    context.fillStyle = color;
    context.fill();
  }, [status, values]);

  return (
    <div className='item-render-trend'>
      <canvas
        ref={canvasRef}
        className='item-render-trend__canvas'
        role='img'
        aria-label={t(`최근 8개 구간 처리량 ${values.join(', ')}`, `Last 8 periods throughput ${values.join(', ')}`)}
      />
      <span className='item-render-trend__metric'>
        <strong>{latest}</strong>
        <small className={delta >= 0 ? 'is-up' : 'is-down'}>
          {delta >= 0 ? '+' : ''}
          {delta}
        </small>
      </span>
    </div>
  );
});

const UtilizationCanvas = React.memo(function UtilizationCanvas({ values }: { values: number[] }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const peak = Math.max(...values);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const width = 144;
    const height = 18;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);

    const gap = 2;
    const blockWidth = (width - gap * (values.length - 1)) / values.length;
    values.forEach((value, index) => {
      const lightness = 96 - Math.min(1, value / 100) * 48;
      context.fillStyle = `hsl(${value >= 90 ? 4 : value >= 75 ? 36 : 216} 82% ${lightness}%)`;
      context.beginPath();
      context.roundRect(index * (blockWidth + gap), 1, blockWidth, height - 2, 2);
      context.fill();
    });
  }, [values]);

  return (
    <div className='item-render-heatmap'>
      <canvas
        ref={canvasRef}
        className='item-render-heatmap__canvas'
        role='img'
        aria-label={t(`시간대별 설비 부하 ${values.join(', ')} 퍼센트`, `Hourly equipment load ${values.join(', ')} percent`)}
      />
      <span>
        {t('최고', 'Peak')} <strong>{peak}%</strong>
      </span>
    </div>
  );
});

const SlaGauge = React.memo(function SlaGauge({ value }: { value: number }) {
  const tone = value >= 95 ? 'healthy' : value >= 88 ? 'watch' : 'critical';
  return (
    <div
      className='item-render-gauge'
      role='progressbar'
      aria-label={t('출고 SLA 달성률', 'Dispatch SLA Achievement Rate')}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <span
        className={`item-render-gauge__ring item-render-gauge__ring--${tone}`}
        style={{ '--gauge-value': `${value * 3.6}deg` } as React.CSSProperties}
      >
        <strong>{value}</strong>
      </span>
      <span className='item-render-gauge__label'>
        SLA<small>{value >= 95 ? t('안정', 'Stable') : value >= 88 ? t('주의', 'Caution') : t('위험', 'Danger')}</small>
      </span>
    </div>
  );
});

function ItemRenderExample() {
  const [rows, setRows] = React.useState(initialRows);
  const [onlyAttention, setOnlyAttention] = React.useState(false);
  const [selectedCenter, setSelectedCenter] = React.useState(t('행을 선택하면 센터 정보가 표시됩니다.', 'Select a row to view center information.'));
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);

  const acknowledgeAlerts = React.useCallback((centerId: string) => {
    setRows(current =>
      current.map(row =>
        row.values.centerId === centerId ? { ...row, values: { ...row.values, alerts: 0, status: t('정상', 'Normal') } } : row,
      ),
    );
  }, []);

  const columns = React.useMemo<BGridColumn<FulfillmentCenter>[]>(
    () => [
      {
        key: 'centerName',
        label: t('물류 거점', 'Logistics Hub'),
        width: 195,
        itemRender: ({ values }) => <CenterIdentity values={values} />,
        getClipboardText: ({ values }) => `${values.centerName} (${values.centerId})`,
      },
      {
        key: 'status',
        label: t('운영 상태', 'Operating Status'),
        width: 105,
        align: 'center',
        itemRender: ({ value }) => (
          <span className={`item-render-status item-render-status--${statusTone[value as CenterStatus]}`}>
            <i aria-hidden='true' />
            {String(value)}
          </span>
        ),
      },
      {
        key: 'throughput',
        label: t('시간당 처리량 추이', 'Throughput per Hour Trend'),
        width: 205,
        itemRender: ({ values }) => <SparklineCanvas values={values.throughput} status={values.status} />,
        getClipboardText: ({ values }) => `${values.throughput[values.throughput.length - 1]} orders/h`,
      },
      {
        key: 'utilization',
        label: t('12시간 설비 부하', '12-hour equipment load'),
        width: 205,
        itemRender: ({ value }) => <UtilizationCanvas values={value as number[]} />,
        getClipboardText: ({ value }) => (value as number[]).join(','),
      },
      {
        key: 'sla',
        label: t('출고 SLA', 'Dispatch SLA'),
        width: 125,
        align: 'center',
        itemRender: ({ value }) => <SlaGauge value={Number(value)} />,
        getClipboardText: ({ value }) => `${value}%`,
      },
      {
        key: 'alerts',
        label: t('이상 대응', 'Anomaly Response'),
        width: 150,
        align: 'center',
        itemRender: ({ values }) =>
          values.alerts > 0 ? (
            <button
              type='button'
              className='item-render-action'
              aria-label={t(`${values.centerName} 알림 ${values.alerts}건 확인 처리`, `Process ${values.alerts} alerts for ${values.centerName}`)}
              onClick={event => {
                event.stopPropagation();
                acknowledgeAlerts(values.centerId);
              }}
            >
              {t('알림', 'Alert')} {values.alerts}{t('건 확인', 'cases checked')}
            </button>
          ) : (
            <span className='item-render-clear'>{t('이상 없음', 'No Anomaly')}</span>
          ),
        getClipboardText: ({ values }) => (values.alerts > 0 ? `알림 ${values.alerts}건` : t('이상 없음', 'No Anomaly')),
      },
      { key: 'updatedAt', label: t('갱신', 'Renewal'), width: 80, align: 'center' },
    ],
    [acknowledgeAlerts],
  );

  const displayedRows = React.useMemo(
    () => (onlyAttention ? rows.filter(row => row.values.alerts > 0) : rows),
    [onlyAttention, rows],
  );

  return (
    <div className='item-render-example'>
      <div className='item-render-example__toolbar'>
        <div>
          <span className='item-render-example__eyebrow'>FULFILLMENT CONTROL TOWER</span>
          <strong>{t('셀 안에 운영 대시보드를 구성합니다', 'Configure operational dashboard within cells')}</strong>
          <small>{t('Canvas 2종 · 복합 React UI · 행 단위 액션', '2 Types of Canvas · Complex React UI · Row-level Action')}</small>
        </div>
        <button
          type='button'
          className='item-render-example__filter'
          aria-pressed={onlyAttention}
          onClick={() => setOnlyAttention(value => !value)}
        >
          <span aria-hidden='true' />
          {t('이상 거점만 보기', 'View only anomalous hubs')}
          <b>{rows.filter(row => row.values.alerts > 0).length}</b>
        </button>
      </div>

      <DataGridContainer ref={containerRef} className='item-render-example__grid-container'>
        <BGrid<FulfillmentCenter>
          className='item-render-dashboard-grid'
          width={width}
          height={height}
          columns={columns}
          data={displayedRows}
          rowKey='centerId'
          headerHeight={38}
          itemHeight={44}
          itemPadding={4}
          frozenColumnIndex={1}
          variant='vertical-bordered'
          cellSelectionOptions={{ enabled: true }}
          cellNavigationOptions={{ enabled: true, defaultActiveCell: { rowIndex: 0, columnIndex: 0 } }}
          onClick={({ item }) =>
            setSelectedCenter(`${item.centerName} · SLA ${item.sla}% · ${item.updatedAt} ${t('갱신', 'Updated')}`)
          }
          status={{
            content: `${displayedRows.length}${t('개 거점', 'hubs')} · ${onlyAttention ? t('이상 대응 대상', 'Target for Anomaly Response') : t('전체 운영 현황', 'Overall Operating Status')}`,
          }}
        />
      </DataGridContainer>

      <div className='item-render-example__footer' aria-live='polite'>
        <span className='item-render-example__live-dot' aria-hidden='true' />
        {selectedCenter}
      </div>
    </div>
  );
}

export default ItemRenderExample;
