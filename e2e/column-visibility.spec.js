import { expect, test } from '@playwright/test';

test.describe('Column visibility', () => {
  test('hides, restores, and shows all columns from the header toolbox', async ({ page }) => {
    await page.goto('/column-visibility');
    await expect(page.getByRole('heading', { level: 2, name: 'Column Visibility' })).toBeVisible();

    await expect(page.getByRole('button', { name: 'Owner 컬럼 메뉴' })).toHaveCount(0);
    await expect(page.getByText('Hidden 1')).toBeVisible();

    await page.getByRole('button', { name: 'Customer 컬럼 메뉴' }).click();
    await expect(page.getByText(/오름차순 정렬|Sort ascending/)).toBeVisible();
    await expect(page.getByText(/필터|Filter/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Customer 컬럼 숨기기' })).toBeVisible();
    await page.getByRole('button', { name: '숨긴 컬럼 1개 관리' }).click();
    await page.getByRole('button', { name: 'Owner 컬럼 표시' }).click();
    await expect(page.getByRole('button', { name: 'Owner 컬럼 메뉴' })).toBeVisible();
    await expect(page.getByText('Hidden 0')).toBeVisible();

    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Region 컬럼 메뉴' }).click();
    await page.getByRole('button', { name: 'Region 컬럼 숨기기' }).click();
    await expect(page.getByRole('button', { name: 'Region 컬럼 메뉴' })).toHaveCount(0);
    await expect(page.getByText('Hidden 1')).toBeVisible();

    await page.getByRole('button', { name: 'Order No. 컬럼 메뉴' }).click();
    await expect(page.getByRole('button', { name: 'Order No. 컬럼 숨기기' })).toBeDisabled();
    await page.getByRole('button', { name: '숨긴 컬럼 1개 관리' }).click();
    await page.getByRole('dialog').getByRole('button', { name: /모두 표시|Show all/ }).click();

    await expect(page.getByRole('button', { name: 'Region 컬럼 메뉴' })).toBeVisible();
    await expect(page.getByText('Hidden 0')).toBeVisible();
  });

  test('keeps space between the hidden-column icon and label', async ({ page }) => {
    await page.goto('/column-visibility');

    const status = page.getByTestId('hidden-column-status');
    const iconBox = await status.locator('svg').boundingBox();
    const labelBox = await status.locator('span').boundingBox();

    expect(iconBox).not.toBeNull();
    expect(labelBox).not.toBeNull();
    expect(labelBox.x - (iconBox.x + iconBox.width)).toBeGreaterThanOrEqual(3);
    expect(Math.abs((iconBox.y + iconBox.height / 2) - (labelBox.y + labelBox.height / 2))).toBeLessThanOrEqual(2);
  });

  test('keeps the restore menu inside a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 420, height: 760 });
    await page.goto('/column-visibility');

    const customerMenu = page.getByRole('button', { name: 'Customer 컬럼 메뉴' });
    await customerMenu.click();
    await page.getByRole('button', { name: '숨긴 컬럼 1개 관리' }).click();

    const dialog = page.getByRole('dialog');
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box.x).toBeGreaterThanOrEqual(8);
    expect(box.y).toBeGreaterThanOrEqual(8);
    expect(box.x + box.width).toBeLessThanOrEqual(412);
    expect(box.y + box.height).toBeLessThanOrEqual(752);
    await expect(page.getByRole('button', { name: 'Owner 컬럼 표시' })).toBeVisible();
  });
});
