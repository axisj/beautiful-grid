import { expect, test } from '@playwright/test';

test.describe('Header Toolbox E2E', () => {
  test('keeps toolbox and resize controls independent from column dragging', async ({ page }) => {
    await page.goto('/toolbox');

    const headerCell = page.locator('[role="rfdg-head"] .bgrid-head-cell[data-column-index="1"]');
    const trigger = headerCell.locator('.bgrid-toolbox-trigger-btn');
    const resizeHandle = headerCell.locator('.bgrid-col-resizer');

    await expect(headerCell).toHaveClass(/drag-item/);
    await expect(headerCell.locator('.bgrid-column-drag-handle')).toHaveCount(1);
    await expect(trigger).not.toHaveClass(/bgrid-column-drag-handle/);
    await expect(resizeHandle).not.toHaveClass(/bgrid-column-drag-handle/);

    await trigger.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');

    const before = await headerCell.boundingBox();
    const resizeBox = await resizeHandle.boundingBox();
    expect(before).not.toBeNull();
    expect(resizeBox).not.toBeNull();

    await page.mouse.move(resizeBox.x + resizeBox.width / 2, resizeBox.y + resizeBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(resizeBox.x + resizeBox.width / 2 + 40, resizeBox.y + resizeBox.height / 2, { steps: 4 });
    await page.mouse.up();

    await expect.poll(async () => (await headerCell.boundingBox())?.width ?? 0).toBeGreaterThan((before?.width ?? 0) + 20);
  });

  test('opens toolbox popover, filters rows and resets with Escape and buttons', async ({ page }) => {
    await page.goto('/toolbox');

    await expect(page.getByRole('heading', { level: 2, name: 'Header Toolbox (Sort & Filter)' })).toBeVisible();

    // 1. Check trigger buttons exist
    const triggerButtons = page.locator('.bgrid-toolbox-trigger-btn');
    await expect(triggerButtons.first()).toBeVisible();

    // 2. Open Title (index 1) toolbox popover
    await triggerButtons.nth(1).click();
    const dialog = page.locator("div[role='dialog']");
    await expect(dialog).toBeVisible();

    // 3. Close with Escape
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    // 4. Open again and filter by text
    await triggerButtons.nth(1).click();
    await expect(dialog).toBeVisible();

    const input = dialog.locator('input[placeholder="검색어 입력..."]');
    await input.fill('React');

    const applyButton = dialog.getByRole('button', { name: '적용' });
    await applyButton.click();

    // Dialog closes or remains, query summary updates
    await expect(page.getByText('col_title(text)')).toBeVisible();

    // 5. Test Icon switcher
    const defaultIconBtn = page.getByRole('tab', { name: '기본 불릿/기호 (Fallback)' });
    if (await defaultIconBtn.isVisible()) {
      await defaultIconBtn.click();
      await expect(page.locator('.bgrid-toolbox-trigger-btn svg')).toBeVisible();
    }
  });

  test('connects aria ids and supports keyboard focus lifecycle', async ({ page }) => {
    await page.goto('/toolbox');

    const trigger = page.locator('.bgrid-toolbox-trigger-btn').first();
    await trigger.focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const triggerId = await trigger.getAttribute('id');
    const dialogId = await dialog.getAttribute('id');
    expect(triggerId).toBeTruthy();
    expect(dialogId).toBeTruthy();
    await expect(trigger).toHaveAttribute('aria-controls', dialogId);
    await expect(dialog).toHaveAttribute('aria-labelledby', triggerId);

    const sortAsc = dialog.getByRole('button', { name: '오름차순 정렬' });
    const sortDesc = dialog.getByRole('button', { name: '내림차순 정렬' });
    await expect(sortAsc).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(sortDesc).toBeFocused();

    const box = await dialog.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    await page.keyboard.press('Space');
    await expect(dialog).toBeVisible();
    await page.getByRole('heading', { level: 2, name: 'Header Toolbox (Sort & Filter)' }).click();
    await expect(dialog).toBeHidden();
  });
});
