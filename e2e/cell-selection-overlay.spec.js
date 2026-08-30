import { expect, test } from '@playwright/test';

async function selectAntdOption(page, combobox, optionLabel) {
  const select = page.locator('.ant-select').filter({ has: combobox });
  await select.click();
  await page
    .locator('.ant-select-dropdown:visible')
    .last()
    .getByText(optionLabel, { exact: true })
    .click();
  await expect(select.locator('.ant-select-selection-item')).toHaveText(optionLabel);
  await expect(page.locator('.ant-select-dropdown:visible')).toHaveCount(0);
}

test.describe('Cell selection overlay', () => {
  test('keeps the active selection aligned while resizing the frozen boundary column', async ({ page }) => {
    await page.goto('/frozenColumns');

    await selectAntdOption(page, page.getByRole('combobox', { name: 'Number of Columns to Freeze' }), '1 cols');
    await selectAntdOption(page, page.getByRole('combobox', { name: 'Number of Rows to Freeze' }), '1 rows');
    await selectAntdOption(page, page.getByRole('combobox', { name: 'Summary Position' }), 'Bottom');

    const targetCell = page.locator(
      '[data-bgrid-quadrant="body-main"] td[data-row-index="4"][data-column-index="2"]',
    );
    await targetCell.click();

    const activeFragment = page.locator(
      '[data-bgrid-selection-quadrant="body-main"] [data-bgrid-active-fragment="true"]',
    );
    await expect(activeFragment).toHaveCount(1);

    const expectActiveCellAligned = async () => {
      await expect
        .poll(async () => {
          const [cellBox, selectionBox] = await Promise.all([
            targetCell.boundingBox(),
            activeFragment.boundingBox(),
          ]);
          if (!cellBox || !selectionBox) return null;
          return {
            left: Math.round(selectionBox.x - cellBox.x),
            right: Math.round(
              selectionBox.x + selectionBox.width - cellBox.x - cellBox.width,
            ),
          };
        })
        .toEqual({ left: 0, right: 0 });
    };

    await expectActiveCellAligned();

    const resizeHandle = page.locator(
      '[role="rfdg-frozen-header"] .bgrid-col-resizer[data-bgrid-frozen-boundary="true"]',
    );
    const resizeHandleBox = await resizeHandle.boundingBox();
    expect(resizeHandleBox).not.toBeNull();

    const resizeX = resizeHandleBox.x + resizeHandleBox.width / 2;
    const resizeY = resizeHandleBox.y + resizeHandleBox.height / 2;
    await page.mouse.move(resizeX, resizeY);
    await page.mouse.down();
    await page.mouse.move(resizeX + 42, resizeY, { steps: 5 });

    await expectActiveCellAligned();

    await page.mouse.up();
    await expectActiveCellAligned();
  });

  test('keeps a rectangular selection across frozen row and column quadrants', async ({ page }) => {
    await page.goto('/frozenColumns');

    const startCell = page.locator(
      '[data-bgrid-quadrant="top-left"] td[data-row-index="0"][data-column-index="1"]',
    );
    const endCell = page.locator(
      '[data-bgrid-quadrant="body-main"] td[data-row-index="4"][data-column-index="7"]',
    );
    await expect(startCell).toBeVisible();
    await expect(endCell).toBeVisible();

    const startBox = await startCell.boundingBox();
    const endBox = await endCell.boundingBox();
    expect(startBox).not.toBeNull();
    expect(endBox).not.toBeNull();

    await page.mouse.move(startBox.x + startBox.width / 2, startBox.y + startBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(endBox.x + endBox.width / 2, endBox.y + endBox.height / 2, { steps: 8 });
    await page.mouse.up();

    const topLeft = page.locator(
      '[data-bgrid-selection-quadrant="top-left"] [data-bgrid-selection-fragment="true"]',
    );
    const topMain = page.locator(
      '[data-bgrid-selection-quadrant="top-main"] [data-bgrid-selection-fragment="true"]',
    );
    const bodyLeft = page.locator(
      '[data-bgrid-selection-quadrant="body-left"] [data-bgrid-selection-fragment="true"]',
    );
    const bodyMain = page.locator(
      '[data-bgrid-selection-quadrant="body-main"] [data-bgrid-selection-fragment="true"]',
    );

    await expect(topLeft).toHaveCount(1);
    await expect(topMain).toHaveCount(1);
    await expect(bodyLeft).toHaveCount(1);
    await expect(bodyMain).toHaveCount(1);

    const activeTopLeft = page.locator(
      '[data-bgrid-selection-quadrant="top-left"] [data-bgrid-active-fragment="true"]',
    );
    await expect(activeTopLeft).toHaveCount(1);
    const frozenBoundary = page.locator('[role="rfdg-frozen-rows-left"]');
    await expect(frozenBoundary.locator('.bgrid-cell-selection-overlay-layer')).toHaveCSS('z-index', '2');
    await expect(startCell.locator('.bgrid-cell-content')).toHaveCSS('z-index', '3');
    expect(await frozenBoundary.evaluate(element => getComputedStyle(element, '::after').zIndex)).toBe('1');
    expect(await topLeft.evaluate(element => getComputedStyle(element, '::after').zIndex)).toBe('2');
    await expect(activeTopLeft).toHaveCSS('z-index', '1');

    await expect(topLeft).toHaveAttribute('data-edge-top', 'true');
    await expect(topLeft).toHaveAttribute('data-edge-left', 'true');
    await expect(topLeft).not.toHaveAttribute('data-edge-right');
    await expect(topLeft).not.toHaveAttribute('data-edge-bottom');
    await expect(topMain).toHaveAttribute('data-edge-top', 'true');
    await expect(topMain).toHaveAttribute('data-edge-right', 'true');
    await expect(bodyLeft).toHaveAttribute('data-edge-left', 'true');
    await expect(bodyLeft).toHaveAttribute('data-edge-bottom', 'true');
    await expect(bodyMain).toHaveAttribute('data-edge-right', 'true');
    await expect(bodyMain).toHaveAttribute('data-edge-bottom', 'true');

    const topLeftBox = await topLeft.boundingBox();
    const topMainBox = await topMain.boundingBox();
    const bodyLeftBox = await bodyLeft.boundingBox();
    const bodyMainBox = await bodyMain.boundingBox();
    expect(topLeftBox).not.toBeNull();
    expect(topMainBox).not.toBeNull();
    expect(bodyLeftBox).not.toBeNull();
    expect(bodyMainBox).not.toBeNull();

    expect(topLeftBox.x).toBeCloseTo(startBox.x, 0);
    expect(topLeftBox.y).toBeCloseTo(startBox.y, 0);
    expect(topLeftBox.x + topLeftBox.width).toBeCloseTo(topMainBox.x, 0);
    expect(bodyLeftBox.x + bodyLeftBox.width).toBeCloseTo(bodyMainBox.x, 0);
    expect(topLeftBox.y + topLeftBox.height).toBeCloseTo(bodyLeftBox.y, 0);
    expect(topMainBox.y + topMainBox.height).toBeCloseTo(bodyMainBox.y, 0);
    expect(bodyMainBox.x + bodyMainBox.width).toBeCloseTo(endBox.x + endBox.width, 0);
    expect(bodyMainBox.y + bodyMainBox.height).toBeCloseTo(endBox.y + endBox.height, 0);

    await expect(page.locator('td.bgrid-cell-selected')).toHaveCount(0);
    await expect(bodyMain).toHaveCSS('pointer-events', 'none');

    const endHeader = page.locator('[role="rfdg-head"] .bgrid-head-cell[data-column-index="7"]');
    const resizeHandle = endHeader.locator('.bgrid-col-resizer');
    const resizeHandleBox = await resizeHandle.boundingBox();
    expect(resizeHandleBox).not.toBeNull();
    await page.mouse.move(
      resizeHandleBox.x + resizeHandleBox.width / 2,
      resizeHandleBox.y + resizeHandleBox.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      resizeHandleBox.x + resizeHandleBox.width / 2 + 36,
      resizeHandleBox.y + resizeHandleBox.height / 2,
      { steps: 4 },
    );
    await page.mouse.up();

    await expect
      .poll(async () => {
        const selectionBox = await bodyMain.boundingBox();
        const targetBox = await endCell.boundingBox();
        return Math.round(selectionBox.x + selectionBox.width - targetBox.x - targetBox.width);
      })
      .toBe(0);
    expect((await bodyMain.boundingBox()).width).toBeGreaterThan(bodyMainBox.width + 20);

    await page.setViewportSize({ width: 1080, height: 720 });
    const scrollContainer = page.locator('[role="rfdg-scroll-container"]');
    await expect
      .poll(() =>
        scrollContainer.evaluate(element => ({ clientWidth: element.clientWidth, scrollWidth: element.scrollWidth })),
      )
      .toMatchObject({ clientWidth: expect.any(Number), scrollWidth: expect.any(Number) });
    await expect
      .poll(() => scrollContainer.evaluate(element => element.scrollWidth - element.clientWidth))
      .toBeGreaterThan(0);

    const topLeftBeforeScroll = await topLeft.boundingBox();
    const topMainBeforeScroll = await topMain.boundingBox();
    const bodyLeftBeforeScroll = await bodyLeft.boundingBox();
    const bodyMainBeforeScroll = await bodyMain.boundingBox();

    await scrollContainer.evaluate(element => {
      element.scrollTop = 29;
      element.scrollLeft = 67;
      element.dispatchEvent(new Event('scroll'));
    });

    await expect.poll(() => scrollContainer.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
    await expect.poll(() => scrollContainer.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);

    const appliedScrollTop = await scrollContainer.evaluate(element => element.scrollTop);
    const topLeftAfterScroll = await topLeft.boundingBox();
    const topMainAfterScroll = await topMain.boundingBox();
    const bodyLeftAfterScroll = await bodyLeft.boundingBox();
    const bodyMainAfterScroll = await bodyMain.boundingBox();
    const endCellAfterScroll = await endCell.boundingBox();

    expect(topLeftAfterScroll.x).toBeCloseTo(topLeftBeforeScroll.x, 0);
    expect(topLeftAfterScroll.y).toBeCloseTo(topLeftBeforeScroll.y, 0);
    expect(topMainAfterScroll.x).toBeCloseTo(topMainBeforeScroll.x, 0);
    expect(topMainAfterScroll.y).toBeCloseTo(topMainBeforeScroll.y, 0);
    expect(topMainAfterScroll.x + topMainAfterScroll.width).toBeCloseTo(
      endCellAfterScroll.x + endCellAfterScroll.width,
      0,
    );
    expect(bodyLeftAfterScroll.x).toBeCloseTo(bodyLeftBeforeScroll.x, 0);
    expect(bodyLeftAfterScroll.y).toBeCloseTo(bodyLeftBeforeScroll.y, 0);
    expect(bodyLeftAfterScroll.height).toBeCloseTo(bodyLeftBeforeScroll.height - appliedScrollTop, 0);
    expect(bodyMainAfterScroll.x).toBeCloseTo(bodyMainBeforeScroll.x, 0);
    expect(bodyMainAfterScroll.y).toBeCloseTo(bodyMainBeforeScroll.y, 0);
    expect(bodyMainAfterScroll.x + bodyMainAfterScroll.width).toBeCloseTo(
      endCellAfterScroll.x + endCellAfterScroll.width,
      0,
    );
    expect(bodyMainAfterScroll.height).toBeCloseTo(bodyMainBeforeScroll.height - appliedScrollTop, 0);
  });

  test('keeps visible selection geometry aligned for every scrollbar variant', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 720 });
    await page.goto('/scrollbar');

    const grid = page.locator('[role="grid"]');
    const startCell = grid.locator(
      '[data-bgrid-quadrant="body-left"] td[data-row-index="0"][data-column-index="0"]',
    );
    const endCell = grid.locator(
      '[data-bgrid-quadrant="body-main"] td[data-row-index="5"][data-column-index="2"]',
    );
    for (const variant of ['native', 'classic', 'modern']) {
      await page.locator('.ant-segmented-item').filter({ hasText: new RegExp(`^${variant}$`) }).click();
      await expect(grid).toHaveAttribute('data-scroll-variant', variant);

      const scrollContainer = grid.locator('[role="rfdg-scroll-container"]');
      await scrollContainer.evaluate(element => {
        element.scrollTop = 0;
        element.scrollLeft = 0;
        element.dispatchEvent(new Event('scroll'));
      });
      await expect.poll(() => scrollContainer.evaluate(element => element.scrollTop)).toBe(0);
      await expect.poll(() => scrollContainer.evaluate(element => element.scrollLeft)).toBe(0);
      await startCell.click();
      await endCell.click({ modifiers: ['Shift'] });

      await scrollContainer.evaluate(element => {
        element.scrollTop = 29;
        element.scrollLeft = 55;
        element.dispatchEvent(new Event('scroll'));
      });
      await expect.poll(() => scrollContainer.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
      await expect.poll(() => scrollContainer.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);

      const bodyLeft = grid.locator(
        '[data-bgrid-selection-quadrant="body-left"] [data-bgrid-selection-fragment="true"]',
      );
      const bodyMain = grid.locator(
        '[data-bgrid-selection-quadrant="body-main"] [data-bgrid-selection-fragment="true"]',
      );
      await expect(bodyLeft).toHaveCount(1);
      await expect(bodyMain).toHaveCount(1);

      const leftBox = await bodyLeft.boundingBox();
      const mainBox = await bodyMain.boundingBox();
      const endBox = await endCell.boundingBox();
      expect(leftBox.y).toBeCloseTo(mainBox.y, 0);
      expect(mainBox.x + mainBox.width).toBeCloseTo(endBox.x + endBox.width, 0);
      expect(mainBox.y + mainBox.height).toBeCloseTo(endBox.y + endBox.height, 0);
      await expect(bodyMain).toHaveCSS('pointer-events', 'none');
    }
  });

  test('updates the bounded overlay while drag selection auto-scrolls', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 720 });
    await page.goto('/scrollbar');

    const grid = page.locator('[role="grid"]');
    const startCell = grid.locator(
      '[data-bgrid-quadrant="body-main"] td[data-row-index="0"][data-column-index="1"]',
    );
    const scrollContainer = grid.locator('[role="rfdg-scroll-container"]');
    const startBox = await startCell.boundingBox();
    const scrollBox = await scrollContainer.boundingBox();
    expect(startBox).not.toBeNull();
    expect(scrollBox).not.toBeNull();

    await page.mouse.move(startBox.x + 20, startBox.y + startBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(scrollBox.x + 240, scrollBox.y + scrollBox.height - 2, { steps: 10 });
    await expect.poll(() => scrollContainer.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
    await page.mouse.up();

    const fragment = grid.locator(
      '[data-bgrid-selection-quadrant="body-main"] [data-bgrid-selection-fragment="true"]',
    );
    await expect(fragment).toHaveCount(1);
    const fragmentBox = await fragment.boundingBox();
    expect(fragmentBox.height).toBeLessThanOrEqual(scrollBox.height);
    await expect(fragment).toHaveCSS('pointer-events', 'none');
  });
});
