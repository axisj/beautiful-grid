import { expect, test } from '@playwright/test';

test.describe('Cell Merge E2E', () => {
  test('renders merged cells with correct rowspan', async ({ page }) => {
    await page.goto('/cellMerge');

    // The first column 'mainCategory' should merge the first 5 rows ("Home Appliances/Digital")
    // Wait for grid to be visible
    const grid = page.locator('[role="grid"]');
    await expect(grid).toBeVisible();

    // In frozen columns (frozenColumnIndex=2), the first cell is in role="rfdg-body-frozen"
    const mergedCell = page.locator('[role="rfdg-body-frozen"] tr[data-ri="0"] td[data-column-index="0"]');
    await expect(mergedCell).toContainText('Home Appliances/Digital');
    
    // It should have rowspan attribute = 5
    await expect(mergedCell).toHaveAttribute('rowspan', '5');

    // Row 1 should NOT have a cell for column 0
    const row1Cell0 = page.locator('[role="rfdg-body-frozen"] tr[data-ri="1"] td[data-column-index="0"]');
    await expect(row1Cell0).toHaveCount(0);

    // The second column 'subCategory' should merge the first 3 rows ("Computer Peripherals")
    const subCategoryMergedCell = page.locator('[role="rfdg-body-frozen"] tr[data-ri="0"] td[data-column-index="1"]');
    await expect(subCategoryMergedCell).toContainText('Computer Peripherals');
    await expect(subCategoryMergedCell).toHaveAttribute('rowspan', '3');
  });
});
