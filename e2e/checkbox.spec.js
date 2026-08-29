import { expect, test } from '@playwright/test';

test.describe('Row Checked E2E', () => {
  test('supports checkbox and radio selection modes', async ({ page }) => {
    await page.goto('/radioBox');

    // Wait for the grid
    const grid = page.locator('[role="grid"]');
    await expect(grid).toBeVisible();

    // In checkbox mode, select the first row
    const firstRowCheckbox = page.locator('[role="rfdg-body-frozen"] tr[data-ri="0"] [role="checkbox"]');
    await firstRowCheckbox.click();

    const output = page.getByTestId('checked-row-keys');
    await expect(output).toContainText('대한민국(15+ LFS)');

    // Select the second row
    const secondRowCheckbox = page.locator('[role="rfdg-body-frozen"] tr[data-ri="1"] [role="checkbox"]');
    await secondRowCheckbox.click();
    await expect(output).toContainText('아르메니아(15~75 LFS)');
    await expect(output).toContainText('선택한 키 (2)');

    // Switch to radio mode
    const radioBtn = page.locator('.ant-segmented-item', { hasText: 'Radio (단일 선택)' });
    await radioBtn.click();

    // The state should be sliced to 1 (only the first one remains)
    await expect(output).toContainText('선택한 키 (1)');
    await expect(output).toContainText('대한민국');
    await expect(output).not.toContainText('아르메니아');

    // In radio mode, selecting a new row should replace the selection
    const thirdRowRadio = page.locator('[role="rfdg-body-frozen"] tr[data-ri="2"] [role="radio"]');
    await thirdRowRadio.click();
    await expect(output).toContainText('선택한 키 (1)');
    await expect(output).toContainText('아제르바이잔');
  });
});
