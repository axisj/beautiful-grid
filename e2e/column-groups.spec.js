import { expect, test } from '@playwright/test';

async function selectAntdOption(page, combobox, optionLabel) {
  await page.locator('.ant-select').filter({ has: combobox }).click();
  await page.locator('.ant-select-dropdown:visible').getByText(optionLabel, { exact: true }).click();
}

test.describe('Nested column groups', () => {
  test('renders four header levels and splits groups at the frozen boundary', async ({ page }) => {
    await page.goto('/columnGroup');

    const frozenHead = page.locator('[role="rfdg-head-frozen"]');
    const scrollingHead = page.locator('[role="rfdg-head"]');
    await expect(frozenHead.locator(':scope > tr')).toHaveCount(4);
    await expect(scrollingHead.locator(':scope > tr')).toHaveCount(4);

    await expect(frozenHead.locator('[data-group-id="order-overview"]')).toHaveAttribute('colspan', '4');
    await expect(scrollingHead.locator('[data-group-id="order-overview"]')).toHaveAttribute('colspan', '4');
    await expect(frozenHead.locator('[data-group-id="product-detail"]')).toHaveAttribute('colspan', '1');
    await expect(scrollingHead.locator('[data-group-id="product-detail"]')).toHaveAttribute('colspan', '1');
  });

  test('changes the frozen boundary from the example controls', async ({ page }) => {
    await page.goto('/columnGroup');

    const boundarySelect = page.getByRole('combobox', { name: '틀고정 위치' });
    await expect(page.locator('.ant-select').filter({ has: boundarySelect })).toContainText('4개 · 상품 뒤');
    await selectAntdOption(page, boundarySelect, '2개 · 고객명 뒤');

    const frozenHead = page.locator('[role="rfdg-head-frozen"]');
    const scrollingHead = page.locator('[role="rfdg-head"]');
    await expect(frozenHead.locator('[data-group-id="order-overview"]')).toHaveAttribute('colspan', '2');
    await expect(scrollingHead.locator('[data-group-id="order-overview"]')).toHaveAttribute('colspan', '6');
    await expect(page.getByText('앞쪽 2개 컬럼을 고정했습니다.')).toBeVisible();
  });

  test('resizes a leaf column without using a group cell as its geometry target', async ({ page }) => {
    await page.goto('/columnGroup');

    const leaf = page.locator('[role="rfdg-head"] .bgrid-head-cell[data-column-index="4"]');
    const handle = leaf.locator('.bgrid-col-resizer');
    const before = await leaf.boundingBox();
    const handleBox = await handle.boundingBox();
    expect(before).not.toBeNull();
    expect(handleBox).not.toBeNull();

    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox.x + handleBox.width / 2 + 40, handleBox.y + handleBox.height / 2, { steps: 4 });
    await page.mouse.up();

    await expect.poll(async () => (await leaf.boundingBox())?.width ?? 0).toBeGreaterThan((before?.width ?? 0) + 20);
  });

  test('reorders leaves only within the same parent group', async ({ page }) => {
    await page.goto('/columnGroup');

    const customer = page.locator('[role="rfdg-head-frozen"] .bgrid-head-cell[data-column-index="1"]');
    const region = page.locator('[role="rfdg-head-frozen"] .bgrid-head-cell[data-column-index="2"]');
    const customerBox = await customer.boundingBox();
    const regionBox = await region.boundingBox();
    expect(customerBox).not.toBeNull();
    expect(regionBox).not.toBeNull();

    await page.mouse.move(customerBox.x + 20, customerBox.y + customerBox.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.move(customerBox.x + 35, customerBox.y + customerBox.height / 2, { steps: 3 });
    await page.waitForTimeout(100);
    await page.mouse.move(regionBox.x + regionBox.width - 10, regionBox.y + regionBox.height / 2, { steps: 12 });
    await page.waitForTimeout(150);
    await page.mouse.up();

    const labels = page.locator(
      '[role="rfdg-head-frozen"] .bgrid-head-cell[data-parent-group-id="customer-detail"] .bgrid-head-column-label',
    );
    await expect(labels).toHaveText(['지역', '고객명']);
  });

  test('rejects a leaf move into a different parent group', async ({ page }) => {
    await page.goto('/columnGroup');

    const region = page.locator('[role="rfdg-head-frozen"] .bgrid-head-cell[data-column-index="2"]');
    const product = page.locator('[role="rfdg-head-frozen"] .bgrid-head-cell[data-column-index="3"]');
    const sourceBox = await region.boundingBox();
    const targetBox = await product.boundingBox();
    expect(sourceBox).not.toBeNull();
    expect(targetBox).not.toBeNull();

    await page.mouse.move(sourceBox.x + 20, sourceBox.y + sourceBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + targetBox.width - 10, targetBox.y + targetBox.height / 2, { steps: 12 });
    await page.mouse.up();

    await expect(page.locator('[role="rfdg-head-frozen"] .bgrid-head-cell[data-column-index="2"]')).toContainText(
      '지역',
    );
    await expect(page.locator('[role="rfdg-head-frozen"] .bgrid-head-cell[data-column-index="3"]')).toContainText(
      '상품',
    );
  });
});
