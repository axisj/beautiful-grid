import { productFacts } from './productFacts';

const siteUrl = 'https://bgrid.axisj.com';
const sourceUrl = 'https://raw.githubusercontent.com/axisj/beautiful-grid/main';

export interface AiContextLink {
  title: string;
  url: string;
  description: string;
}

export const aiContextBenchmarkSlugs = [
  'getting-started',
  'data-and-columns',
  'editing',
  'sorting-filtering',
  'cell-merge',
  'virtual-scroll',
] as const;

export const essentialAiContextLinks: AiContextLink[] = [
  {
    title: 'Getting started',
    url: `${siteUrl}/en/learn/getting-started.md`,
    description: 'Install the package, import the stylesheet, size the container, and render a typed first grid.',
  },
  {
    title: 'TypeScript API reference',
    url: `${siteUrl}/en/api/props.md`,
    description: 'Machine-readable public interfaces, exact declarations, members, required flags, and deprecations.',
  },
  {
    title: 'Public TypeScript source',
    url: `${sourceUrl}/beautiful-grid/types.ts`,
    description: 'Source of truth for every public and internal grid type.',
  },
  {
    title: 'Package README',
    url: `${sourceUrl}/README.md`,
    description: 'Installation, major workflows, public props, licensing, and package usage in one document.',
  },
  {
    title: 'Machine-readable product facts',
    url: `${siteUrl}/product-facts.json`,
    description: 'Current version, runtime baseline, feature support, limitations, license, and project URLs.',
  },
];

export const taskAiContextLinks: AiContextLink[] = [
  ['Data and columns', 'data-and-columns', 'Shape wrapped row data, define columns, use nested keys, and keep row identity stable.'],
  ['Cell editing', 'editing', 'Implement edit transactions, validation, immutable row updates, and post-save movement.'],
  ['Built-in editors', 'built-in-editors', 'Configure text and checkbox editors, header selection, value mapping, and accessibility labels.'],
  ['Editor plugins', 'editor-plugins', 'Connect custom or third-party editors with commit, cancel, movement, and portal contracts.'],
  ['Sorting and filtering', 'sorting-filtering', 'Control multi-sort, value/text/number filters, and server-side query state.'],
  ['Search', 'search', 'Configure grid search, controlled state, keyboard shortcuts, result navigation, and labels.'],
  ['Cell merge', 'cell-merge', 'Merge consecutive values with columnsMap and understand grouping constraints.'],
  ['Summary rows', 'summary', 'Render top or bottom summaries and custom aggregate cells.'],
  ['Pivot', 'pivot', 'Configure row and column axes, aggregate values, and custom pivot rendering.'],
  ['Virtual scroll', 'virtual-scroll', 'Understand viewport sizing, rendered row ranges, large datasets, and browser height limits.'],
  ['Frozen columns and rows', 'frozen-columns', 'Keep leading columns and rows visible while preserving scroll behavior.'],
  ['Cell navigation', 'cell-navigation', 'Control active cells, keyboard movement, editing activation, and accessibility constraints.'],
  ['Column groups', 'column-groups', 'Build recursive grouped headers and handle groups across frozen boundaries.'],
  ['Theming', 'theming', 'Apply CSS variables, scope themes, style changed cells, and theme portal-based UI.'],
].map(([title, slug, description]) => ({
  title,
  url: `${siteUrl}/en/learn/${slug}.md`,
  description,
})).concat({
  title: 'Cell selection and clipboard',
  url: `${sourceUrl}/docs/cell-selection.md`,
  description: 'Configure rectangular selection, copy/paste limits, parsing, and errors.',
});

export const exampleAiContextLinks: AiContextLink[] = [
  {
    title: 'Basic grid example source',
    url: `${sourceUrl}/examples/BasicExample.tsx`,
    description: 'Minimal executable BGrid component with typed rows and columns.',
  },
  {
    title: 'Cell merge example source',
    url: `${sourceUrl}/examples/CellMergeExample.tsx`,
    description: 'Executable columnsMap merge configuration with grouped sample data.',
  },
  {
    title: 'Summary example source',
    url: `${sourceUrl}/examples/SummaryExample.tsx`,
    description: 'Executable summary configuration with custom aggregate rendering.',
  },
  {
    title: 'Editing example source',
    url: `${sourceUrl}/examples/BasicEditingExample.tsx`,
    description: 'Executable immutable edit-save flow using the public transaction callbacks.',
  },
];

function renderLinks(links: AiContextLink[]) {
  return links.map(link => `- [${link.title}](${link.url}): ${link.description}`).join('\n');
}

export function renderLlmsText() {
  return `# BeautifulGrid

> ${productFacts.summary.en}. Package \`${productFacts.packageName}\` ${productFacts.version}, licensed under ${productFacts.licenseName}.

BeautifulGrid is a client-side React component. Use the Markdown resources below instead of scraping the rendered documentation HTML when preparing implementation context.

Important implementation constraints:

- Import \`beautiful-grid/style.css\` once; the component does not inject its runtime styles.
- Wrap every domain row as \`{ values: T }\` and read domain values from \`item.values\`.
- Provide numeric \`width\` and \`height\`; observe the parent container when the viewport is responsive.
- Treat \`beautiful-grid/types.ts\` as the source of truth. The public API reference is generated from that file.
- Use \`key: string[]\` for nested values. Do not encode a nested path as one dotted string.
- Editing is controlled through immutable callbacks. Preserve the supplied metadata when saving edited rows.
- React ^19.2.0 and Node.js >=22.12.0 are the documented project baselines; validate dense workflows in target browsers.

## Essential documentation

${renderLinks(essentialAiContextLinks)}

## Task guides

${renderLinks(taskAiContextLinks)}

## Runnable source examples

${renderLinks(exampleAiContextLinks)}

## Optional

- [All English guides](${siteUrl}/en/learn): Human-facing guide catalog with live demos and related-document navigation.
- [GitHub repository](${productFacts.repositoryUrl}): Complete source, tests, issues, releases, and contribution history.
- [npm package](${productFacts.npmUrl}): Published package metadata and release versions.
`;
}
