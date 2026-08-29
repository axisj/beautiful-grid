import { t } from '../i18n';
import * as React from 'react';
import type { BGridEditorPluginProps, BGridPluginEditorConfig } from 'beautiful-grid';
import { defineEditorPlugin } from 'beautiful-grid/editors';
import { Check, Palette } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import './shadcnEditorPlugins.css';

interface Options {
  id: string;
  ariaLabel: string;
  colors?: string[];
}

const DEFAULT_PRESET_COLORS = [
  '#0F172A', // Slate 900
  '#64748B', // Slate 500
  '#EF4444', // Red 500
  '#F97316', // Orange 500
  '#F59E0B', // Amber 500
  '#10B981', // Emerald 500
  '#06B6D4', // Cyan 500
  '#3B82F6', // Blue 500
  '#6366F1', // Indigo 500
  '#8B5CF6', // Violet 500
  '#D946EF', // Fuchsia 500
  '#F43F5E', // Rose 500
  '#1677FF', // Primary Blue
  '#13C2C2', // Cyan
  '#52C41A', // Green
  '#FA8C16', // Orange
];

export function createShadcnColorPickerEditorPlugin<T>(
  options: Options,
): BGridPluginEditorConfig<T> {
  const palette = options.colors || DEFAULT_PRESET_COLORS;

  function ShadcnColorPickerEditor({
    value,
    column,
    commit,
    cancel,
    getPortalContainer,
  }: BGridEditorPluginProps<T>) {
    const [open, setOpen] = React.useState(true);
    const initialHex = typeof value === 'string' && value ? value : '#3B82F6';
    const [selectedColor, setSelectedColor] = React.useState(initialHex);
    const [customHex, setCustomHex] = React.useState(initialHex);

    const handleSelectColor = (color: string) => {
      setSelectedColor(color);
      setCustomHex(color);
      void commit([{ key: column.key, value: color }]);
    };

    const handleApplyCustom = (e: React.FormEvent) => {
      e.preventDefault();
      const cleanHex = customHex.startsWith('#') ? customHex : `#${customHex}`;
      if (/^#[0-9A-Fa-f]{6}$/.test(cleanHex) || /^#[0-9A-Fa-f]{3}$/.test(cleanHex)) {
        void commit([{ key: column.key, value: cleanHex.toUpperCase() }]);
      }
    };

    return (
      <Popover
        open={open}
        onOpenChange={nextOpen => {
          setOpen(nextOpen);
          if (!nextOpen) cancel();
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className="bgrid-shadcn-trigger"
            aria-label={options.ariaLabel}
            autoFocus
            onKeyDown={event => {
              if (event.key === 'Escape' || event.key === 'Esc') {
                event.preventDefault();
                cancel();
              }
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="h-4 w-4 rounded-full border border-slate-300 shadow-sm dark:border-slate-700"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{selectedColor}</span>
            </div>
            <Palette className="h-4 w-4 opacity-50 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          container={getPortalContainer()}
          className="w-64 p-3"
          align="start"
        >
          <div className="flex flex-col gap-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              {t('색상 팔레트', 'Color Palette')}
            </div>

            {/* Color Swatch Grid */}
            <div className="grid grid-cols-4 gap-2">
              {palette.map(color => {
                const isSelected = selectedColor.toUpperCase() === color.toUpperCase();
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleSelectColor(color)}
                    style={{ backgroundColor: color }}
                    className="relative flex h-8 w-full items-center justify-center rounded-md border border-black/10 shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer dark:border-white/10"
                    aria-label={`${t('색상', 'Color')} ${color}`}
                  >
                    {isSelected && (
                      <Check
                        className="h-4 w-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] text-white"
                        strokeWidth={3}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom HEX Input */}
            <form onSubmit={handleApplyCustom} className="flex flex-col gap-1.5 border-t border-slate-100 pt-2 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-medium dark:text-slate-400">{t('직접 입력 (HEX)', 'Direct Input (HEX)')}</span>
              <div className="flex items-center gap-1.5">
                <Input
                  type="text"
                  value={customHex}
                  onChange={e => setCustomHex(e.target.value)}
                  placeholder="#000000"
                  className="font-mono"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="shrink-0"
                >
                  {t('적용', 'Apply')}
                </Button>
              </div>
            </form>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  ShadcnColorPickerEditor.displayName = `ShadcnColorPickerEditor(${options.id})`;
  return defineEditorPlugin<T>({
    id: options.id,
    component: ShadcnColorPickerEditor,
  });
}
