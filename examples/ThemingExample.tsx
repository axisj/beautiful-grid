import * as React from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';
import { Segmented } from 'antd';
import { Building2, Moon, Sun } from 'lucide-react';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';
import './ThemingExample.css';

type ThemeId = 'default' | 'brand' | 'dark';
type ServiceStatus = '정상' | '점검 예정' | '주의';

interface ServiceMetric {
  id: string;
  service: string;
  team: string;
  status: ServiceStatus;
  availability: number;
  responseTime: number;
  updatedAt: string;
}

interface ThemeOption {
  id: ThemeId;
  label: string;
  description: string;
  icon: React.ReactNode;
  tokens: Array<{ name: string; value: string }>;
}

const themeOptions: ThemeOption[] = [
  {
    id: 'default',
    label: '기본',
    description: '별도 오버라이드가 없는 기본 라이트 테마',
    icon: <Sun size={14} aria-hidden='true' />,
    tokens: [
      { name: '--bgrid-primary-color', value: '#3073f1' },
      { name: '--bgrid-header-bg', value: '#f3f5f8' },
      { name: '--bgrid-body-bg', value: '#ffffff' },
      { name: '--bgrid-body-active-bg', value: '#e1f0ff' },
    ],
  },
  {
    id: 'brand',
    label: '브랜드',
    description: '기업 컬러와 둥근 모서리를 적용한 커스텀 테마',
    icon: <Building2 size={14} aria-hidden='true' />,
    tokens: [
      { name: '--bgrid-primary-color', value: '#0f766e' },
      { name: '--bgrid-header-bg', value: '#0f766e' },
      { name: '--bgrid-body-bg', value: '#f7fffd' },
      { name: '--bgrid-body-active-bg', value: '#ccfbf1' },
    ],
  },
  {
    id: 'dark',
    label: '다크',
    description: '어두운 업무 화면에 맞춘 고대비 다크 테마',
    icon: <Moon size={14} aria-hidden='true' />,
    tokens: [
      { name: '--bgrid-primary-color', value: '#38bdf8' },
      { name: '--bgrid-header-bg', value: '#1e293b' },
      { name: '--bgrid-body-bg', value: '#0f172a' },
      { name: '--bgrid-body-active-bg', value: '#164e63' },
    ],
  },
];

const services: BGridDataItem<ServiceMetric>[] = [
  ['API-GW', 'API Gateway', '플랫폼', '정상', 99.99, 82, '10:42'],
  ['AUTH', '인증 서비스', '플랫폼', '정상', 99.97, 104, '10:41'],
  ['PAY', '결제 처리', '커머스', '주의', 99.82, 286, '10:40'],
  ['ORDER', '주문 관리', '커머스', '정상', 99.95, 127, '10:42'],
  ['SEARCH', '상품 검색', '프로덕트', '점검 예정', 99.91, 168, '10:39'],
  ['NOTIFY', '알림 발송', 'CRM', '정상', 99.98, 91, '10:41'],
  ['REPORT', '리포트 생성', '데이터', '주의', 99.76, 342, '10:38'],
  ['STORAGE', '파일 저장소', '플랫폼', '정상', 99.99, 73, '10:42'],
  ['PROFILE', '회원 프로필', 'CRM', '정상', 99.96, 118, '10:40'],
  ['CATALOG', '상품 카탈로그', '프로덕트', '점검 예정', 99.89, 194, '10:39'],
].map(([id, service, team, status, availability, responseTime, updatedAt]) => ({
  values: {
    id: String(id),
    service: String(service),
    team: String(team),
    status: status as ServiceStatus,
    availability: Number(availability),
    responseTime: Number(responseTime),
    updatedAt: String(updatedAt),
  },
}));

const columns: BGridColumn<ServiceMetric>[] = [
  { key: 'service', label: '서비스', width: 190 },
  { key: 'team', label: '담당 팀', width: 110, align: 'center' },
  {
    key: 'status',
    label: '운영 상태',
    width: 120,
    align: 'center',
    itemRender: ({ value }) => (
      <span className={`theming-example-status theming-example-status--${value === '정상' ? 'healthy' : value === '주의' ? 'warning' : 'scheduled'}`}>
        {String(value)}
      </span>
    ),
  },
  {
    key: 'availability',
    label: '가용성',
    width: 110,
    align: 'right',
    itemRender: ({ value }) => <strong>{Number(value).toFixed(2)}%</strong>,
  },
  {
    key: 'responseTime',
    label: '응답 시간',
    width: 120,
    align: 'right',
    itemRender: ({ value }) => `${Number(value).toLocaleString()}ms`,
  },
  { key: 'updatedAt', label: '최근 확인', width: 100, align: 'center' },
];

export default function ThemingExample() {
  const [theme, setTheme] = React.useState<ThemeId>('default');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);
  const activeTheme = themeOptions.find(option => option.id === theme) ?? themeOptions[0];

  return (
    <div className='theming-example'>
      <div className='theming-example__toolbar'>
        <div className='theming-example__intro'>
          <strong>같은 데이터 · 같은 컬럼 · 다른 CSS 변수</strong>
          <span>{activeTheme.description}</span>
        </div>

        <Segmented
          aria-label='데이터그리드 테마 선택'
          value={theme}
          options={themeOptions.map(option => ({
            value: option.id,
            label: (
              <span className='theming-example__option'>
                {option.icon}
                {option.label}
              </span>
            ),
          }))}
          onChange={value => setTheme(value as ThemeId)}
        />
      </div>

      <div className='theming-example__tokens' aria-live='polite'>
        <div className='theming-example__class-name'>
          <span>적용 클래스</span>
          <code>.bgrid-theme-{theme}</code>
        </div>
        {activeTheme.tokens.map(token => (
          <div className='theming-example__token' key={token.name}>
            <span className='theming-example__swatch' style={{ backgroundColor: token.value }} aria-hidden='true' />
            <span>
              <code>{token.name}</code>
              <small>{token.value}</small>
            </span>
          </div>
        ))}
      </div>

      <DataGridContainer ref={containerRef} className='theming-example__grid-container'>
        <BGrid<ServiceMetric>
          className={`theming-example-grid bgrid-theme-${theme}`}
          width={width}
          height={height}
          headerHeight={38}
          itemHeight={22}
          columns={columns}
          data={services}
          rowKey='id'
          showLineNumber
          frozenColumnIndex={1}
          cellSelectionOptions={{ enabled: true }}
          cellNavigationOptions={{ enabled: true, defaultActiveCell: { rowIndex: 0, columnIndex: 0 } }}
          status={{ content: `${services.length}개 서비스 · ${activeTheme.label} 테마` }}
        />
      </DataGridContainer>

      <p className='theming-example__hint'>행에 마우스를 올리거나 셀을 클릭하면 hover·선택 색상도 테마에 맞게 바뀝니다.</p>
    </div>
  );
}
