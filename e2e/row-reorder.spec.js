import { expect, test } from '@playwright/test';

const initialTitles = [
  'Summer Season Up to 40% Promotion',
  'New Member Welcome Coupon Guide',
  'Premium Membership Open',
  'Order Today, Arrive Tomorrow Campaign',
  'KakaoPay Instant Discount',
];
const reorderedTitles = [initialTitles[1], initialTitles[2], initialTitles[0], initialTitles[3], initialTitles[4]];

const visibleTitles = page =>
  page.locator('[role="rfdg-body"] td[data-column-index="1"]').evaluateAll(cells =>
    cells.slice(0, 5).map(cell => cell.textContent?.trim()),
  );

async function dragFirstRowToThird(page) {
  const handle = page.locator('.bgrid-row-reorder-handle[data-row-reorder-index="0"]');
  const target = page.locator('[role="rfdg-body"] tr[data-ri="2"]');
  const handleBox = await handle.boundingBox();
  const targetBox = await target.boundingBox();
  expect(handleBox).not.toBeNull();
  expect(targetBox).not.toBeNull();

  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + 20, targetBox.y + targetBox.height / 2, { steps: 8 });
}

test.describe('Row reorder motion', () => {
  test('shifts frozen and main rows together before committing after settle', async ({ page }) => {
    await page.goto('/reorder');
    await expect.poll(() => visibleTitles(page)).toEqual(initialTitles);

    await dragFirstRowToThird(page);

    const root = page.locator('[role="grid"]');
    await expect(root).toHaveAttribute('data-bgrid-row-reordering', 'true');
    await expect(root).toHaveAttribute('data-bgrid-row-reorder-phase', 'dragging');
    expect(await visibleTitles(page)).toEqual(initialTitles);

    const leftShiftCell = page.locator('[role="rfdg-body-frozen"] tr[data-ri="1"] > td').first();
    const mainShiftCell = page.locator('[role="rfdg-body"] tr[data-ri="1"] > td').first();
    await expect.poll(async () => leftShiftCell.evaluate(cell => getComputedStyle(cell).transform)).not.toBe('none');
    const [leftTransform, mainTransform, transitionDuration] = await Promise.all([
      leftShiftCell.evaluate(cell => getComputedStyle(cell).transform),
      mainShiftCell.evaluate(cell => getComputedStyle(cell).transform),
      mainShiftCell.evaluate(cell => getComputedStyle(cell).transitionDuration),
    ]);
    expect(mainTransform).toBe(leftTransform);
    expect(transitionDuration).toBe('0.15s');

    await page.mouse.up();

    await expect.poll(() => visibleTitles(page)).toEqual(reorderedTitles);
    await expect(root).not.toHaveAttribute('data-bgrid-row-reordering');
    await expect(root.locator('[data-bgrid-row-reorder-role]')).toHaveCount(0);
  });

  test('uses the same permutation for keyboard reorder', async ({ page }) => {
    await page.goto('/reorder');
    const firstHandle = page.locator('.bgrid-row-reorder-handle[data-row-reorder-index="0"]');
    await firstHandle.focus();
    await firstHandle.press('Space');
    await firstHandle.press('ArrowDown');
    await firstHandle.press('ArrowDown');

    expect(await visibleTitles(page)).toEqual(initialTitles);
    await expect(page.locator('[role="grid"]')).toHaveAttribute('data-bgrid-row-reorder-phase', 'dragging');
    await firstHandle.press('Enter');

    await expect.poll(() => visibleTitles(page)).toEqual(reorderedTitles);
    await expect(page.locator('.bgrid-row-reorder-handle[data-row-reorder-index="2"]')).toBeFocused();
  });

  test('removes the settle delay for reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/reorder');
    await dragFirstRowToThird(page);

    const shiftedCell = page.locator('[role="rfdg-body"] tr[data-ri="1"] > td').first();
    await expect.poll(async () => shiftedCell.evaluate(cell => getComputedStyle(cell).transitionDuration)).toBe('0s');
    await page.mouse.up();

    await expect.poll(() => visibleTitles(page)).toEqual(reorderedTitles);
    await expect(page.locator('[role="grid"]')).not.toHaveAttribute('data-bgrid-row-reordering');
  });

  test('auto-scrolls a virtual body and keeps a preview after the source row unmounts', async ({ page }) => {
    await page.goto('/reorder');
    const handle = page.locator('.bgrid-row-reorder-handle[data-row-reorder-index="0"]');
    const scrollContainer = page.locator('[role="rfdg-scroll-container"]');
    const handleBox = await handle.boundingBox();
    const scrollBox = await scrollContainer.boundingBox();
    expect(handleBox).not.toBeNull();
    expect(scrollBox).not.toBeNull();

    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(scrollBox.x + 40, scrollBox.y + scrollBox.height - 2, { steps: 6 });

    await expect.poll(async () => scrollContainer.evaluate(element => element.scrollTop)).toBeGreaterThan(100);
    await expect(page.locator('.bgrid-row-reorder-preview')).toBeVisible();
    await expect(page.locator('[role="rfdg-body"] tr[data-ri="0"]')).toHaveCount(0);

    await page.mouse.up();
    await expect(page.locator('[role="grid"]')).not.toHaveAttribute('data-bgrid-row-reordering');
    await expect(page.locator('.bgrid-row-reorder-preview')).toHaveCount(0);
  });
});
