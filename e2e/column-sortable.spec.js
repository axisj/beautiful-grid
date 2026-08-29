import { expect, test } from '@playwright/test';

test('loads column reordering on demand and moves a header in the real browser', async ({ page }) => {
  await page.goto('/columnSort');

  const firstHeader = page.locator("[role='rfdg-head'] td[data-column-index='0']");
  const secondHeader = page.locator("[role='rfdg-head'] td[data-column-index='1']");
  await expect(firstHeader).toContainText('Nation');
  await expect(secondHeader).toContainText('active population');

  const source = secondHeader.locator('.bgrid-column-drag-handle');
  const target = firstHeader.locator('.bgrid-column-drag-handle');
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  expect(sourceBox).not.toBeNull();
  expect(targetBox).not.toBeNull();

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(100);
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 8 });
  await page.mouse.up();

  await expect(page.locator("[role='rfdg-head'] td[data-column-index='0']")).toContainText('active population');
  await expect(page.locator("[role='rfdg-head'] td[data-column-index='1']")).toContainText('Nation');
});
