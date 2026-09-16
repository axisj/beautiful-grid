import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const libraryCss = readFileSync(resolve(process.cwd(), 'beautiful-grid/style.css'), 'utf8');

describe('Summary cell styles', () => {
  afterEach(() => {
    document.head.querySelector('[data-test-library-css]')?.remove();
    document.body.innerHTML = '';
  });

  it.each(['left', 'right'] as const)('keeps normal cell horizontal padding when aligned %s', align => {
    const style = document.createElement('style');
    style.dataset.testLibraryCss = 'true';
    style.textContent = libraryCss;
    document.head.appendChild(style);

    document.body.innerHTML = `
      <div class="bgrid-root">
        <table class="bgrid-summary-table">
          <tbody role="rfdg-summary">
            <tr><td style="text-align: ${align}">Summary label</td></tr>
          </tbody>
        </table>
      </div>
    `;

    const cell = document.querySelector('td');
    expect(cell).not.toBeNull();

    const computedStyle = getComputedStyle(cell as HTMLTableCellElement);
    expect(computedStyle.paddingLeft).toBe('6.5px');
    expect(computedStyle.paddingRight).toBe('6.5px');
  });

  it('does not apply a right border to data-none filler cell in vertical-bordered mode', () => {
    const style = document.createElement('style');
    style.dataset.testLibraryCss = 'true';
    style.textContent = libraryCss;
    document.head.appendChild(style);

    document.body.innerHTML = `
      <div class="bgrid-root">
        <table class="bgrid-summary-table bgrid-summary-vertical-bordered">
          <tbody role="rfdg-summary">
            <tr>
              <td>Summary label</td>
              <td data-none></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    const dataCell = document.querySelector('td:not([data-none])')!;
    const fillerCell = document.querySelector('td[data-none]')!;

    expect(dataCell.matches('.bgrid-summary-vertical-bordered > tbody > tr > td:not([data-none])')).toBe(true);
    expect(fillerCell.matches('.bgrid-summary-vertical-bordered > tbody > tr > td:not([data-none])')).toBe(false);
    expect(fillerCell.matches('.bgrid-summary-table > tbody > tr > td[data-none]')).toBe(true);
  });
});
