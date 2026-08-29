import * as React from 'react';
import type { BGridEditorPluginProps, BGridPluginEditorConfig } from 'beautiful-grid';
import { defineEditorPlugin } from 'beautiful-grid/editors';
import { Check, ChevronDown, ChevronRight, Folder, GitBranch, Search } from 'lucide-react';
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
            <span className="truncate">{currentValue || t('조직 선택', 'Select Organization')}</span>
            <GitBranch className="h-4 w-4 opacity-50 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          container={getPortalContainer()}
          className="w-64 p-3"
          align="start"
        >
          <div className="flex flex-col gap-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              {t('조직도 선택', 'Select Organization Chart')}
            </div>

            {/* Search filter */}
            <div className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 dark:border-slate-800 dark:bg-slate-900/70">
              <Search className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('조직 검색...', 'Search organization...')}
                className="w-full bg-transparent text-xs outline-none border-0 p-0 text-slate-900 placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Tree nodes list */}
            <div className="bgrid-shadcn-scroll flex max-h-52 flex-col overflow-y-auto pt-1">
              {filteredTree.map(group => {
                const isExpanded = expandedGroups[group.title] ?? true;
                const hasChildren = Boolean(group.children?.length);

                return (
                  <div key={group.title} className="flex flex-col">
                    {/* Group Header */}
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.title)}
                      className="flex items-center gap-1.5 rounded-sm px-1.5 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer border-0 bg-transparent"
                    >
                      {hasChildren ? (
                        isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                        )
                      ) : (
                        <span className="w-3.5" />
                      )}
                      <Folder className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{group.title}</span>
                    </button>

                    {/* Children */}
                    {hasChildren && isExpanded && (
                      <div className="ml-4 flex flex-col border-l border-slate-100 pl-1 dark:border-slate-800">
                        {group.children?.map(child => {
                          const childVal = child.value || child.title;
                          const isSelected = currentValue === childVal;

                          return (
                            <button
                              key={childVal}
                              type="button"
                              onClick={() => handleSelectNode(childVal)}
                              className={`flex items-center justify-between rounded-sm px-2 py-1.5 text-left text-xs transition-colors cursor-pointer border-0 bg-transparent ${
                                isSelected
                                  ? 'bg-slate-900 font-semibold text-white dark:bg-slate-50 dark:text-slate-900'
                                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                              }`}
                            >
                              <span className="truncate">{child.title}</span>
                              {isSelected && <Check className="h-3.5 w-3.5" />}
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
