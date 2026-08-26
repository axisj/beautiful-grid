---
title: "데이터와 컬럼 정의 (Data & Columns)"
description: "TypeScript 제네릭을 활용한 안전한 컬럼 매핑, 점 표기법 중첩 키 접근, 폭(Width)과 정렬(Align) 규칙을 심층 분석합니다."
category: "data-and-columns"
order: 1
locale: "ko"
canonicalPath: "/learn/data-and-columns"
demoId: "basic"
features: ["columns", "nested-keys", "typescript", "data-types", "align"]
relatedGuides: ["getting-started", "basic", "column-groups", "editing"]
relatedApi: ["/api/props#columns", "/api/props#data", "/api/props#rowkey"]
lastReviewedAt: "2026-08-17"
indexable: true
draft: false
---

## 1. 개요 및 타입 안정성

`BGridColumn<T>`과 `BGridDataItem<T>`는 셀 렌더러와 콜백에서 행 값의 타입을 전달합니다. 다만 현재 `BGridColumn.key`는 `string | string[]`이므로 존재하지 않는 필드명을 컴파일러가 자동으로 차단하지는 않습니다. 컬럼 key와 실제 데이터 필드가 일치하는지 애플리케이션 코드와 테스트에서 확인해야 합니다.

---

## 2. 컬럼 `key`의 2가지 지정 방식

### 1) 단순 문자열 키 (1차원 속성)
```tsx
{ key: 'username', label: '사용자명', width: 120 }
```

### 2) 배열 점 경로 키 (중첩 객체 접근)
데이터가 `{ company: { address: { city: '서울' } } }` 처럼 중첩된 경우:
```tsx
{ key: ['company', 'address', 'city'], label: '도시', width: 120 }
```
