---
title: "Shadcn UI 에디터 플러그인 (Shadcn UI Editor Plugins)"
description: "BeautifulGrid 공식 Shadcn Registry에서 Select, DatePicker, ColorPicker, Cascader, TimePicker, TreeSelect 에디터 소스를 설치하고 사용하는 방법을 설명합니다."
category: "interaction"
order: 5
locale: "ko"
canonicalPath: "/plugins/shadcn"
demoId: "editor-plugins-shadcn"
features: ["editor-plugin", "defineEditorPlugin", "portal", "shadcn-ui", "popover", "radix-ui"]
relatedGuides: ["editor-plugins", "editor-plugins-antd", "editor-plugins-mui", "editor-plugins-mantine", "built-in-editors"]
relatedApi: ["/api/props#columns", "/api/props#editable"]
lastReviewedAt: "2026-09-23"
indexable: true
draft: false
---

BeautifulGrid는 [Shadcn UI](https://ui.shadcn.com/) 방식에 맞춰 공식 에디터 플러그인을 **Shadcn Registry 소스**로 제공합니다. npm 패키지 내부의 구현을 불러오는 방식이 아니라, 프로젝트가 설치된 소스를 직접 소유하고 디자인 시스템에 맞게 수정할 수 있습니다.

공식 플러그인에는 Select, DatePicker, ColorPicker, Cascader, TimePicker, TreeSelect factory가 포함됩니다. 각 factory는 Grid의 Portal과 편집 수명주기를 이미 연결하므로 애플리케이션에서는 옵션을 구성한 뒤 컬럼의 `editor`에 지정하면 됩니다.

text·기본 Select·Date만 필요하다면 [내장·기본 제공 에디터](/learn/built-in-editors)를, 다른 공식 통합과의 비교는 [공식 에디터 플러그인](/plugins)을 확인하세요.

## 1. 공식 플러그인 설치와 사용

Shadcn CLI로 BeautifulGrid 공식 Registry 항목을 추가합니다.

```sh
npx shadcn@latest add https://raw.githubusercontent.com/axisj/beautiful-grid-plugins/main/public/r/beautiful-grid-editors.json
```

기본 설정에서는 `components/beautiful-grid` 아래에 6개 editor factory와 공통 Portal 컴포넌트, 스타일시트가 생성됩니다. 생성된 진입점에서 필요한 factory를 가져옵니다.

```tsx
import { createShadcnSelectEditorPlugin } from '@/components/beautiful-grid';

type Order = {
  status: 'ready' | 'progress' | 'done';
};

const statusEditor = createShadcnSelectEditorPlugin<Order, Order['status']>({
  id: 'order-status',
  ariaLabel: '주문 상태 선택',
  options: [
    { value: 'ready', label: '접수' },
    { value: 'progress', label: '진행' },
    { value: 'done', label: '완료' },
  ],
});

const columns: BGridColumn<Order>[] = [
  { key: 'status', label: '상태', editable: true, editor: statusEditor },
];
```

공식 Registry 진입점은 플러그인 스타일도 함께 불러옵니다. 아래 라이브 데모는 6개 에디터의 동작을 보여주며, 실제 프로젝트에서는 위 Registry 설치 명령으로 생성된 소스를 사용합니다.

## 2. 내부 구현 이해: Select와 Portal

Shadcn UI의 `Select` 컴포넌트는 `SelectContent` 팝업을 Portal로 렌더링합니다. `getPortalContainer()`를 전달하고, `onValueChange`에서 변경 배열을 `commit`합니다.

```tsx
function ShadcnSelectEditor({
  value,
  column,
  commit,
  cancel,
  getPortalContainer,
}: BGridEditorPluginProps<Task>) {
  const [open, setOpen] = React.useState(true);

  return (
    <Select
      value={value == null ? undefined : String(value)}
      open={open}
      onOpenChange={nextOpen => {
        setOpen(nextOpen);
        if (!nextOpen) cancel(); // 닫힐 때 변경 사항이 없다면 cancel
      }}
      onValueChange={nextValue => void commit([{ key: column.key, value: nextValue }])}
    >
      <SelectTrigger
        className="h-full w-full border-none focus:ring-0 rounded-none bg-transparent"
        autoFocus
        onKeyDown={event => {
          if (event.key === 'Escape' || event.key === 'Esc') {
            event.preventDefault();
            cancel();
          }
        }}
      >
        <SelectValue />
      </SelectTrigger>
      {/* getPortalContainer()를 통해 Grid 전용 팝업 컨테이너에 렌더링 */}
      <SelectContent container={getPortalContainer()}>
        {statusOptions.map(opt => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export const shadcnStatusEditor = defineEditorPlugin<Task>({
  id: 'shadcn-status',
  component: ShadcnSelectEditor,
});
```

`commit`은 단일 값도 항상 길이 1의 변경 배열로 받습니다.

## 3. DatePicker와 ColorPicker 연결 (Radix Popover)

달력 날짜 선택과 색상 팔레트는 Shadcn UI의 `Popover` 컴포넌트를 기반으로 구성합니다.

### DatePicker (Calendar Popover)

날짜는 앱의 저장 형식(예: `YYYY-MM-DD`)으로 변환한 뒤 `commit`합니다.

```tsx
function ShadcnDatePickerEditor({
  value,
  column,
  commit,
  cancel,
  getPortalContainer,
}: BGridEditorPluginProps<Task>) {
  const [open, setOpen] = React.useState(true);

  return (
    <Popover open={open} onOpenChange={nextOpen => { setOpen(nextOpen); if (!nextOpen) cancel(); }}>
      <PopoverTrigger asChild>
        <button className="flex h-full w-full items-center justify-between px-2 text-sm">
          <span>{String(value || '날짜 선택')}</span>
          <CalendarIcon className="h-4 w-4 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent container={getPortalContainer()} className="w-auto p-3" align="start">
        <CalendarView
          selectedDate={value ? new Date(String(value)) : new Date()}
          onSelect={date => void commit([{ key: column.key, value: formatDate(date) }])}
        />
      </PopoverContent>
    </Popover>
  );
}
```

### ColorPicker (Palette Grid & HEX Input)

색상 팔레트 그리드 클릭 시 즉시 commit하거나, 커스텀 HEX 입력 후 저장할 수 있습니다.

```tsx
function ShadcnColorPickerEditor({
  value,
  column,
  commit,
  cancel,
  getPortalContainer,
}: BGridEditorPluginProps<Task>) {
  const [open, setOpen] = React.useState(true);

  return (
    <Popover open={open} onOpenChange={nextOpen => { setOpen(nextOpen); if (!nextOpen) cancel(); }}>
      <PopoverTrigger asChild>
        <button className="flex h-full w-full items-center gap-2 px-2 text-sm">
          <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: String(value) }} />
          <span className="font-mono text-[13px]">{String(value)}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent container={getPortalContainer()} className="w-64 p-3" align="start">
        <ColorPaletteGrid onSelect={color => void commit([{ key: column.key, value: color }])} />
      </PopoverContent>
    </Popover>
  );
}
```

## 4. Cascader, TimePicker, TreeSelect 연결

### Cascader (다단계 계층 선택)

카테고리나 지역 분류 등 다단계 계층 구조를 순차 패널로 탐색하고, 최종 리프 노드 선택 시 전체 경로 `string[]`을 commit합니다.

```tsx
function ShadcnCascaderEditor({ value, column, commit, cancel, getPortalContainer }: BGridEditorPluginProps<Task>) {
  return (
    <Popover open onOpenChange={open => { if (!open) cancel(); }}>
      <PopoverTrigger asChild>
        <button className="flex h-full w-full items-center justify-between px-2 text-sm">
          <span>{Array.isArray(value) ? value.join(' / ') : '분류 선택'}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent container={getPortalContainer()} className="w-auto p-2" align="start">
        <CascaderPanel
          options={categoryTree}
          onSelectPath={path => void commit([{ key: column.key, value: path }])}
        />
      </PopoverContent>
    </Popover>
  );
}
```

### Cascader 복사·붙여넣기

Shadcn UI Cascader가 `string[]`을 commit하더라도 Grid 클립보드는 `text/plain`만 전달합니다. `itemRender`의 `국내 / 서울` 표시는 화면 전용이므로, 붙여넣기 문자열을 배열로 되돌리지 않으면 다음 editor 진입 때 선택 경로가 사라집니다. 라이브 예제는 컬럼에 다음 계약을 둡니다.

```tsx
{
  key: 'categoryPath',
  editor: shadcnCategoryEditor,
  itemRender: ({ value }) => <>{Array.isArray(value) ? value.join(' / ') : ''}</>,
  getClipboardText: ({ value }) => JSON.stringify(value),
  parseClipboardText: text => {
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed) || !parsed.every(segment => typeof segment === 'string')) {
      throw new TypeError('분류 경로는 JSON 문자열 배열이어야 합니다.');
    }
    return parsed;
  },
}
```

이렇게 하면 복사된 `["국내","서울"]`이 붙여넣기 시 다시 `string[]`가 되고, idle 셀과 Shadcn trigger가 모두 `국내 / 서울`을 표시합니다. 일반적인 값 타입별 변환 우선순위와 검증 규칙은 [AntD 예제의 복사·붙여넣기 값 변환](/plugins/antd#복사붙여넣기-값-변환)을 참고하세요. 핵심은 `itemRender`는 화면 표시, `getClipboardText`는 직렬화, `parseClipboardText`는 타입 복원이라는 세 책임을 분리하는 것입니다.

### TimePicker (시간·분 선택)

시(00~23)와 분(00~55) 컬럼 선택 패널과 자주 쓰는 시간 프리셋을 제공하며, 확인 버튼 클릭 시 `HH:mm` 문자열로 commit합니다.

```tsx
function ShadcnTimePickerEditor({ value, column, commit, cancel, getPortalContainer }: BGridEditorPluginProps<Task>) {
  const [time, setTime] = React.useState(parseTime(value));

  return (
    <Popover open onOpenChange={open => { if (!open) cancel(); }}>
      <PopoverTrigger asChild>
        <button className="flex h-full w-full items-center justify-between px-2 text-sm font-mono">
          <span>{String(value || '09:00')}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent container={getPortalContainer()} className="w-64 p-3" align="start">
        <TimeColumnPicker time={time} onChange={setTime} />
        <Button onClick={() => void commit([{ key: column.key, value: formatTime(time) }])}>확인</Button>
      </PopoverContent>
    </Popover>
  );
}
```

### TreeSelect (조직도 검색 및 트리 선택)

검색창이 포함된 트리 구조 조직도 선택기입니다. 검색어 필터링과 그룹 접기/펼치기를 지원하며, 하위 노드 선택 시 해당 부서명을 commit합니다.

```tsx
function ShadcnTreeSelectEditor({ value, column, commit, cancel, getPortalContainer }: BGridEditorPluginProps<Task>) {
  return (
    <Popover open onOpenChange={open => { if (!open) cancel(); }}>
      <PopoverTrigger asChild>
        <button className="flex h-full w-full items-center justify-between px-2 text-sm">
          <span>{String(value || '조직 선택')}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent container={getPortalContainer()} className="w-64 p-3" align="start">
        <TreeSearchList
          data={organizationTree}
          selected={String(value)}
          onSelect={nodeVal => void commit([{ key: column.key, value: nodeVal }])}
        />
      </PopoverContent>
    </Popover>
  );
}
```

## 5. Popup Portal과 Shadcn UI 설정

공식 Registry 소스에는 팝업을 Grid 전용 floating portal root에 렌더링하는 구현이 이미 포함되어 있습니다. 설치된 소스를 디자인 시스템에 맞게 수정할 때도 `SelectContent`, `PopoverContent`의 `container` 전달은 유지해야 합니다.

```tsx
// components/ui/popover.tsx
const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & { container?: HTMLElement | null }
>(({ className, align = "start", sideOffset = 4, container, ...props }, ref) => (
  // container 속성을 Radix Portal로 전달
  <PopoverPrimitive.Portal container={container}>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn("z-50 rounded-md border bg-white p-3 shadow-md", className)}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
```

`getPortalContainer()`가 반환하는 컨테이너는 다음과 같은 이점이 있습니다:
- Grid 테마 CSS 변수(`--bgrid-*`) 자동 상속
- 가상 스크롤 및 frozen 컬럼 영역 계산에 포함되어 팝업이 그리드와 함께 정밀하게 동기화
- 팝업 클릭이 Grid 외부 클릭으로 오인되어 세션이 예기치 않게 종료되는 문제 방지

## 6. 여러 컬럼 원자적 저장과 직접 확장

단일 에디터 조작으로 여러 연관 컬럼을 함께 갱신해야 할 때는 `commit`에 여러 변경 항목을 배열로 전달합니다.

```tsx
await commit([
  { key: 'categoryCode', value: selected.code },
  { key: 'categoryName', value: selected.name },
]);
```

저장 또는 취소 후 DOM 포커스는 Grid가 원래 활성 셀로 안전하게 복원합니다.

공식 factory로 해결되지 않는 앱 전용 입력이나 비동기 자동완성은 `defineEditorPlugin()`으로 별도 플러그인을 정의할 수 있습니다. 일반 사용은 공식 Registry factory에서 시작하고, 필요한 부분만 설치된 소스에서 확장하는 방식을 권장합니다.
