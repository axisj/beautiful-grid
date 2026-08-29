import { t } from '../i18n';
import * as React from 'react';
import type { BGridEditorPluginProps, BGridPluginEditorConfig } from 'beautiful-grid';
import { defineEditorPlugin } from 'beautiful-grid/editors';
import { ChevronRight, Layers } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover';
import './shadcnEditorPlugins.css';

export interface CascaderOption {
  value: string;
  label: React.ReactNode;
  children?: CascaderOption[];
}

interface Options {
  id: string;
  ariaLabel: string;
  options: CascaderOption[];
}

export function createShadcnCascaderEditorPlugin<T>(
  options: Options,
): BGridPluginEditorConfig<T> {
  function ShadcnCascaderEditor({
    value,
    column,
    commit,
    cancel,
    getPortalContainer,
  }: BGridEditorPluginProps<T>) {
    const [open, setOpen] = React.useState(true);
    const initialPath = Array.isArray(value) ? (value as string[]) : [];
    const [selectedPath, setSelectedPath] = React.useState<string[]>(initialPath);

    // Get current options at each level
    const level1Options = options.options;
    const level1Selected = level1Options.find(o => o.value === selectedPath[0]);
    const level2Options = level1Selected?.children || [];
    const level2Selected = level2Options.find(o => o.value === selectedPath[1]);
    const level3Options = level2Selected?.children || [];

    const handleSelectLevel = (levelIndex: number, option: CascaderOption) => {
      const nextPath = selectedPath.slice(0, levelIndex);
      nextPath[levelIndex] = option.value;
      setSelectedPath(nextPath);

      // If leaf node (no children), commit immediately
      if (!option.children || option.children.length === 0) {
        void commit([{ key: column.key, value: nextPath }]);
      }
    };

    const displayText = initialPath.length > 0 ? initialPath.join(' / ') : '';

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
            <span className="truncate">{displayText || t('분류 선택', 'Select Category')}</span>
            <Layers className="h-4 w-4 opacity-50 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          container={getPortalContainer()}
          className="w-auto p-2"
          align="start"
        >
          <div className="flex flex-col gap-2">
            <div className="text-xs font-semibold text-slate-500 px-2 pt-1 uppercase tracking-wider dark:text-slate-400">
              {t('계층 분류 선택', 'Select Hierarchical Category')}
            </div>

            <div className="flex divide-x divide-slate-100 rounded-md border border-slate-100 bg-slate-50/50 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900/50">
              {/* Level 1 Panel */}
              <div className="bgrid-shadcn-scroll flex max-h-56 w-32 flex-col overflow-y-auto p-1">
                {level1Options.map(opt => {
                  const isSelected = selectedPath[0] === opt.value;
                  const hasChildren = Boolean(opt.children?.length);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelectLevel(0, opt)}
                      className={`flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 text-xs transition-colors cursor-pointer border-0 bg-transparent ${
                        isSelected
                          ? 'bg-slate-900 font-semibold text-white dark:bg-slate-50 dark:text-slate-900'
                          : 'text-slate-700 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {hasChildren && (
                        <ChevronRight className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-white dark:text-slate-900' : 'text-slate-400'}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Level 2 Panel */}
              {level2Options.length > 0 && (
                <div className="bgrid-shadcn-scroll flex max-h-56 w-32 flex-col overflow-y-auto p-1 bg-white dark:bg-slate-950">
                  {level2Options.map(opt => {
                    const isSelected = selectedPath[1] === opt.value;
                    const hasChildren = Boolean(opt.children?.length);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelectLevel(1, opt)}
                        className={`flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 text-xs transition-colors cursor-pointer border-0 bg-transparent ${
                          isSelected
                            ? 'bg-slate-900 font-semibold text-white dark:bg-slate-50 dark:text-slate-900'
                            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {hasChildren && (
                          <ChevronRight className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-white dark:text-slate-900' : 'text-slate-400'}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Level 3 Panel if exists */}
              {level3Options.length > 0 && (
                <div className="bgrid-shadcn-scroll flex max-h-56 w-32 flex-col overflow-y-auto p-1 bg-white dark:bg-slate-950">
                  {level3Options.map(opt => {
                    const isSelected = selectedPath[2] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelectLevel(2, opt)}
                        className={`flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 text-xs transition-colors cursor-pointer border-0 bg-transparent ${
                          isSelected
                            ? 'bg-slate-900 font-semibold text-white dark:bg-slate-50 dark:text-slate-900'
                            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedPath.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-2 pt-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <span>{t('선택 경로', 'Selected Path')}: <strong className="text-slate-900 dark:text-slate-100">{selectedPath.join(' > ')}</strong></span>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  ShadcnCascaderEditor.displayName = `ShadcnCascaderEditor(${options.id})`;
  return defineEditorPlugin<T>({
    id: options.id,
    component: ShadcnCascaderEditor,
  });
}
