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
import './shadcnEditorPlugins.css';

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
    const selectedValue = value == null ? undefined : String(value);

    return (
      <Select
        value={selectedValue}
        open={open}
        onOpenChange={nextOpen => {
          setOpen(nextOpen);
          if (!nextOpen) cancel();
        }}
        onValueChange={nextValue => {
          const selectedOption = options.options.find(option => String(option.value) === nextValue);
          if (selectedOption) void commit([{ key: column.key, value: selectedOption.value }]);
        }}
      >
        <SelectTrigger
          className="bgrid-shadcn-trigger border-0 focus:ring-0 rounded-none bg-transparent"
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
            <SelectItem key={opt.value} value={String(opt.value)}>
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
