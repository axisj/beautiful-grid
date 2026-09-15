import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatCsvCellValue,
  escapeCsvCell,
  serializeGridExportDataToCsv,
  downloadCsv,
} from '../beautiful-grid/utils/exportCsv';
import { BGridExportData } from '../beautiful-grid/types';

describe('exportCsv utility', () => {
  describe('formatCsvCellValue', () => {
    it('formats null and undefined as empty string', () => {
      expect(formatCsvCellValue(null)).toBe('');
      expect(formatCsvCellValue(undefined)).toBe('');
    });

    it('formats plain strings as is', () => {
      expect(formatCsvCellValue('hello world')).toBe('hello world');
    });

    it('formats numbers as strings', () => {
      expect(formatCsvCellValue(123)).toBe('123');
      expect(formatCsvCellValue(0)).toBe('0');
      expect(formatCsvCellValue(-45.67)).toBe('-45.67');
    });

    it('formats booleans as true / false', () => {
      expect(formatCsvCellValue(true)).toBe('true');
      expect(formatCsvCellValue(false)).toBe('false');
    });

    it('formats bigint as string', () => {
      expect(formatCsvCellValue(BigInt(9007199254740991))).toBe('9007199254740991');
    });

    it('formats valid and invalid Date objects', () => {
      const date = new Date('2026-09-14T12:00:00.000Z');
      expect(formatCsvCellValue(date)).toBe('2026-09-14T12:00:00.000Z');

      const invalidDate = new Date('invalid');
      expect(formatCsvCellValue(invalidDate)).toBe('Invalid Date');
    });

    it('formats objects and arrays as JSON, falling back on circular', () => {
      expect(formatCsvCellValue({ a: 1, b: 'test' })).toBe('{"a":1,"b":"test"}');
      expect(formatCsvCellValue([1, 2, 3])).toBe('[1,2,3]');

      const circular: any = {};
      circular.self = circular;
      expect(formatCsvCellValue(circular)).toBe('[object Object]');
    });

    it('formats Korean UTF-8 characters properly', () => {
      expect(formatCsvCellValue('대한민국 서울')).toBe('대한민국 서울');
    });

    it('prevents formula injection by prefixing quote for =, +, -, @ on strings', () => {
      expect(formatCsvCellValue('=SUM(A1:A3)', true)).toBe("'=SUM(A1:A3)");
      expect(formatCsvCellValue('+12345', true)).toBe("'+12345");
      expect(formatCsvCellValue('-12345', true)).toBe("'-12345");
      expect(formatCsvCellValue('@SUM(A1)', true)).toBe("'@SUM(A1)");

      // When preventFormulaInjection is disabled
      expect(formatCsvCellValue('=SUM(A1:A3)', false)).toBe('=SUM(A1:A3)');
      expect(formatCsvCellValue('+12345', false)).toBe('+12345');
      expect(formatCsvCellValue('-12345', false)).toBe('-12345');
      expect(formatCsvCellValue('@SUM(A1)', false)).toBe('@SUM(A1)');

      // Numbers are not string formulas
      expect(formatCsvCellValue(-10, true)).toBe('-10');
      expect(formatCsvCellValue(10, true)).toBe('10');
    });

    it('prevents formula injection through control characters or leading whitespace', () => {
      expect(formatCsvCellValue('\t=SUM(A1:A3)', true)).toBe("'\t=SUM(A1:A3)");
      expect(formatCsvCellValue('\r=SUM(A1:A3)', true)).toBe("'\r=SUM(A1:A3)");
      expect(formatCsvCellValue('\n=SUM(A1:A3)', true)).toBe("'\n=SUM(A1:A3)");
      expect(formatCsvCellValue('   =SUM(A1:A3)', true)).toBe("'   =SUM(A1:A3)");
      expect(formatCsvCellValue('   harmless text', true)).toBe('   harmless text');
    });
  });

  describe('escapeCsvCell', () => {
    it('leaves plain text unquoted', () => {
      expect(escapeCsvCell('plain text')).toBe('plain text');
    });

    it('wraps text with delimiter (comma) in quotes', () => {
      expect(escapeCsvCell('A,B')).toBe('"A,B"');
    });

    it('escapes double quotes by doubling them and wrapping in quotes', () => {
      expect(escapeCsvCell('hello "tom"')).toBe('"hello ""tom"""');
    });

    it('wraps newlines and CRLF in quotes', () => {
      expect(escapeCsvCell('line1\nline2')).toBe('"line1\nline2"');
      expect(escapeCsvCell('line1\r\nline2')).toBe('"line1\r\nline2"');
    });

    it('escapes custom delimiter', () => {
      expect(escapeCsvCell('A\tB', '\t')).toBe('"A\tB"');
      expect(escapeCsvCell('A;B', ';')).toBe('"A;B"');
    });
  });

  describe('serializeGridExportDataToCsv', () => {
    const mockData: BGridExportData<any> = {
      columns: [
        { columnId: 'id', header: 'ID', column: { id: 'id', key: 'id', label: 'ID', width: 100 }, columnIndex: 0 },
        { columnId: 'name', header: 'User "Name"', column: { id: 'name', key: 'name', label: 'Name', width: 100 }, columnIndex: 1 },
        { columnId: 'city', header: 'City, State', column: { id: 'city', key: 'city', label: 'City', width: 100 }, columnIndex: 2 },
      ],
      rows: [
        {
          sourceIndex: 0,
          values: {},
          item: { values: {} },
          cells: ['1', 'Alice', 'Seoul'],
        },
        {
          sourceIndex: 1,
          values: {},
          item: { values: {} },
          cells: ['2', '=1+1', 'New\nYork'],
        },
      ],
    };

    it('serializes CSV with default options (BOM, CRLF, comma, header, formula injection prevention)', () => {
      const csv = serializeGridExportDataToCsv(mockData);

      // Has BOM prefix
      expect(csv.startsWith('\uFEFF')).toBe(true);

      const body = csv.slice(1);
      const lines = body.split('\r\n');
      expect(lines).toHaveLength(3);

      // Header escaped properly
      expect(lines[0]).toBe('ID,"User ""Name""","City, State"');

      // Row 1
      expect(lines[1]).toBe('1,Alice,Seoul');

      // Row 2: formula prefixed with ', multiline quoted
      expect(lines[2]).toBe('2,\'=1+1,"New\nYork"');
    });

    it('supports disabling BOM', () => {
      const csv = serializeGridExportDataToCsv(mockData, { bom: false });
      expect(csv.startsWith('\uFEFF')).toBe(false);
    });

    it('supports custom newline', () => {
      const singleLineData: BGridExportData<any> = {
        columns: mockData.columns.slice(0, 2),
        rows: [
          { sourceIndex: 0, values: {}, item: { values: {} }, cells: ['1', 'Alice'] },
          { sourceIndex: 1, values: {}, item: { values: {} }, cells: ['2', 'Bob'] },
        ],
      };
      const csv = serializeGridExportDataToCsv(singleLineData, { bom: false, newline: '\n' });
      expect(csv).toBe('ID,"User ""Name"""\n1,Alice\n2,Bob');
    });

    it('supports custom delimiter', () => {
      const csv = serializeGridExportDataToCsv(mockData, { bom: false, delimiter: '\t' });
      const lines = csv.split('\r\n');
      // Tab delimited: "City, State" doesn't need quotes because delimiter is \t
      expect(lines[0]).toBe('ID\t"User ""Name"""\tCity, State');
      expect(lines[1]).toBe('1\tAlice\tSeoul');
    });

    it('supports includeHeader: false', () => {
      const csv = serializeGridExportDataToCsv(mockData, { bom: false, includeHeader: false });
      const lines = csv.split('\r\n');
      expect(lines).toHaveLength(2);
      expect(lines[0]).toBe('1,Alice,Seoul');
    });

    it('supports preventFormulaInjection: false', () => {
      const csv = serializeGridExportDataToCsv(mockData, { bom: false, preventFormulaInjection: false });
      const lines = csv.split('\r\n');
      expect(lines[2]).toBe('2,=1+1,"New\nYork"');
    });
  });

  describe('downloadCsv', () => {
    let originalCreateObjectURL: any;
    let originalRevokeObjectURL: any;

    beforeEach(() => {
      originalCreateObjectURL = window.URL.createObjectURL;
      originalRevokeObjectURL = window.URL.revokeObjectURL;
      window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
      window.URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      window.URL.createObjectURL = originalCreateObjectURL;
      window.URL.revokeObjectURL = originalRevokeObjectURL;
      vi.restoreAllMocks();
    });

    it('creates an anchor, triggers click, and cleans up with correct filename', () => {
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');

      downloadCsv('mock,csv', 'orders');

      expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1);
      expect(appendChildSpy).toHaveBeenCalledTimes(1);
      const anchor = appendChildSpy.mock.calls[0][0] as HTMLAnchorElement;
      expect(anchor.tagName.toLowerCase()).toBe('a');
      expect(anchor.getAttribute('download')).toBe('orders.csv');
      expect(anchor.href).toBe('blob:mock-url');
      expect(removeChildSpy).toHaveBeenCalledWith(anchor);
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('keeps existing .csv extension if present', () => {
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      downloadCsv('mock,csv', 'reports.CSV');
      const anchor = appendChildSpy.mock.calls[0][0] as HTMLAnchorElement;
      expect(anchor.getAttribute('download')).toBe('reports.CSV');
    });
  });
});
