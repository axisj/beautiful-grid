import { BGridCsvSerializeOptions, BGridExportData } from '../types';

export function formatCsvCellValue(value: unknown, preventFormulaInjection: boolean = true): string {
  if (value === null || value === undefined) {
    return '';
  }

  let formatted: string;
  if (typeof value === 'string') {
    formatted = value;
    const startsWithFormula = /^[=+\-@]/.test(formatted);
    const startsWithDangerousControl = /^[\t\r\n]/.test(formatted);
    const hasFormulaAfterLeadingWhitespace = /^\s+[=+\-@]/.test(formatted);
    if (
      preventFormulaInjection &&
      (startsWithFormula || startsWithDangerousControl || hasFormulaAfterLeadingWhitespace)
    ) {
      formatted = `'${formatted}`;
    }
    return formatted;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString();
  }

  if (typeof value === 'object') {
    try {
      formatted = JSON.stringify(value);
    } catch {
      formatted = String(value);
    }
    return formatted;
  }

  return String(value);
}

export function escapeCsvCell(cell: string, delimiter: string = ','): string {
  const needsQuotes =
    cell.includes(delimiter) ||
    cell.includes('"') ||
    cell.includes('\r') ||
    cell.includes('\n');

  if (needsQuotes) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

export function serializeGridExportDataToCsv<T>(
  data: BGridExportData<T>,
  options?: BGridCsvSerializeOptions,
): string {
  const delimiter = options?.delimiter ?? ',';
  const newline = options?.newline ?? '\r\n';
  const includeHeader = options?.includeHeader ?? true;
  const bom = options?.bom ?? true;
  const preventFormulaInjection = options?.preventFormulaInjection ?? true;

  const lines: string[] = [];

  if (includeHeader) {
    const headerLine = data.columns
      .map(col => escapeCsvCell(formatCsvCellValue(col.header, preventFormulaInjection), delimiter))
      .join(delimiter);
    lines.push(headerLine);
  }

  for (const row of data.rows) {
    const rowLine = row.cells
      .map(cell => escapeCsvCell(formatCsvCellValue(cell, preventFormulaInjection), delimiter))
      .join(delimiter);
    lines.push(rowLine);
  }

  const csvText = lines.join(newline);
  return (bom ? '\uFEFF' : '') + csvText;
}

export function downloadCsv(csv: string, fileName: string = 'export.csv'): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  let resolvedName = (fileName || '').trim();
  if (!resolvedName) {
    resolvedName = 'export.csv';
  } else if (!resolvedName.toLowerCase().endsWith('.csv')) {
    resolvedName += '.csv';
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
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
