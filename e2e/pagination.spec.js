import { expect, test } from '@playwright/test';

test.describe('Pagination E2E', () => {
  test('renders pagination controls and updates data on page change', async ({ page }) => {
    await page.goto('/paging');

    const footer = page.locator('.bgrid-footer-content');
    await expect(footer).toBeVisible();

    const pagination = page.locator('.bgrid-pagination');
    await expect(pagination).toBeVisible();

    // The first row on page 1 should be MBR-000001
    let firstRowCell = page.locator('[role="rfdg-body"] tr[data-ri="0"] td[data-column-index="0"]');
    await expect(firstRowCell).toContainText('MBR-000001');

    // Click on page 2 button
    const page2Btn = page.locator('[role="page-number"]', { hasText: /^2$/ });
    await page2Btn.click();

    // The first row on page 2 should be MBR-000051 (since PAGE_SIZE is 50)
    firstRowCell = page.locator('[role="rfdg-body"] tr[data-ri="0"] td[data-column-index="0"]');
    await expect(firstRowCell).toContainText('MBR-000051');

    // Click on page 3 button
    const page3Btn = page.locator('[role="page-number"]', { hasText: /^3$/ });
    await page3Btn.click();

    // The first row on page 3 should be MBR-000101
    firstRowCell = page.locator('[role="rfdg-body"] tr[data-ri="0"] td[data-column-index="0"]');
    await expect(firstRowCell).toContainText('MBR-000101');
  });
});
