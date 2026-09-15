import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  escapeXml,
  colIndexToExcelColumn,
  serializeGridExportDataToExcel,
  downloadExcel,
} from '../beautiful-grid/utils/exportExcel';
import { BGridExportData } from '../beautiful-grid/types';

describe('exportExcel utility', () => {
  describe('escapeXml', () => {
    it('escapes XML special characters', () => {
      expect(escapeXml('<script>alert("test & \'fun\'")</script>')).toBe(
        '&lt;script&gt;alert(&quot;test &amp; &apos;fun&apos;&quot;)&lt;/script&gt;',
      );
    });

    it('strips invalid control characters', () => {
      expect(escapeXml('hello\x00\x08\x0b\x0c\x1fworld')).toBe('helloworld');
      // tabs and newlines are preserved
      expect(escapeXml('hello\t\n\rworld')).toBe('hello\t\n\rworld');
    });
  });

  describe('colIndexToExcelColumn', () => {
    it('converts column indices to Excel column letters', () => {
      expect(colIndexToExcelColumn(0)).toBe('A');
      expect(colIndexToExcelColumn(1)).toBe('B');
      expect(colIndexToExcelColumn(25)).toBe('Z');
      expect(colIndexToExcelColumn(26)).toBe('AA');
      expect(colIndexToExcelColumn(27)).toBe('AB');
      expect(colIndexToExcelColumn(51)).toBe('AZ');
      expect(colIndexToExcelColumn(52)).toBe('BA');
      expect(colIndexToExcelColumn(701)).toBe('ZZ');
      expect(colIndexToExcelColumn(702)).toBe('AAA');
    });
  });

  describe('serializeGridExportDataToExcel', () => {
    const sampleData: BGridExportData = {
      columns: [
        { id: 'id', key: 'id', header: 'ID', index: 0 },
        { id: 'name', key: 'name', header: 'Name', index: 1 },
        { id: 'price', key: 'price', header: 'Price', index: 2 },
        { id: 'active', key: 'active', header: 'Active', index: 3 },
      ],
      rows: [
        {
          rowIndex: 0,
          rowKey: '1',
          dataItem: { values: { id: 1, name: 'Alice & Bob', price: 15000, active: true } },
          cells: [1, 'Alice & Bob', 15000, true],
        },
        {
          rowIndex: 1,
          rowKey: '2',
          dataItem: { values: { id: 2, name: 'Charlie', price: null, active: false } },
          cells: [2, 'Charlie', null, false],
        },
      ],
    };

    it('generates a valid binary zip containing OpenXML files', () => {
      const bytes = serializeGridExportDataToExcel(sampleData);
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBeGreaterThan(1000);

      // Verify ZIP magic number PK\x03\x04
      expect(bytes[0]).toBe(0x50);
      expect(bytes[1]).toBe(0x4b);
      expect(bytes[2]).toBe(0x03);
      expect(bytes[3]).toBe(0x04);

      // Convert to string to inspect stored XML files
      const text = new TextDecoder('utf-8').decode(bytes);
      expect(text).toContain('[Content_Types].xml');
      expect(text).toContain('xl/workbook.xml');
      expect(text).toContain('xl/worksheets/sheet1.xml');
      expect(text).toContain('Alice &amp; Bob');
      expect(text).toContain('<c r="C2"><v>15000</v></c>');
      expect(text).toContain('<c r="D2" t="b"><v>1</v></c>');
      expect(text).toContain('<c r="D3" t="b"><v>0</v></c>');
    });

    it('sanitizes invalid sheet names and limits to 31 chars', () => {
      const bytes = serializeGridExportDataToExcel(sampleData, {
        sheetName: 'Invalid/Sheet:Name?*[VeryLongNameOver31Characters]',
      });
      const text = new TextDecoder('utf-8').decode(bytes);
      expect(text).toContain('sheet name="InvalidSheetNameVeryLongNameOve"');
    });

    it('supports omitting header', () => {
      const bytes = serializeGridExportDataToExcel(sampleData, {
        includeHeader: false,
      });
      const text = new TextDecoder('utf-8').decode(bytes);
      expect(text).not.toContain('<is><t>ID</t></is>');
      // First row starts with row 1 having data item 1
      expect(text).toContain('<row r="1"><c r="A1"><v>1</v></c>');
    });
  });

  describe('downloadExcel', () => {
    let originalCreateElement: typeof document.createElement;
    let originalCreateObjectURL: typeof URL.createObjectURL;
    let originalRevokeObjectURL: typeof URL.revokeObjectURL;

    beforeEach(() => {
      originalCreateElement = document.createElement.bind(document);
      originalCreateObjectURL = URL.createObjectURL;
      originalRevokeObjectURL = URL.revokeObjectURL;
    });

    afterEach(() => {
      document.createElement = originalCreateElement;
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
      vi.restoreAllMocks();
    });

    it('creates a download link and triggers click', () => {
      const mockLink = {
        href: '',
        setAttribute: vi.fn(),
        style: { display: '' },
        click: vi.fn(),
      } as any;

      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'a') return mockLink;
        return originalCreateElement(tag);
      });
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);
      URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/dummy');
      URL.revokeObjectURL = vi.fn();

      const bytes = new Uint8Array([1, 2, 3]);
      downloadExcel(bytes, 'orders');

      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'orders.xlsx');
      expect(mockLink.click).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/dummy');
    });
  });
});
