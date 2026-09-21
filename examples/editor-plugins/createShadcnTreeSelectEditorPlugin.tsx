import * as React from 'react';
import type { BGridEditorPluginProps, BGridPluginEditorConfig } from 'beautiful-grid';
import { defineEditorPlugin } from 'beautiful-grid/editors';
import { Check, ChevronDown, ChevronRight, Folder, Search } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover';
import './shadcnEditorPlugins.css';
import { t } from '../i18n';

export interface TreeNode {
  title: string;
  value?: string;
  children?: TreeNode[];
}

interface Options {
  id: string;
  ariaLabel: string;
  treeData: TreeNode[];
}

export function createShadcnTreeSelectEditorPlugin<T>(
  options: Options,
): BGridPluginEditorConfig<T> {
  function ShadcnTreeSelectEditor({
    value,
    column,
    commit,
    cancel,
    getPortalContainer,
  }: BGridEditorPluginProps<T>) {
    const [open, setOpen] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({
      [t('영업본부', 'Sales Headquarters')]: true,
      [t('운영본부', 'Operations Headquarters')]: true,
    });

    const toggleGroup = (title: string) => {
      setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
    };

    const handleSelectNode = (nodeValue: string) => {
      void commit([{ key: column.key, value: nodeValue }]);
    };

    const currentValue = typeof value === 'string' ? value : '';

    // Filter nodes by query
    const filteredTree = React.useMemo(() => {
      if (!searchQuery.trim()) return options.treeData;
      const query = searchQuery.toLowerCase();

      return options.treeData
        .map(group => {
          const groupMatches = group.title.toLowerCase().includes(query);
          const filteredChildren = group.children?.filter(
            child =>
              child.title.toLowerCase().includes(query) ||
              (child.value && child.value.toLowerCase().includes(query)),
          );

          if (groupMatches || (filteredChildren && filteredChildren.length > 0)) {
            return {
              ...group,
              children: filteredChildren ?? group.children,
            };
          }
          return null;
        })
        .filter(Boolean) as TreeNode[];
    }, [searchQuery]);

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
            <span className="bgrid-shadcn-trigger-label">{currentValue || t('조직 선택', 'Select Organization')}</span>
            <span className="bgrid-shadcn-trigger-icon">
              <ChevronDown />
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          container={getPortalContainer()}
          className="w-72 p-3"
          align="start"
        >
          <div className="flex flex-col gap-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              {t('조직도 선택', 'Select Organization Chart')}
            </div>

            {/* Search filter */}
            <div className="flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 dark:border-slate-700 dark:bg-slate-900">
              <Search className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('조직 검색...', 'Search organization...')}
                className="w-full bg-transparent text-xs outline-none border-0 p-0 text-slate-900 placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Tree nodes list */}
            <div className="bgrid-shadcn-scroll flex max-h-56 flex-col gap-1 overflow-y-auto pt-1">
              {filteredTree.map(group => {
                const isExpanded = expandedGroups[group.title] ?? true;
                const hasChildren = Boolean(group.children?.length);

                return (
                  <div key={group.title} className="flex flex-col gap-0.5">
                    {/* Group Header */}
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.title)}
                      className="bgrid-shadcn-tree-group flex h-7 min-h-[28px] w-full items-center gap-1.5 rounded-md px-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer border-0 bg-transparent"
                    >
                      {hasChildren ? (
                        isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        )
                      ) : (
                        <span className="w-3.5 shrink-0" />
                      )}
                      <Folder className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="truncate">{group.title}</span>
                    </button>

                    {/* Children */}
                    {hasChildren && isExpanded && (
                      <div className="ml-3.5 my-0.5 flex flex-col gap-0.5 border-l border-slate-200 pl-2 dark:border-slate-800">
                        {group.children?.map(child => {
                          const childVal = child.value || child.title;
                          const isSelected = currentValue === childVal;

                          return (
                            <button
                              key={childVal}
                              type="button"
                              onClick={() => handleSelectNode(childVal)}
                              className={`bgrid-shadcn-tree-item flex h-7 min-h-[28px] w-full items-center justify-between rounded-md px-2.5 text-left text-xs transition-colors cursor-pointer border-0 bg-transparent ${
                                isSelected
                                  ? 'bg-blue-600 font-medium text-white shadow-sm dark:bg-blue-600 dark:text-white'
                                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                              }`}
                            >
                              <span className="truncate">{child.title}</span>
                              {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-white ml-2" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  ShadcnTreeSelectEditor.displayName = `ShadcnTreeSelectEditor(${options.id})`;
  return defineEditorPlugin<T>({
    id: options.id,
    component: ShadcnTreeSelectEditor,
  });
}
