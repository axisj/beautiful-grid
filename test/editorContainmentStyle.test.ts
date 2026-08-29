import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const libraryCss = readFileSync(resolve(process.cwd(), 'beautiful-grid/style.css'), 'utf8');
const lookupEditorCss = readFileSync(resolve(process.cwd(), 'examples/LookupEditorExample.css'), 'utf8');
const editingEventsCss = readFileSync(resolve(process.cwd(), 'examples/EditingEventsExample.css'), 'utf8');

describe('Cell editor containment styles', () => {
  it('clips editing content at the cell boundary', () => {
    expect(libraryCss).toMatch(
      /td\.bgrid-cell-editing\s*\{[^}]*position:\s*relative;[^}]*overflow:\s*hidden;/s,
    );
    expect(libraryCss).toMatch(
      /td\.bgrid-cell-editing\s*\{[^}]*background-color:\s*var\(--bgrid-editor-bg,\s*var\(--bgrid-body-bg,\s*#ffffff\)\);/s,
    );
  });

  it('pins rows, cell content, and plugin hosts to the configured cell height', () => {
    expect(libraryCss).toMatch(
      /\.bgrid-body-table\s*>\s*tbody\s*>\s*tr\s*>\s*td\s*\{[^}]*box-sizing:\s*border-box;[^}]*height:\s*var\(--bgrid-item-cell-height,/s,
    );
    expect(libraryCss).toMatch(
      /\.bgrid-body-table\s*>\s*tbody\s*>\s*tr\.bgrid-body-row\s*\{[^}]*height:\s*var\(--bgrid-item-cell-height,[^}]*max-height:\s*var\(--bgrid-item-cell-height,/s,
    );
    expect(libraryCss).toMatch(
      /\.bgrid-cell-content\s*\{[^}]*height:\s*calc\(var\(--bgrid-item-cell-height,[^}]*- 1px\);[^}]*max-height:\s*calc\(var\(--bgrid-item-cell-height,[^}]*- 1px\);[^}]*overflow:\s*hidden;/s,
    );
    expect(libraryCss).toMatch(
      /\.bgrid-cell-value\s*\{[^}]*min-height:\s*0;[^}]*max-height:\s*100%;[^}]*overflow:\s*hidden;/s,
    );
    expect(libraryCss).toMatch(
      /\.bgrid-plugin-editor-host\s*\{[^}]*height:\s*calc\(var\(--bgrid-item-cell-height,[^}]*- 1px\);[^}]*max-height:\s*calc\(var\(--bgrid-item-cell-height,[^}]*- 1px\);[^}]*overflow:\s*hidden;/s,
    );
  });

  it('keeps regular editing content inset but lets plugin editors fill the cell', () => {
    expect(libraryCss).toMatch(
      /td\.bgrid-cell-editing\s*>\s*\.bgrid-cell-content\s*\{[^}]*padding:\s*0 6\.5px;/s,
    );
    expect(libraryCss).toMatch(
      /td\.bgrid-cell-editing\s*>\s*\.bgrid-cell-content-plugin-editor\s*\{[^}]*padding:\s*0;/s,
    );
  });

  it('keeps the persistent text input inside its measured cell box', () => {
    expect(libraryCss).toMatch(
      /\.bgrid-text-editor-gateway\.bgrid-text-editor-active\s*\{[^}]*box-sizing:\s*border-box;[^}]*max-width:\s*100%;[^}]*max-height:\s*100%;[^}]*overflow:\s*hidden;[^}]*appearance:\s*none;/s,
    );
  });

  it('constrains plugin and native editor surfaces', () => {
    expect(libraryCss).toMatch(
      /\.bgrid-plugin-editor-host\s*\{[^}]*box-sizing:\s*border-box;[^}]*max-width:\s*100%;[^}]*max-height:\s*calc\(var\(--bgrid-item-cell-height,[^}]*- 1px\);[^}]*overflow:\s*hidden;/s,
    );
    expect(libraryCss).toMatch(
      /\.bgrid-native-select-editor,\s*\.bgrid-native-date-editor\s*\{[^}]*box-sizing:\s*border-box;[^}]*max-width:\s*100%;[^}]*max-height:\s*100%;[^}]*overflow:\s*hidden;/s,
    );
  });

  it('keeps the native select visually aligned with its idle cell', () => {
    expect(libraryCss).toMatch(
      /\.bgrid-native-select-editor\s*\{[^}]*padding:\s*0 29\.5px 0 6\.5px;[^}]*appearance:\s*none;[^}]*background:\s*transparent;[^}]*font:\s*inherit;/s,
    );
    expect(libraryCss).toMatch(
      /\.bgrid-native-select-editor-icon\s*\{[^}]*right:\s*6\.5px;[^}]*align-items:\s*center;[^}]*justify-content:\s*center;[^}]*width:\s*20px;/s,
    );
  });

  it('keeps the native date visually aligned with its idle cell', () => {
    expect(libraryCss).toMatch(
      /\.bgrid-native-date-editor\s*\{[^}]*padding:\s*0 29\.5px 0 6\.5px;[^}]*appearance:\s*none;[^}]*background:\s*transparent;[^}]*font:\s*inherit;/s,
    );
    expect(libraryCss).toMatch(
      /\.bgrid-native-date-editor-icon\s*\{[^}]*right:\s*6\.5px;[^}]*align-items:\s*center;[^}]*justify-content:\s*center;[^}]*width:\s*20px;/s,
    );
    expect(libraryCss).toMatch(
      /\.bgrid-native-date-editor::\-webkit-calendar-picker-indicator\s*\{[^}]*right:\s*6\.5px;[^}]*width:\s*20px;[^}]*opacity:\s*0;/s,
    );
  });
});

describe('Editing example style contracts', () => {
  it('keeps the lookup editor text and icon inset aligned with the idle cell', () => {
    expect(lookupEditorCss).toMatch(
      /td\.lookup-editor-customer-cell\.bgrid-cell-editing\s*>\s*\.bgrid-cell-content-plugin-editor\s*\{[^}]*padding:\s*0 6\.5px;/s,
    );
  });

  it('keeps Ant Design autocomplete typography and inset aligned with the idle cell', () => {
    expect(lookupEditorCss).toMatch(
      /\.ant-select-selector\s*\{[^}]*padding:\s*0 !important;[^}]*background:\s*transparent;[^}]*font:\s*inherit;/s,
    );
    expect(lookupEditorCss).toMatch(
      /\.ant-select-selection-search-input\s*\{[^}]*font-size:\s*inherit !important;[^}]*line-height:\s*inherit !important;/s,
    );
  });

  it('keeps the editing event terminal fixed while its log scrolls', () => {
    expect(editingEventsCss).toMatch(
      /\.editing-events-terminal\s*\{[^}]*height:\s*112px;[^}]*overflow:\s*hidden;/s,
    );
    expect(editingEventsCss).toMatch(
      /\.editing-events-log\s*\{[^}]*overflow-y:\s*scroll;[^}]*scrollbar-gutter:\s*stable;/s,
    );
  });
});
