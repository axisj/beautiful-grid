import { toNumber } from './';

export function toMoney(value: unknown): string {
  const n = toNumber(value);

  return Number.isNaN(n)
    ? String(value)
    : n
        .toFixed(0)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
