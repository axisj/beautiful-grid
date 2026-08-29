import { t } from './i18n';
import * as React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { BGrid, BGridColumn } from 'beautiful-grid';
import type { BGridDataControl, BGridDataQuery, BGridToolboxIcons } from 'beautiful-grid';
import { useContainerSize } from '../hooks/useContainerSize';
import DataGridContainer from '../components/DataGridContainer';
import { Button, Segmented, Space, Tag } from 'antd';

import { ChevronDown, ArrowUp, ArrowDown, Filter, X } from 'lucide-react';

const lucideToolboxIcons: BGridToolboxIcons = {
  dropdown: <ChevronDown size={13} strokeWidth={2} />,
  sortAsc: <ArrowUp size={13} strokeWidth={2.2} />,
  sortDesc: <ArrowDown size={13} strokeWidth={2.2} />,
  filter: <Filter size={13} strokeWidth={2} />,
  filterBadge: <Filter size={9} strokeWidth={2} />,
  sortClear: <X size={13} strokeWidth={2} />,
};

const categories = ['Frontend', 'Backend', 'Database', 'DevOps', 'Design', 'Language', 'Security', 'Cloud', 'Mobile'];
const authors = ['Tom', 'Jerry', 'Alice', 'Bob', 'Charlie', 'David', 'Emma'];
const topics = [
  t('React 18 새로운 기능 살펴보기', 'Exploring New Features in React 18'),
  'TypeScript 5.0 마스터 가이드',
  'Next.js 14 App Router 실전',
  t('Zustand와 Recoil 상태관리 비교', 'Comparison of Zustand and Recoil State Management'),
  'Node.js 백엔드 아키텍처 패턴',
  t('PostgreSQL 인덱스 최적화 기법', 'PostgreSQL Index Optimization Techniques'),
  t('Docker와 K8s 배포 파이프라인 구축', 'Docker and K8s Deployment Pipeline Construction'),
  t('Vite 기반 번들 최적화 꿀팁', 'Tips for Vite-based Bundle Optimization'),
  t('GraphQL vs REST API 완벽 비교', 'GraphQL vs REST API Complete Comparison'),
  t('Tailwind CSS로 모던 UI 디자인하기', 'Designing Modern UI with Tailwind CSS'),
  t('Rust 기초부터 웹서버 구현까지', 'Rust from Basics to Web Server Implementation'),
  '웹 접근성(A11y) 가이드라인 준수하기',
  t('Redis 분산 캐시 설계 및 활용', 'Redis Distributed Cache Design and Utilization'),
  t('Kafka 대용량 메시지 브로커 실습', 'Kafka Large Scale Message Broker Practice'),
  t('Kubernetes 클러스터 모니터링 가이드', 'Kubernetes Cluster Monitoring Guide'),
  t('Elasticsearch 검색 엔진 최적화', 'Elasticsearch Search Engine Optimization'),
  'OAuth 2.0 및 JWT 인증 아키텍처',
  'Microservices Event-driven 아키텍처',
  t('Flutter 크로스 플랫폼 앱 제작', 'Flutter Cross Platform App Development'),
  t('Kotlin Coroutine 비동기 프로그래밍', 'Kotlin Coroutine Asynchronous Programming'),
];

const mockData = Array.from({ length: 60 }, (_, index) => {
  const id = index + 1;
  const topic = topics[index % topics.length];
  const category = categories[index % categories.length];
  const author = authors[index % authors.length];
  const views = Math.floor(500 + Math.sin(index * 1.5 + 1) * 3000 + 4000);
  const price = Math.floor(15000 + (index % 12) * 5000);
  const month = String((index % 12) + 1).padStart(2, '0');
  const day = String((index % 28) + 1).padStart(2, '0');
  const date = `2023-${month}-${day}`;

  return {
    values: {
      id,
      title: index >= topics.length ? `${topic} (심화 #${Math.floor(index / topics.length) + 1})` : topic,
      category,
      author,
      views,
      price,
      date,
    },
  };
});

export default function ToolboxExample() {
  const [data, setData] = useState(mockData);
  const [iconTheme, setIconTheme] = useState<'lucide' | 'default'>('lucide');
  const [query, setQuery] = useState<BGridDataQuery>({
    sortParams: [],
    filterParams: [],
  });

  const handleQueryChange = useCallback((nextQuery: BGridDataQuery, action: any) => {
    console.log('[ToolboxExample] Query Change:', action, nextQuery);
    setQuery(nextQuery);
  }, []);

  const handleResetQuery = useCallback(() => {
    setQuery({
      sortParams: [],
      filterParams: [],
    });
  }, []);

  const dataControl: BGridDataControl = {
    mode: 'client',
    query,
    onChange: handleQueryChange,
    multiSort: true,
  };

  const columns: BGridColumn<any>[] = useMemo(
    () => [
      {
        id: 'col_id',
        key: 'id',
        label: 'ID',
        width: 60,
        align: 'center',
        toolbox: true,
        filter: {
          type: 'number',
        },
      },
      {
        id: 'col_title',
        key: 'title',
        label: t('제목', 'Title'),
        width: 280,
        toolbox: {
          sort: true,
          filter: true,
          extraItems: [
            {
              id: 'copy-col',
              label: t('컬럼명 복사', 'Copy Column Name'),
              onClick: ({ column }) => {
                navigator.clipboard?.writeText(String(column.label));
                alert('컬럼명이 복사되었습니다.');
              },
            },
          ],
        },
        filter: {
          type: 'text',
        },
      },
      {
        id: 'col_category',
        key: 'category',
        label: t('카테고리', 'Category'),
        width: 120,
        align: 'center',
        toolbox: true,
        filter: {
          type: 'values',
        },
      },
      {
        id: 'col_author',
        key: 'author',
        label: t('작성자', 'Author'),
        width: 100,
        align: 'center',
        toolbox: true,
        filter: {
          type: 'values',
        },
      },
      {
        id: 'col_views',
        key: 'views',
        label: t('조회수', 'Views'),
        width: 110,
        align: 'right',
        toolbox: true,
        itemRender: ({ value }) => Number(value).toLocaleString(),
        filter: {
          type: 'number',
        },
      },
      {
        id: 'col_price',
        key: 'price',
        label: '가격 (원)',
        width: 120,
        align: 'right',
        toolbox: true,
        itemRender: ({ value }) => `₩${Number(value).toLocaleString()}`,
        filter: {
          type: 'number',
        },
      },
      {
        id: 'col_date',
        key: 'date',
        label: t('등록일', 'Registration Date'),
        width: 110,
        align: 'center',
        toolbox: true,
        filter: {
          type: 'text',
        },
      },
    ],
    [],
  );

  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width: containerWidth, height: containerHeight } = useContainerSize(containerRef);

  return (
    <>
      <div className='flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm'>
        <div className='flex items-center gap-3 text-slate-600'>
          <span>
            <strong>정렬:</strong> {query.sortParams.length}개
            {query.sortParams.length > 0 && (
              <span className='text-blue-600 ml-1'>
                ({query.sortParams.map(s => `${s.columnId}:${s.orderBy}`).join(', ')})
              </span>
            )}
          </span>
          <span>|</span>
          <span>
            <strong>필터:</strong> {query.filterParams.length}개
            {query.filterParams.length > 0 && (
              <span className='text-emerald-600 ml-1'>
                ({query.filterParams.map(f => `${f.columnId}(${f.type})`).join(', ')})
              </span>
            )}
          </span>
        </div>

        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-2'>
            <span className='text-xs text-slate-500 font-medium'>아이콘 스타일:</span>
            <Segmented
              value={iconTheme}
              onChange={val => setIconTheme(val as 'lucide' | 'default')}
              options={[
                { label: 'Lucide 벡터 아이콘 (커스텀)', value: 'lucide' },
                { label: '기본 불릿/기호 (Fallback)', value: 'default' },
              ]}
            />
          </div>

          <Button onClick={handleResetQuery}>정렬 / 필터 전체 초기화</Button>
        </div>
      </div>

      <DataGridContainer ref={containerRef}>
        <BGrid
          width={containerWidth}
          height={containerHeight}
          data={data}
          columns={columns}
          columnSortable
          frozenColumnIndex={1}
          dataControl={dataControl}
          icons={iconTheme === 'lucide' ? lucideToolboxIcons : undefined}
          rowKey='id'
          rowChecked={{
            checkedIndexes: [],
            onChange: (checkedIndexes, checkedRowKeys) => {
              console.log('[ToolboxExample] Checked:', checkedIndexes, checkedRowKeys);
            },
          }}
          onClick={({ item, index, column }) => {
            console.log('[ToolboxExample] Row Clicked:', index, item.title, column.label);
          }}
        />
      </DataGridContainer>
    </>
  );
}
