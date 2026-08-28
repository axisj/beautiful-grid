import * as React from 'react';
import type { BGridEditorPluginProps, BGridPluginEditorConfig } from 'beautiful-grid';
import { defineEditorPlugin } from 'beautiful-grid/editors';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

interface Option<Value extends string | number> {
  value: Value;
  label: React.ReactNode;
}

interface Options<Value extends string | number> {
  id: string;
  ariaLabel: string;
  options: Option<Value>[];
}

export function createShadcnSelectEditorPlugin<T, Value extends string | number>(
  options: Options<Value>,
): BGridPluginEditorConfig<T> {
  function ShadcnSelectEditor({ value, column, commit, cancel, getPortalContainer }: BGridEditorPluginProps<T>) {
    const [open, setOpen] = React.useState(true);

    return (
      <Select
        defaultValue={value as string}
        open={open}
        onOpenChange={nextOpen => {
          setOpen(nextOpen);
          if (!nextOpen) cancel();
        }}
        onValueChange={nextValue => void commit([{ key: column.key, value: nextValue as Value }])}
      >
        <SelectTrigger
          className="h-full w-full border-none focus:ring-0 focus:ring-offset-0 rounded-none bg-transparent"
          aria-label={options.ariaLabel}
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
        <SelectContent container={getPortalContainer()}>
          {options.options.map(opt => (
            <SelectItem key={opt.value} value={opt.value as string}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  ShadcnSelectEditor.displayName = `ShadcnSelectEditor(${options.id})`;
  return defineEditorPlugin<T>({
    id: options.id,
    component: ShadcnSelectEditor,
  });
}
