import { expect, test } from '@playwright/test';

test.describe('Cell editor lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/editor');
    await expect(page.locator("[role='grid']")).toBeVisible();
  });

  test('starts the built-in text editor from direct Korean input and restores navigation focus', async ({ page }) => {
    const customerCell = page.locator('td[data-row-index="0"][data-column-index="1"]').first();
    await customerCell.click();
    await page.keyboard.type('장기영');

    const gateway = page.locator('[data-bgrid-text-editor-gateway="true"]');
    await expect(gateway).toHaveClass(/bgrid-text-editor-active/);
    await expect(gateway).toHaveValue('장기영');

    await page.keyboard.press('Enter');
    await expect(customerCell).toContainText('장기영');
    await expect(gateway).not.toHaveClass(/bgrid-text-editor-active/);
    await expect(gateway).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(page.locator('td[data-row-index="0"][data-column-index="2"]').first()).toHaveClass(/bgrid-cell-active/);
  });

  test('commits a prebuilt select plugin and returns focus to the grid gateway', async ({ page }) => {
    const useCell = page.locator('td[data-row-index="0"][data-column-index="2"]').first();
    await useCell.click();
    await page.locator('[data-bgrid-text-editor-gateway="true"]').focus();
    await page.keyboard.press('Enter');

    const editor = page.getByLabel('사용 여부 편집');
    await expect(editor).toBeVisible();
    await editor.selectOption('1');

    await expect(useCell).toContainText('사용 안 함');
    await expect(page.locator('[data-bgrid-text-editor-gateway="true"]')).toBeFocused();
  });
});
