export function formatCascaderClipboardText(value: unknown): string {
  if (!Array.isArray(value) || !value.every(segment => typeof segment === 'string')) return '';
  return JSON.stringify(value);
}

export function parseCascaderClipboardText(text: string): string[] {
  const value: unknown = JSON.parse(text);
  if (!Array.isArray(value) || value.length === 0 || !value.every(segment => typeof segment === 'string')) {
    throw new TypeError('Cascader clipboard value must be a non-empty JSON string array.');
  }
  return value;
}
