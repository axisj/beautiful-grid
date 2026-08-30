export type ThemePalette = Record<string, string>;

const withAlpha = (color: string, alpha: number, fallback: string) => {
  const hex = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1];
  if (!hex) return fallback;

  const normalized = hex.length === 3 ? [...hex].map(value => `${value}${value}`).join('') : hex;
  const [red, green, blue] = [0, 2, 4].map(offset => Number.parseInt(normalized.slice(offset, offset + 2), 16));
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

// Shared default palette. Keep these values identical to the publishable
// library defaults so an unthemed consumer matches every site example.
export const siteGridThemePalette: ThemePalette = {
  '--bgrid-primary-color': '#3073f1',
  '--bgrid-header-bg': '#f3f5f8',
  '--bgrid-header-color': '#20252f',
  '--bgrid-header-hover-bg': '#e4e9ef',
  '--bgrid-header-group-bg': '#e9ecf0',
  '--bgrid-footer-bg': '#f6f7f9',
  '--bgrid-summary-bg': '#eaeff9',
  '--bgrid-border-color-base': '#d3d9e1',
  '--bgrid-border-color-light': '#d9dee4',
  '--bgrid-border-color-subtle': '#ebeff3',
  '--bgrid-header-separator-color': '#d3d9e1',
  '--bgrid-frozen-boundary-color': '#c4ccd6',
  '--bgrid-row-selector-color': '#ffffff',
  '--bgrid-body-bg': '#ffffff',
  '--bgrid-body-color': '#3c434d',
  '--bgrid-body-odd-bg': '#fafbfc',
  '--bgrid-body-hover-bg': '#f1f5fa',
  '--bgrid-body-hover-odd-bg': '#ebf0f7',
  '--bgrid-body-active-bg': '#e1f0ff',
  '--bgrid-row-reorder-guide-color': '#3073f1',
  '--bgrid-row-reorder-preview-bg': '#e1f0ff',
  '--bgrid-cell-selected-bg': '#e1f0ff',
  '--bgrid-cell-selected-border-color': '#4f94f8',
  '--bgrid-active-cell-color': '#3073f1',
  '--bgrid-active-cell-bg': '#ffffff',
  '--bgrid-active-cell-ring-color': '#3073f1',
  '--bgrid-editor-bg': '#ffffff',
  '--bgrid-selection-axis-bg': '#dbeafe',
  '--bgrid-selection-axis-color': '#2c68e7',
  '--bgrid-selection-axis-border-color': '#3b82f6',
  '--bgrid-cell-edited-bg': '#fff7ed',
  '--bgrid-cell-edited-color': '#c2410c',
  '--bgrid-cell-edited-border-color': '#fdba74',
  '--bgrid-cell-value-changed-bg': '#fff7ed',
  '--bgrid-cell-value-changed-color': '#c2410c',
  '--bgrid-cell-value-changed-border-color': '#fdba74',
  '--bgrid-scroll-bg': '#ffffff',
  '--bgrid-scroll-track-bg': '#f4f6f8',
  '--bgrid-scroll-thumb-bg': '#c0c7d6',
  '--bgrid-scroll-thumb-hover-bg': '#979fac',
  '--bgrid-scroll-corner-bg': '#c0c7d6',
  '--bgrid-scrollbar-modern-track-bg': '#eff3f6',
  '--bgrid-scrollbar-modern-thumb-bg': '#aab4c0',
  '--bgrid-scrollbar-modern-thumb-hover-bg': '#8692a1',
  '--bgrid-scrollbar-modern-button-hover-bg': '#e5e9ef',
  '--bgrid-scrollbar-modern-icon-color': '#7b8898',
  '--bgrid-scrollbar-modern-gutter-bg': '#f2f5f8',
  '--bgrid-scrollbar-modern-gutter-border-color': '#dae0e9',
  '--bgrid-scrollbar-classic-border-color': '#b8c0ca',
  '--bgrid-scrollbar-classic-gutter-bg': '#f2f5f8',
  '--bgrid-scrollbar-classic-gutter-border-color': '#dae0e9',
  '--bgrid-scrollbar-classic-track-bg': '#f4f6f8',
  '--bgrid-scrollbar-classic-thumb-bg': '#d9dee4',
  '--bgrid-scrollbar-classic-thumb-hover-bg': '#c0c7d6',
  '--bgrid-scrollbar-classic-button-bg': '#f6f7f9',
  '--bgrid-scrollbar-classic-button-hover-bg': '#e5e9ef',
  '--bgrid-scrollbar-classic-icon-color': '#3c434d',
  '--bgrid-loading-bg': 'rgba(48, 115, 241, 0.08)',
  '--bgrid-loading-color': 'rgba(48, 115, 241, 0.18)',
  '--bgrid-loading-second-color': '#64748b',
  '--bgrid-toolbox-bg': '#ffffff',
  '--bgrid-toolbox-color': '#334155',
  '--bgrid-toolbox-muted-color': '#64748b',
  '--bgrid-toolbox-control-bg': '#ffffff',
  '--bgrid-toolbox-control-color': '#334155',
  '--bgrid-toolbox-control-border-color': '#d4dce8',
  '--bgrid-toolbox-control-placeholder-color': '#94a3b8',
  '--bgrid-toolbox-hover-bg': '#eff6ff',
  '--bgrid-toolbox-active-bg': '#dbeafe',
  '--bgrid-toolbox-danger-color': '#dc2626',
  '--bgrid-toolbox-danger-bg': '#fef2f2',
  '--bgrid-toolbox-button-bg': '#f8fafc',
  '--bgrid-toolbox-primary-hover-color': '#1d4ed8',
  '--bgrid-toolbox-primary-contrast-color': '#ffffff',
  '--bgrid-toolbox-notice-bg': '#f8fafc',
  '--bgrid-toolbox-scroll-thumb-bg': '#b8c2d1',
  '--bgrid-toolbox-scroll-track-bg': '#f1f5f9',
  '--bgrid-toolbox-focus-ring-color': '#bfdbfe',
  '--bgrid-search-bg': '#ffffff',
  '--bgrid-search-color': '#334155',
  '--bgrid-search-border-color': '#d4dce8',
  '--bgrid-search-control-bg': '#f8fafc',
  '--bgrid-search-control-color': '#1f2937',
  '--bgrid-search-control-border-color': '#cbd5e1',
  '--bgrid-search-muted-color': '#64748b',
  '--bgrid-search-focus-ring-color': '#3b82f6',
  '--bgrid-search-button-hover-bg': '#f1f5f9',
  '--bgrid-search-match-bg': 'rgba(250, 204, 21, 0.28)',
  '--bgrid-search-match-border-color': '#ca8a04',
  '--bgrid-search-current-bg': 'rgba(249, 115, 22, 0.3)',
  '--bgrid-search-current-border-color': '#f97316',
  '--bgrid-context-menu-bg': '#ffffff',
  '--bgrid-context-menu-color': '#334155',
  '--bgrid-context-menu-border-color': '#d4dce8',
  '--bgrid-context-menu-hover-bg': '#eff6ff',
  '--bgrid-context-menu-muted-color': '#64748b',
  '--bgrid-floating-z-editor': '9999',
  '--bgrid-floating-z-toolbox': '20',
  '--bgrid-floating-z-context-menu': '30',
  '--bgrid-search-z-index': '31',
};

export const createGridTheme = (overrides: ThemePalette): ThemePalette => {
  const theme = { ...siteGridThemePalette, ...overrides };
  if (Object.keys(overrides).length === 0) return theme;

  return {
    ...theme,
    '--bgrid-row-reorder-guide-color': overrides['--bgrid-row-reorder-guide-color'] ?? theme['--bgrid-primary-color'],
    '--bgrid-row-reorder-preview-bg': overrides['--bgrid-row-reorder-preview-bg'] ?? theme['--bgrid-body-active-bg'],
    '--bgrid-active-cell-color': overrides['--bgrid-active-cell-color'] ?? theme['--bgrid-primary-color'],
    '--bgrid-active-cell-bg': overrides['--bgrid-active-cell-bg'] ?? theme['--bgrid-body-bg'],
    '--bgrid-active-cell-ring-color': overrides['--bgrid-active-cell-ring-color'] ?? theme['--bgrid-primary-color'],
    '--bgrid-editor-bg': overrides['--bgrid-editor-bg'] ?? theme['--bgrid-body-bg'],
    '--bgrid-scroll-bg': overrides['--bgrid-scroll-bg'] ?? theme['--bgrid-body-bg'],
    '--bgrid-scroll-track-bg': overrides['--bgrid-scroll-track-bg'] ?? theme['--bgrid-scrollbar-modern-track-bg'],
    '--bgrid-scroll-thumb-bg': overrides['--bgrid-scroll-thumb-bg'] ?? theme['--bgrid-scrollbar-modern-thumb-bg'],
    '--bgrid-scroll-thumb-hover-bg':
      overrides['--bgrid-scroll-thumb-hover-bg'] ?? theme['--bgrid-scrollbar-modern-thumb-hover-bg'],
    '--bgrid-scroll-corner-bg': overrides['--bgrid-scroll-corner-bg'] ?? theme['--bgrid-scrollbar-modern-thumb-bg'],
    '--bgrid-scrollbar-classic-border-color':
      overrides['--bgrid-scrollbar-classic-border-color'] ?? theme['--bgrid-frozen-boundary-color'],
    '--bgrid-scrollbar-classic-gutter-bg':
      overrides['--bgrid-scrollbar-classic-gutter-bg'] ?? theme['--bgrid-scrollbar-modern-gutter-bg'],
    '--bgrid-scrollbar-classic-gutter-border-color':
      overrides['--bgrid-scrollbar-classic-gutter-border-color'] ?? theme['--bgrid-scrollbar-modern-gutter-border-color'],
    '--bgrid-scrollbar-classic-track-bg':
      overrides['--bgrid-scrollbar-classic-track-bg'] ?? theme['--bgrid-scrollbar-modern-track-bg'],
    '--bgrid-scrollbar-classic-thumb-bg':
      overrides['--bgrid-scrollbar-classic-thumb-bg'] ?? theme['--bgrid-border-color-light'],
    '--bgrid-scrollbar-classic-thumb-hover-bg':
      overrides['--bgrid-scrollbar-classic-thumb-hover-bg'] ?? theme['--bgrid-scrollbar-modern-thumb-bg'],
    '--bgrid-scrollbar-classic-button-bg': overrides['--bgrid-scrollbar-classic-button-bg'] ?? theme['--bgrid-footer-bg'],
    '--bgrid-scrollbar-classic-button-hover-bg':
      overrides['--bgrid-scrollbar-classic-button-hover-bg'] ?? theme['--bgrid-scrollbar-modern-button-hover-bg'],
    '--bgrid-scrollbar-classic-icon-color':
      overrides['--bgrid-scrollbar-classic-icon-color'] ?? theme['--bgrid-body-color'],
    '--bgrid-loading-bg':
      overrides['--bgrid-loading-bg'] ??
      withAlpha(theme['--bgrid-primary-color'], 0.08, siteGridThemePalette['--bgrid-loading-bg']),
    '--bgrid-loading-color':
      overrides['--bgrid-loading-color'] ??
      withAlpha(theme['--bgrid-primary-color'], 0.18, siteGridThemePalette['--bgrid-loading-color']),
    '--bgrid-loading-second-color': overrides['--bgrid-loading-second-color'] ?? theme['--bgrid-primary-color'],
    '--bgrid-search-bg': overrides['--bgrid-search-bg'] ?? theme['--bgrid-toolbox-bg'],
    '--bgrid-search-color': overrides['--bgrid-search-color'] ?? theme['--bgrid-toolbox-color'],
    '--bgrid-search-border-color':
      overrides['--bgrid-search-border-color'] ?? theme['--bgrid-toolbox-control-border-color'],
    '--bgrid-search-control-bg': overrides['--bgrid-search-control-bg'] ?? theme['--bgrid-toolbox-control-bg'],
    '--bgrid-search-control-color': overrides['--bgrid-search-control-color'] ?? theme['--bgrid-toolbox-control-color'],
    '--bgrid-search-control-border-color':
      overrides['--bgrid-search-control-border-color'] ?? theme['--bgrid-toolbox-control-border-color'],
    '--bgrid-search-muted-color': overrides['--bgrid-search-muted-color'] ?? theme['--bgrid-toolbox-muted-color'],
    '--bgrid-search-focus-ring-color': overrides['--bgrid-search-focus-ring-color'] ?? theme['--bgrid-primary-color'],
    '--bgrid-search-button-hover-bg': overrides['--bgrid-search-button-hover-bg'] ?? theme['--bgrid-toolbox-hover-bg'],
    '--bgrid-context-menu-bg': overrides['--bgrid-context-menu-bg'] ?? theme['--bgrid-toolbox-bg'],
    '--bgrid-context-menu-color': overrides['--bgrid-context-menu-color'] ?? theme['--bgrid-toolbox-color'],
    '--bgrid-context-menu-border-color':
      overrides['--bgrid-context-menu-border-color'] ?? theme['--bgrid-toolbox-control-border-color'],
    '--bgrid-context-menu-hover-bg': overrides['--bgrid-context-menu-hover-bg'] ?? theme['--bgrid-toolbox-hover-bg'],
    '--bgrid-context-menu-muted-color':
      overrides['--bgrid-context-menu-muted-color'] ?? theme['--bgrid-toolbox-muted-color'],
  };
};
