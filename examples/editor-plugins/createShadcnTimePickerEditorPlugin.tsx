import * as React from 'react';
import type { BGridEditorPluginProps, BGridPluginEditorConfig } from 'beautiful-grid';
import { defineEditorPlugin } from 'beautiful-grid/editors';
import { Clock } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover';

interface Options {
  id: string;
  ariaLabel: string;
  minuteStep?: number;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

export function createShadcnTimePickerEditorPlugin<T>(
  options: Options,
): BGridPluginEditorConfig<T> {
  const step = options.minuteStep || 5;
  const MINUTES = Array.from({ length: 60 / step }, (_, i) => String(i * step).padStart(2, '0'));

  function ShadcnTimePickerEditor({
    value,
    column,
    commit,
    cancel,
    getPortalContainer,
  }: BGridEditorPluginProps<T>) {
    const [open, setOpen] = React.useState(true);

    const initialTime = React.useMemo(() => {
      if (typeof value === 'string' && /^\d{2}:\d{2}$/.test(value)) {
        const [h, m] = value.split(':');
        return { hour: h, minute: m };
      }
      return { hour: '09', minute: '00' };
    }, [value]);

    const [selectedHour, setSelectedHour] = React.useState(initialTime.hour);
    const [selectedMinute, setSelectedMinute] = React.useState(initialTime.minute);

    const handleConfirm = () => {
      const formatted = `${selectedHour}:${selectedMinute}`;
      void commit([{ key: column.key, value: formatted }]);
    };

    const handlePreset = (hour: string, minute: string) => {
      setSelectedHour(hour);
      setSelectedMinute(minute);
      void commit([{ key: column.key, value: `${hour}:${minute}` }]);
    };

    const displayText = typeof value === 'string' && value ? value : '';

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
            className="flex h-full w-full items-center justify-between border-none bg-transparent px-2 text-left text-sm outline-none cursor-pointer"
            aria-label={options.ariaLabel}
            autoFocus
            onKeyDown={event => {
              if (event.key === 'Escape' || event.key === 'Esc') {
                event.preventDefault();
                cancel();
              }
            }}
          >
            <span className="truncate">{displayText || '시간 선택'}</span>
            <Clock className="h-4 w-4 opacity-50 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          container={getPortalContainer()}
          className="w-64 p-3 shadow-lg border border-slate-200 bg-white"
          align="start"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                시간 선택
              </span>
              <span className="font-mono text-sm font-bold text-slate-900">
                {selectedHour}:{selectedMinute}
              </span>
            </div>

            {/* Time Columns (Hour & Minute) */}
            <div className="grid grid-cols-2 gap-2 rounded-md border border-slate-100 bg-slate-50/50 p-1">
              {/* Hours */}
              <div className="flex flex-col">
                <span className="text-center text-[10px] font-semibold text-slate-400 pb-1">시</span>
                <div className="flex max-h-40 flex-col overflow-y-auto pr-1">
                  {HOURS.map(hour => {
                    const isSelected = selectedHour === hour;
                    return (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => setSelectedHour(hour)}
                        className={`rounded py-1 text-xs font-mono transition-colors ${
                          isSelected
                            ? 'bg-slate-900 font-bold text-white'
                            : 'text-slate-700 hover:bg-slate-200/60'
                        }`}
                      >
                        {hour}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Minutes */}
              <div className="flex flex-col">
                <span className="text-center text-[10px] font-semibold text-slate-400 pb-1">분</span>
                <div className="flex max-h-40 flex-col overflow-y-auto pr-1">
                  {MINUTES.map(minute => {
                    const isSelected = selectedMinute === minute;
                    return (
                      <button
                        key={minute}
                        type="button"
                        onClick={() => setSelectedMinute(minute)}
                        className={`rounded py-1 text-xs font-mono transition-colors ${
                          isSelected
                            ? 'bg-slate-900 font-bold text-white'
                            : 'text-slate-700 hover:bg-slate-200/60'
                        }`}
                      >
                        {minute}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1 border-t border-slate-100 pt-2">
              {[
                { label: '09:00', h: '09', m: '00' },
                { label: '11:00', h: '11', m: '00' },
                { label: '14:30', h: '14', m: '30' },
                { label: '16:00', h: '16', m: '00' },
              ].map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handlePreset(p.h, p.m)}
                  className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-1.5 border-t border-slate-100 pt-2">
              <button
                type="button"
                onClick={cancel}
                className="rounded px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
              >
                확인
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  ShadcnTimePickerEditor.displayName = `ShadcnTimePickerEditor(${options.id})`;
  return defineEditorPlugin<T>({
    id: options.id,
    component: ShadcnTimePickerEditor,
  });
}
