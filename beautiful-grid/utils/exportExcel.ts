import { BGridExcelSerializeOptions, BGridExportData } from '../types';

function makeCrc32Table(): Uint32Array {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = makeCrc32Table();

function calculateCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');
}

export function colIndexToExcelColumn(colIndex: number): string {
  let name = '';
  let n = colIndex;
  while (n >= 0) {
    name = String.fromCharCode((n % 26) + 65) + name;
    n = Math.floor(n / 26) - 1;
  }
  return name;
}

interface ZipEntryInput {
  name: string;
  data: Uint8Array | string;
}

function createZipArchive(files: ZipEntryInput[]): Uint8Array {
  const encoder = new TextEncoder();
  const fileEntries: {
    nameBytes: Uint8Array;
    dataBytes: Uint8Array;
    crc: number;
    localHeader: Uint8Array;
    offset: number;
  }[] = [];

  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = typeof file.data === 'string' ? encoder.encode(file.data) : file.data;
    const crc = calculateCrc32(dataBytes);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const dv = new DataView(localHeader.buffer);
    dv.setUint32(0, 0x04034b50, true); // Local file header signature
    dv.setUint16(4, 20, true); // Version needed to extract (2.0)
    dv.setUint16(6, 0x0800, true); // Bit flag: UTF-8 filename (bit 11)
    dv.setUint16(8, 0, true); // Compression method: STORE (0)
    dv.setUint16(10, 0, true); // File last mod time
    dv.setUint16(12, 0, true); // File last mod date
    dv.setUint32(14, crc, true); // CRC-32
    dv.setUint32(18, dataBytes.length, true); // Compressed size
    dv.setUint32(22, dataBytes.length, true); // Uncompressed size
    dv.setUint16(26, nameBytes.length, true); // Filename length
    dv.setUint16(28, 0, true); // Extra field length
    localHeader.set(nameBytes, 30);

    fileEntries.push({
      nameBytes,
      dataBytes,
      crc,
      localHeader,
      offset,
    });

    offset += localHeader.length + dataBytes.length;
  }

  const centralDirEntries: Uint8Array[] = [];
  let centralDirSize = 0;

  for (const entry of fileEntries) {
    const cd = new Uint8Array(46 + entry.nameBytes.length);
    const dv = new DataView(cd.buffer);
    dv.setUint32(0, 0x02014b50, true); // Central file header signature
    dv.setUint16(4, 20, true); // Version made by
    dv.setUint16(6, 20, true); // Version needed to extract
    dv.setUint16(8, 0x0800, true); // Bit flag: UTF-8
    dv.setUint16(10, 0, true); // Compression method: STORE
    dv.setUint16(12, 0, true); // File last mod time
    dv.setUint16(14, 0, true); // File last mod date
    dv.setUint32(16, entry.crc, true); // CRC-32
    dv.setUint32(20, entry.dataBytes.length, true); // Compressed size
    dv.setUint32(24, entry.dataBytes.length, true); // Uncompressed size
    dv.setUint16(28, entry.nameBytes.length, true); // Filename length
    dv.setUint16(30, 0, true); // Extra field length
    dv.setUint16(32, 0, true); // File comment length
    dv.setUint16(34, 0, true); // Disk number start
    dv.setUint16(36, 0, true); // Internal file attributes
    dv.setUint32(38, 0, true); // External file attributes
    dv.setUint32(42, entry.offset, true); // Relative offset of local header
    cd.set(entry.nameBytes, 46);

    centralDirEntries.push(cd);
    centralDirSize += cd.length;
  }

  const eocd = new Uint8Array(22);
  const dvEocd = new DataView(eocd.buffer);
  dvEocd.setUint32(0, 0x06054b50, true); // End of central dir signature
  dvEocd.setUint16(4, 0, true); // Number of this disk
  dvEocd.setUint16(6, 0, true); // Number of disk with start of central directory
  dvEocd.setUint16(8, fileEntries.length, true); // Total entries in this disk
  dvEocd.setUint16(10, fileEntries.length, true); // Total entries
  dvEocd.setUint32(12, centralDirSize, true); // Size of the central directory
  dvEocd.setUint32(16, offset, true); // Offset of start of central directory
  dvEocd.setUint16(20, 0, true); // ZIP file comment length

  const totalLength = offset + centralDirSize + 22;
  const result = new Uint8Array(totalLength);
  let pos = 0;

  for (const entry of fileEntries) {
    result.set(entry.localHeader, pos);
    pos += entry.localHeader.length;
    result.set(entry.dataBytes, pos);
    pos += entry.dataBytes.length;
  }

  for (const cd of centralDirEntries) {
    result.set(cd, pos);
    pos += cd.length;
  }

  result.set(eocd, pos);
  return result;
}

function formatCellValueAsXml(cellValue: unknown, cellRef: string): string {
  if (cellValue === null || cellValue === undefined || cellValue === '') {
    return `<c r="${cellRef}"/>`;
  }

  if (typeof cellValue === 'number') {
    if (Number.isFinite(cellValue)) {
      return `<c r="${cellRef}"><v>${cellValue}</v></c>`;
    }
    return `<c r="${cellRef}" t="inlineStr"><is><t>${escapeXml(String(cellValue))}</t></is></c>`;
  }

  if (typeof cellValue === 'boolean') {
    return `<c r="${cellRef}" t="b"><v>${cellValue ? 1 : 0}</v></c>`;
  }

  if (typeof cellValue === 'bigint') {
    return `<c r="${cellRef}" t="inlineStr"><is><t>${cellValue.toString()}</t></is></c>`;
  }

  if (cellValue instanceof Date) {
    const dateStr = Number.isNaN(cellValue.getTime()) ? 'Invalid Date' : cellValue.toISOString();
    return `<c r="${cellRef}" t="inlineStr"><is><t>${escapeXml(dateStr)}</t></is></c>`;
  }

  let text: string;
  if (typeof cellValue === 'object') {
    try {
      text = JSON.stringify(cellValue);
    } catch {
      text = String(cellValue);
    }
  } else {
    text = String(cellValue);
  }

  return `<c r="${cellRef}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(text)}</t></is></c>`;
}

export function serializeGridExportDataToExcel<T>(
  data: BGridExportData<T>,
  options?: BGridExcelSerializeOptions,
): Uint8Array {
  const includeHeader = options?.includeHeader ?? true;
  let rawSheetName = (options?.sheetName || 'Sheet1').trim().replace(/[:\\/?*\[\]]/g, '');
  if (!rawSheetName) {
    rawSheetName = 'Sheet1';
  } else if (rawSheetName.length > 31) {
    rawSheetName = rawSheetName.slice(0, 31);
  }

  const sheetRows: string[] = [];
  let rowIndex = 1;

  if (includeHeader) {
    const headerCells = data.columns
      .map((col, colIdx) => {
        const cellRef = `${colIndexToExcelColumn(colIdx)}${rowIndex}`;
        return formatCellValueAsXml(col.header, cellRef);
      })
      .join('');
    sheetRows.push(`<row r="${rowIndex}">${headerCells}</row>`);
    rowIndex++;
  }

  for (const row of data.rows) {
    const rowCells = row.cells
      .map((cell, colIdx) => {
        const cellRef = `${colIndexToExcelColumn(colIdx)}${rowIndex}`;
        return formatCellValueAsXml(cell, cellRef);
      })
      .join('');
    sheetRows.push(`<row r="${rowIndex}">${rowCells}</row>`);
    rowIndex++;
  }

  const contentTypesXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
    '</Types>';

  const rootRelsXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '</Relationships>';

  const workbookRelsXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
    '</Relationships>';

  const workbookXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    `<sheets><sheet name="${escapeXml(rawSheetName)}" sheetId="1" r:id="rId1"/></sheets>` +
    '</workbook>';

  const worksheetXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<sheetData>${sheetRows.join('')}</sheetData>` +
    '</worksheet>';

  return createZipArchive([
    { name: '[Content_Types].xml', data: contentTypesXml },
    { name: '_rels/.rels', data: rootRelsXml },
    { name: 'xl/_rels/workbook.xml.rels', data: workbookRelsXml },
    { name: 'xl/workbook.xml', data: workbookXml },
    { name: 'xl/worksheets/sheet1.xml', data: worksheetXml },
  ]);
}

export function downloadExcel(blobOrBytes: Blob | Uint8Array, fileName: string = 'export.xlsx'): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  let resolvedName = (fileName || '').trim();
  if (!resolvedName) {
    resolvedName = 'export.xlsx';
  } else if (!resolvedName.toLowerCase().endsWith('.xlsx')) {
    resolvedName += '.xlsx';
  }

  const blob =
    blobOrBytes instanceof Blob
      ? blobOrBytes
      : new Blob([blobOrBytes as BlobPart], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', resolvedName);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(url);
    }
  }
}
