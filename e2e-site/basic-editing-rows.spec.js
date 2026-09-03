import { expect, test } from '@playwright/test';

for (const locale of ['ko', 'en']) {
  test(`${locale}: appended row is visible, checked rows can be deleted and editing still works`, async ({ page }) => {
    await page.goto(locale === 'ko' ? '/learn/editing' : '/en/learn/editing');
    const demo = page.getByRole('region', { name: locale === 'ko' ? '라이브 데모' : 'Live demo', exact: true });
    const add = demo.getByRole('button', { name: locale === 'ko' ? '행추가' : 'Add Row', exact: true });
    const remove = demo.getByRole('button', { name: locale === 'ko' ? '행삭제' : 'Delete Rows', exact: true });
    await expect(remove).toBeDisabled();
    for (let i = 0; i < 20; i += 1) await add.click();
    const lastCell = demo.locator('td[data-row-index="23"][data-column-index="0"]');
    await expect(lastCell).toHaveText('ORD-2624');
    await expect
      .poll(() =>
        lastCell.evaluate(cell => {
          const viewport = cell.closest('[role="grid"]').querySelector('[role="rfdg-scroll-container"]');
          const rowRect = cell.getBoundingClientRect();
          const viewportRect = viewport.getBoundingClientRect();
          return rowRect.top >= viewportRect.top && rowRect.bottom <= viewportRect.bottom + 1;
        }),
      )
      .toBe(true);
    const scrollPlane = demo.locator('.bgrid-scroll-plane');
    await expect
      .poll(async () => Number(await scrollPlane.getAttribute('data-bgrid-logical-scroll-top')))
      .toBeGreaterThan(0);

    const lastCustomer = demo.locator('td[data-row-index="23"][data-column-index="1"]');
    await lastCustomer.dblclick();
    const editor = demo.locator('[data-bgrid-text-editor-gateway="true"]');
    await editor.fill('New customer');
    await editor.press('Enter');
    await expect(lastCustomer).toHaveText('New customer');

    const rowCheckbox = demo
      .locator('[role="rfdg-body-frozen"] tr')
      .filter({ has: page.locator('[data-row-index="23"]') })
      .getByRole('checkbox');
    await rowCheckbox.click();
    await remove.click();
    await expect(demo.getByText('ORD-2624', { exact: true })).toHaveCount(0);
    await expect(remove).toBeDisabled();
    await demo.locator('[role="rfdg-head-frozen"]').getByRole('checkbox').click();
    await remove.click();
    await expect(demo).toContainText(locale === 'ko' ? '전체 0개' : '0 total');
    await add.click();
    await expect(demo.getByText('ORD-2625', { exact: true })).toBeVisible();
    await expect(demo).toContainText(locale === 'ko' ? '전체 1개' : '1 total');
  });
}
