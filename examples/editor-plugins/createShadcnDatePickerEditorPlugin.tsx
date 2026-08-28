import * as React from 'react';
import type { BGridEditorPluginProps, BGridPluginEditorConfig } from 'beautiful-grid';
import { defineEditorPlugin } from 'beautiful-grid/editors';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover';

interface Options {
  id: string;
  ariaLabel: string;
}

export function createShadcnDatePickerEditorPlugin<T>(
  options: Options,
): BGridPluginEditorConfig<T> {
  function ShadcnDatePickerEditor({
    value,
    column,
    commit,
    cancel,
    getPortalContainer,
  }: BGridEditorPluginProps<T>) {
    const [open, setOpen] = React.useState(true);

    // Parse current date value (YYYY-MM-DD)
    const initialDate = React.useMemo(() => {
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split('-').map(Number);
        return new Date(year, month - 1, day);
      }
      return new Date();
    }, [value]);

    const [currentMonth, setCurrentMonth] = React.useState(
      new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
    );

    const handleSelectDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      void commit([{ key: column.key, value: dateStr }]);
    };

    const handlePrevMonth = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleQuickPreset = (offsetDays: number) => {
      const target = new Date();
      target.setDate(target.getDate() + offsetDays);
      handleSelectDate(target);
    };

    // Calculate calendar grid days
    const calendarDays = React.useMemo(() => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();

      const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const daysInPrevMonth = new Date(year, month, 0).getDate();

      const days: Array<{ date: Date; isCurrentMonth: boolean; dateStr: string }> = [];

      // Prev month trailing days
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const d = new Date(year, month - 1, daysInPrevMonth - i);
        days.push({
          date: d,
          isCurrentMonth: false,
          dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        });
      }

      // Current month days
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        days.push({
          date: d,
          isCurrentMonth: true,
          dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        });
      }

      // Next month leading days to complete grid (up to 35 or 42)
      const remaining = (7 - (days.length % 7)) % 7;
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        days.push({
          date: d,
          isCurrentMonth: false,
          dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        });
      }

      return days;
    }, [currentMonth]);

    const formattedValue = typeof value === 'string' ? value : '';
    const todayStr = new Date().toISOString().slice(0, 10);

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
            <span className="truncate">{formattedValue || '날짜 선택'}</span>
            <CalendarIcon className="h-4 w-4 opacity-50 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          container={getPortalContainer()}
          className="w-auto p-3 shadow-lg border border-slate-200 bg-white"
          align="start"
        >
          <div className="flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">
                {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  aria-label="이전 달"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  aria-label="다음 달"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400">
              <span>일</span>
              <span>월</span>
              <span>화</span>
              <span>수</span>
              <span>목</span>
              <span>금</span>
              <span>토</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map(({ date, isCurrentMonth, dateStr }) => {
                const isSelected = dateStr === formattedValue;
                const isToday = dateStr === todayStr;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => handleSelectDate(date)}
                    className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-slate-900 text-white font-bold'
                        : isToday
                        ? 'border border-slate-900 text-slate-900 font-bold'
                        : isCurrentMonth
                        ? 'text-slate-800 hover:bg-slate-100'
                        : 'text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Quick Presets */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickPreset(0)}
                className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                오늘
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(1)}
                className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                내일
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(7)}
                className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                1주일 후
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  ShadcnDatePickerEditor.displayName = `ShadcnDatePickerEditor(${options.id})`;
  return defineEditorPlugin<T>({
    id: options.id,
    component: ShadcnDatePickerEditor,
  });
}
