---
title: "External Editor Plugins (Shadcn UI)"
description: "Learn how to connect Radix UI based components like Shadcn UI (Select, DatePicker, ColorPicker, Cascader, TimePicker, TreeSelect) as editor plugins, managing popup portals, multi-value commits, and exit lifecycles."
category: "interaction"
order: 4
locale: "en"
canonicalPath: "/en/learn/editor-plugins-shadcn"
demoId: "editor-plugins-shadcn"
features: ["editor-plugin", "defineEditorPlugin", "portal", "shadcn-ui", "popover", "radix-ui"]
relatedGuides: ["editor-plugins", "built-in-editors", "editing-events", "editor-icons"]
relatedApi: ["/en/api/props#columns", "/en/api/props#editable"]
lastReviewedAt: "2026-08-29"
indexable: true
draft: false
---

Modern component systems built on Radix UI—such as [Shadcn UI](https://ui.shadcn.com/)—can be seamlessly integrated into BeautifulGrid cells using `defineEditorPlugin()`. Because Radix UI renders floating content via `SelectPrimitive.Portal` and `PopoverPrimitive.Portal`, connecting `getPortalContainer()` ensures your popups stay aligned with virtual scrolling, inherit theme CSS custom properties, and avoid false outside-click dismissals.

If you only need text, basic Select, or Date editing, start with [Built-in Editors](/en/learn/built-in-editors). For Ant Design integrations, see [External Editor Plugins (AntD)](/en/learn/editor-plugins).

## 1. Defining a Shadcn UI Select Plugin

Shadcn UI's `Select` renders its floating `SelectContent` through a portal. Pass `getPortalContainer()` and call `commit` with an array of changes upon value selection.

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
        if (!nextOpen) cancel(); // Cancel if closed without changes
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
      {/* Render inside the Grid's dedicated floating portal container */}
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

Always provide changes to `commit` as an array of changes (`commit([{ key, value }])`).

## 2. DatePicker and ColorPicker (Radix Popover)

Calendar date pickers and color swatch pickers are built on Shadcn UI's `Popover` primitive.

### DatePicker (Calendar Popover)

Dates are formatted into the application's target string format (e.g. `YYYY-MM-DD`) before committing.

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
          <span>{String(value || 'Select date')}</span>
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

Users can click preset swatch tiles or input a custom hex code.

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

## 3. Cascader, TimePicker, and TreeSelect

### Cascader (Hierarchical Multilevel Selection)

Navigate cascading panels across category or geography levels, committing the full selected path as `string[]`.

```tsx
function ShadcnCascaderEditor({ value, column, commit, cancel, getPortalContainer }: BGridEditorPluginProps<Task>) {
  return (
    <Popover open onOpenChange={open => { if (!open) cancel(); }}>
      <PopoverTrigger asChild>
        <button className="flex h-full w-full items-center justify-between px-2 text-sm">
          <span>{Array.isArray(value) ? value.join(' / ') : 'Select category'}</span>
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

### Cascader copy and paste

Even though the Shadcn UI Cascader commits a `string[]`, the Grid clipboard carries only `text/plain`. The `Domestic / Seoul` output from `itemRender` is display-only. If paste does not restore the string to an array, the selected path disappears the next time the editor opens. The live example defines the following column contract:

```tsx
{
  key: 'categoryPath',
  editor: shadcnCategoryEditor,
  itemRender: ({ value }) => <>{Array.isArray(value) ? value.join(' / ') : ''}</>,
  getClipboardText: ({ value }) => JSON.stringify(value),
  parseClipboardText: text => {
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed) || !parsed.every(segment => typeof segment === 'string')) {
      throw new TypeError('Category path must be a JSON string array.');
    }
    return parsed;
  },
}
```

The copied `["Domestic","Seoul"]` becomes a `string[]` again on paste, so both the idle cell and Shadcn trigger display `Domestic / Seoul`. See [copy/paste value conversion in the AntD guide](/en/learn/editor-plugins#convert-values-for-copy-and-paste) for conversion precedence and validation rules across value types. Keep the three responsibilities separate: `itemRender` controls display, `getClipboardText` serializes, and `parseClipboardText` restores the stored type.

### TimePicker (Hour & Minute Selector)

Select hour (00-23) and minute (00-55) columns with quick preset shortcuts, committing `HH:mm`.

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
        <Button onClick={() => void commit([{ key: column.key, value: formatTime(time) }])}>Confirm</Button>
      </PopoverContent>
    </Popover>
  );
}
```

### TreeSelect (Searchable Organization Tree)

A hierarchical tree browser with top search filtering and collapsible branches. Selecting a leaf node commits the branch value.

```tsx
function ShadcnTreeSelectEditor({ value, column, commit, cancel, getPortalContainer }: BGridEditorPluginProps<Task>) {
  return (
    <Popover open onOpenChange={open => { if (!open) cancel(); }}>
      <PopoverTrigger asChild>
        <button className="flex h-full w-full items-center justify-between px-2 text-sm">
          <span>{String(value || 'Select team')}</span>
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

## 4. Popup Portals and Container Configuration

By default, Shadcn UI renders popovers into `document.body`. When embedding inside a datagrid, pass `container` to `SelectPrimitive.Portal` and `PopoverPrimitive.Portal` to mount into the Grid's dedicated floating root.

```tsx
// components/ui/popover.tsx
const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & { container?: HTMLElement | null }
>(({ className, align = "start", sideOffset = 4, container, ...props }, ref) => (
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

This guarantees:
- Full inheritance of Grid theme variables (`--bgrid-*`)
- Tight synchronization with virtual scrolling and frozen column bounds
- Accurate outside-click detection without accidental early session termination

## 5. Atomic Multi-Column Commits

When a single editor resolves multiple linked fields (e.g. code and name), pass them together in a single `commit` invocation:

```tsx
await commit([
  { key: 'categoryCode', value: selected.code },
  { key: 'categoryName', value: selected.name },
]);
```

Focus is automatically returned to the active grid cell upon completion or cancellation.
