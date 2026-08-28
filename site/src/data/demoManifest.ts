export interface DemoManifestItem {
  componentFile: string;
  sourceFiles: string[];
  minHeight: number;
}

const dataGridContainerSources = [
  'components/DataGridContainer.tsx',
  'components/DataGridContainer.css',
  'hooks/useContainerSize.ts',
];

const withContainerSources = (exampleFile: string) => [`examples/${exampleFile}`, ...dataGridContainerSources];
const editingExampleSources = [
  'examples/editing/shared.ts',
  'examples/editing/editingExamples.css',
];
const editingIconSources = [...editingExampleSources, 'examples/editing/editorIcons.tsx'];

export const demoManifest: Record<string, DemoManifestItem> = {
  basic: {
    componentFile: 'BasicExample.tsx',
    sourceFiles: withContainerSources('BasicExample.tsx'),
    minHeight: 450,
  },
  'item-render': {
    componentFile: 'ItemRenderExample.tsx',
    sourceFiles: [
      'examples/ItemRenderExample.tsx',
      'examples/ItemRenderExample.css',
      ...dataGridContainerSources,
    ],
    minHeight: 560,
  },
  'sorting-filtering': {
    componentFile: 'ToolboxExample.tsx',
    sourceFiles: withContainerSources('ToolboxExample.tsx'),
    minHeight: 520,
  },
  search: {
    componentFile: 'SearchExample.tsx',
    sourceFiles: withContainerSources('SearchExample.tsx'),
    minHeight: 620,
  },
  'context-menu': {
    componentFile: 'ContextMenuExample.tsx',
    sourceFiles: withContainerSources('ContextMenuExample.tsx'),
    minHeight: 620,
  },
  'virtual-scroll': {
    componentFile: 'ScrollExample.tsx',
    sourceFiles: withContainerSources('ScrollExample.tsx'),
    minHeight: 500,
  },
  editing: {
    componentFile: 'BasicEditingExample.tsx',
    sourceFiles: [...withContainerSources('BasicEditingExample.tsx'), ...editingExampleSources],
    minHeight: 500,
  },
  'built-in-editors': {
    componentFile: 'BuiltInEditorsExample.tsx',
    sourceFiles: [
      ...withContainerSources('BuiltInEditorsExample.tsx'),
      ...editingIconSources,
      'beautiful-grid/editors/createSelectEditorPlugin.tsx',
      'beautiful-grid/editors/createDateEditorPlugin.tsx',
    ],
    minHeight: 500,
  },
  'editor-plugins': {
    componentFile: 'ExternalEditorPluginExample.tsx',
    sourceFiles: [
      ...withContainerSources('ExternalEditorPluginExample.tsx'),
      ...editingIconSources,
      'examples/editor-plugins/antdEditorPlugins.css',
      'examples/editor-plugins/createAntdCascaderEditorPlugin.tsx',
      'examples/editor-plugins/createAntdColorPickerEditorPlugin.tsx',
      'examples/editor-plugins/createAntdDatePickerEditorPlugin.tsx',
      'examples/editor-plugins/createAntdSelectEditorPlugin.tsx',
      'examples/editor-plugins/createAntdTimePickerEditorPlugin.tsx',
      'examples/editor-plugins/createAntdTreeSelectEditorPlugin.tsx',
      'beautiful-grid/editors/defineEditorPlugin.ts',
    ],
    minHeight: 500,
  },
  'editor-plugins-shadcn': {
    componentFile: 'ExternalShadcnEditorPluginExample.tsx',
    sourceFiles: [
      ...withContainerSources('ExternalShadcnEditorPluginExample.tsx'),
      ...editingIconSources,
      'examples/editor-plugins/createShadcnSelectEditorPlugin.tsx',
      'examples/editor-plugins/createShadcnDatePickerEditorPlugin.tsx',
      'examples/editor-plugins/createShadcnColorPickerEditorPlugin.tsx',
      'examples/editor-plugins/createShadcnCascaderEditorPlugin.tsx',
      'examples/editor-plugins/createShadcnTimePickerEditorPlugin.tsx',
      'examples/editor-plugins/createShadcnTreeSelectEditorPlugin.tsx',
      'components/ui/select.tsx',
      'components/ui/popover.tsx',
      'components/ui/utils.ts',
      'beautiful-grid/editors/defineEditorPlugin.ts',
    ],
    minHeight: 500,
  },
  'editor-icons': {
    componentFile: 'EditorIconExample.tsx',
    sourceFiles: [...withContainerSources('EditorIconExample.tsx'), ...editingIconSources],
    minHeight: 500,
  },
  'lookup-editor': {
    componentFile: 'LookupEditorExample.tsx',
    sourceFiles: [
      ...withContainerSources('LookupEditorExample.tsx'),
      ...editingIconSources,
      'examples/LookupEditorExample.css',
      'beautiful-grid/editors/defineEditorPlugin.ts',
    ],
    minHeight: 540,
  },
  'editing-events': {
    componentFile: 'EditingEventsExample.tsx',
    sourceFiles: [
      ...withContainerSources('EditingEventsExample.tsx'),
      'examples/EditingEventsExample.css',
      ...editingExampleSources,
    ],
    minHeight: 560,
  },
  'editing-merged-cells': {
    componentFile: 'MergedCellEditingExample.tsx',
    sourceFiles: [...withContainerSources('MergedCellEditingExample.tsx'), ...editingExampleSources],
    minHeight: 530,
  },
  'cell-navigation': {
    componentFile: 'CellNavigationExample.tsx',
    sourceFiles: withContainerSources('CellNavigationExample.tsx'),
    minHeight: 590,
  },
  'row-selection': {
    componentFile: 'CheckedExample.tsx',
    sourceFiles: withContainerSources('CheckedExample.tsx'),
    minHeight: 480,
  },
  'cell-merge': {
    componentFile: 'CellMergeExample.tsx',
    sourceFiles: withContainerSources('CellMergeExample.tsx'),
    minHeight: 480,
  },
  summary: {
    componentFile: 'SummaryExample.tsx',
    sourceFiles: withContainerSources('SummaryExample.tsx'),
    minHeight: 480,
  },
  pivot: {
    componentFile: 'PivotExample.tsx',
    sourceFiles: withContainerSources('PivotExample.tsx'),
    minHeight: 520,
  },
  pagination: {
    componentFile: 'PagingExample.tsx',
    sourceFiles: withContainerSources('PagingExample.tsx'),
    minHeight: 450,
  },
  'column-groups': {
    componentFile: 'ColumnsGroupExample.tsx',
    sourceFiles: ['examples/ColumnsGroupExample.tsx', 'examples/ColumnsGroupExample.css', ...dataGridContainerSources],
    minHeight: 620,
  },
  'frozen-columns': {
    componentFile: 'FrozenColumnsExample.tsx',
    sourceFiles: withContainerSources('FrozenColumnsExample.tsx'),
    minHeight: 560,
  },
  'column-reorder': {
    componentFile: 'ColumnSortExample.tsx',
    sourceFiles: withContainerSources('ColumnSortExample.tsx'),
    minHeight: 500,
  },
  'row-reorder': {
    componentFile: 'ReorderExample.tsx',
    sourceFiles: withContainerSources('ReorderExample.tsx'),
    minHeight: 480,
  },
  'line-number': {
    componentFile: 'LineNumberExample.tsx',
    sourceFiles: withContainerSources('LineNumberExample.tsx'),
    minHeight: 450,
  },
  sorting: {
    componentFile: 'SortExample.tsx',
    sourceFiles: withContainerSources('SortExample.tsx'),
    minHeight: 500,
  },
  loading: {
    componentFile: 'LoadingExample.tsx',
    sourceFiles: withContainerSources('LoadingExample.tsx'),
    minHeight: 450,
  },
  focus: {
    componentFile: 'FocusExample.tsx',
    sourceFiles: withContainerSources('FocusExample.tsx'),
    minHeight: 450,
  },
  'row-styling': {
    componentFile: 'GetRowClassName.tsx',
    sourceFiles: withContainerSources('GetRowClassName.tsx'),
    minHeight: 450,
  },
  theming: {
    componentFile: 'ThemingExample.tsx',
    sourceFiles: [
      'examples/ThemingExample.tsx',
      'examples/ThemingExample.css',
      ...dataGridContainerSources,
    ],
    minHeight: 610,
  },
  variant: {
    componentFile: 'VariantExample.tsx',
    sourceFiles: withContainerSources('VariantExample.tsx'),
    minHeight: 500,
  },
  scrollbar: {
    componentFile: 'ScrollbarExample.tsx',
    sourceFiles: withContainerSources('ScrollbarExample.tsx'),
    minHeight: 500,
  },
  'container-resize': {
    componentFile: 'ContainerResizeExample.tsx',
    sourceFiles: withContainerSources('ContainerResizeExample.tsx'),
    minHeight: 540,
  },
};
