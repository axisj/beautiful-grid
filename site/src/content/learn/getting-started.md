---
title: '시작하기 (Getting Started)'
description: 'React 프로젝트에 BeautifulGrid를 설치하고 스타일, 데이터, 컬럼, 페이지 컨테이너를 연결해 첫 그리드를 실행합니다.'
category: 'getting-started'
order: 1
locale: 'ko'
canonicalPath: '/learn/getting-started'
features: ['installation', 'style-import', 'first-grid', 'responsive-container']
relatedGuides: ['basic', 'container-resize', 'data-and-columns']
relatedApi: ['/api/props#columns', '/api/props#data', '/api/props#rowkey', '/api/props#width', '/api/props#height']
lastReviewedAt: '2026-08-23'
indexable: true
draft: false
---

이 문서는 BeautifulGrid의 기능을 설명하는 예제 페이지가 아닙니다. 이미 만들어진 React 페이지에 패키지를 설치하고, 필요한 스타일과 데이터를 연결해 **첫 그리드가 화면에 나타날 때까지**의 과정을 다룹니다.

기본 컬럼 구성과 셀 렌더링 같은 기능별 사용법은 설치를 마친 뒤 [기본 DataGrid (Basic)](/learn/basic)에서 이어서 확인할 수 있습니다.

## 1. 패키지 설치

React 프로젝트의 루트에서 다음 명령을 실행합니다.

```bash
npm install beautiful-grid
```

다른 패키지 매니저를 사용한다면 아래 명령 중 하나를 사용하세요.

```bash
pnpm add beautiful-grid
# 또는
yarn add beautiful-grid
```

BeautifulGrid는 React 컴포넌트입니다. 새 프로젝트라면 먼저 React와 React DOM이 설치되어 있는지 확인하세요.

## 2. 그리드 스타일 연결

애플리케이션 진입 파일에서 배포용 CSS를 한 번 불러옵니다. Vite 프로젝트라면 일반적으로 `src/main.tsx`에 추가합니다.

```tsx
import 'beautiful-grid/style.css';
```

Next.js App Router를 사용한다면 전역 CSS를 불러올 수 있는 `app/layout.tsx`에 같은 import를 추가하세요. 이 스타일을 불러오지 않으면 데이터가 렌더링되어도 헤더, 셀, 스크롤바가 정상적으로 표시되지 않습니다.

## 3. 페이지에 첫 DataGrid 추가

아래 예제는 별도 데모 데이터나 고급 기능 없이, 사용자 목록 페이지에 필요한 최소 연결만 포함합니다.

```tsx
import * as React from 'react';
import {
  BGrid,
  type BGridColumn,
  type BGridDataItem,
} from 'beautiful-grid';

interface User {
  id: string;
  name: string;
  department: string;
}

const columns: BGridColumn<User>[] = [
  { key: 'id', label: 'ID', width: 120 },
  { key: 'name', label: '이름', width: 160 },
  { key: 'department', label: '부서', width: 180 },
];

const data: BGridDataItem<User>[] = [
  { values: { id: 'U-001', name: '김하늘', department: '개발팀' } },
  { values: { id: 'U-002', name: '이서준', department: '운영팀' } },
  { values: { id: 'U-003', name: '박지민', department: '디자인팀' } },
];

export default function UsersPage() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const { width, height } = container.getBoundingClientRect();
      setSize({ width: Math.floor(width), height: Math.floor(height) });
    };

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    updateSize();

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <main>
      <h1>사용자 목록</h1>
      <div
        ref={containerRef}
        style={{ position: 'relative', width: '100%', height: 360, minWidth: 0 }}
      >
        {size.width > 0 && size.height > 0 && (
          <BGrid<User>
            width={size.width}
            height={size.height}
            columns={columns}
            data={data}
            rowKey='id'
          />
        )}
      </div>
    </main>
  );
}
```

Next.js에서 이 코드를 페이지 컴포넌트로 사용한다면 파일 맨 위에 `'use client';`를 추가하세요. `ResizeObserver`와 React Hook을 브라우저에서 실행하기 위해 필요합니다.

## 4. 연결 구조 이해하기

첫 화면을 구성하는 데 필요한 값은 네 가지입니다.

| 연결 항목 | 역할 |
|---|---|
| `columns` | 어떤 필드를 어떤 제목과 너비로 보여줄지 정의합니다. |
| `data` | 각 행의 실제 값입니다. 도메인 객체를 반드시 `{ values: ... }`로 감쌉니다. |
| `rowKey` | 선택, 편집, 포커스 상태를 유지할 수 있도록 각 행의 고유 필드를 지정합니다. |
| `width`, `height` | 가상 스크롤 영역을 계산할 수 있도록 그리드의 실제 픽셀 크기를 전달합니다. |

페이지가 고정 크기라면 `width={800}`, `height={360}`처럼 숫자를 직접 전달해도 됩니다. 반응형 페이지에서는 위 예제처럼 부모 컨테이너를 `ResizeObserver`로 측정해 전달하는 방식을 권장합니다.

## 5. 실행 확인

개발 서버를 실행한 뒤 사용자 목록 페이지에서 다음 내용을 확인합니다.

1. `ID`, `이름`, `부서` 헤더와 세 개의 행이 표시됩니다.
2. 브라우저 너비를 바꾸면 그리드 너비도 부모 영역에 맞게 변경됩니다.
3. 개발자 콘솔에 CSS import 오류나 `ResizeObserver` 오류가 없습니다.

화면이 비어 있다면 먼저 부모 컨테이너의 높이가 `0`이 아닌지 확인하세요. 모양이 깨져 보인다면 `beautiful-grid/style.css`가 애플리케이션 진입 파일에서 실제로 로드되었는지 확인합니다.

## 6. 다음 단계

설치와 페이지 연결이 끝났다면 목적에 맞는 가이드로 이동하세요.

- [기본 컬럼과 셀 렌더링 (Basic)](/learn/basic)
- [반응형 컨테이너 연결 (DataGridContainer)](/learn/container-resize)
- [데이터와 컬럼 타입 정의 (Data & Columns)](/learn/data-and-columns)
- [셀 편집 시작하기 (Cell Editing)](/learn/editing)
