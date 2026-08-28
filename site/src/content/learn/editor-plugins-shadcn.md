---
title: "외부 에디터 플러그인 (Shadcn UI) (Editor Plugins (Shadcn UI))"
description: "Shadcn UI (Radix UI)를 기반으로 한 Select, DatePicker, ColorPicker, Cascader, TimePicker, TreeSelect 컴포넌트를 plugin으로 연결하고 popup portal, 다중 변경 commit, 종료 수명주기를 관리하는 방법을 설명합니다."
category: "interaction"
order: 4
locale: "ko"
canonicalPath: "/learn/editor-plugins-shadcn"
demoId: "editor-plugins-shadcn"
features: ["editor-plugin", "defineEditorPlugin", "portal", "shadcn-ui", "popover", "radix-ui"]
relatedGuides: ["editor-plugins", "built-in-editors", "editing-events", "editor-icons"]
relatedApi: ["/api/props#columns", "/api/props#editable"]
lastReviewedAt: "2026-08-28"
indexable: true
draft: false
---

[Shadcn UI](https://ui.shadcn.com/)와 같이 Radix UI를 기반으로 동작하는 모던 컴포넌트들을 `defineEditorPlugin()`으로 BeautifulGrid의 셀 에디터에 연결할 수 있습니다. Radix UI는 `SelectPrimitive.Portal`, `PopoverPrimitive.Portal`을 통해 팝업 요소를 전역 DOM에 렌더링하므로, 그리드가 제공하는 `getPortalContainer()`를 전달하여 Grid의 스크롤 컨텍스트, 테마 변수 상속, 바깥 클릭 판정과 완벽히 호환되도록 구성합니다.

text·기본 Select·Date만 필요하다면 [내장·기본 제공 에디터](/learn/built-in-editors)를, Ant Design UI 연결은 [외부 에디터 플러그인 (AntD)](/learn/editor-plugins)를 확인하세요.

## 1. Shadcn UI Select Plugin 정의

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
      defaultValue={value as string}
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

## 2. DatePicker와 ColorPicker 연결 (Radix Popover)

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

## 3. Cascader, TimePicker, TreeSelect 연결

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

## 4. Popup Portal과 Shadcn UI 설정

Shadcn UI의 기본 설정은 팝업을 전역 `document.body`에 렌더링합니다. 데이터 그리드 내부에서 사용할 때는 `SelectContent`, `PopoverContent`와 같은 팝업 컴포넌트가 그리드 전용 floating portal root에 렌더링되도록 `container` 속성을 추가합니다.

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

## 5. 여러 컬럼 원자적 저장

단일 에디터 조작으로 여러 연관 컬럼을 함께 갱신해야 할 때는 `commit`에 여러 변경 항목을 배열로 전달합니다.

```tsx
await commit([
  { key: 'categoryCode', value: selected.code },
  { key: 'categoryName', value: selected.name },
]);
```

저장 또는 취소 후 DOM 포커스는 Grid가 원래 활성 셀로 안전하게 복원합니다.
