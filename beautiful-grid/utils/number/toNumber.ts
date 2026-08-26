export function toNumber(value: unknown): number {
  let n: number = value as number;
  try {
    n = typeof value === 'number' ? value : Number(value || 0);
  } finally {
  }
  return n;
}
