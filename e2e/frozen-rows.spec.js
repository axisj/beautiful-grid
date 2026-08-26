import { expect, test } from '@playwright/test';

async function selectAntdOption(page, combobox, optionLabel) {
  await page.locator('.ant-select').filter({ has: combobox }).click();
  await page.locator('.ant-select-dropdown:visible').getByText(optionLabel, { exact: true }).click();
}

test.describe('Frozen rows and columns', () => {
  test('keeps every frozen quadrant aligned in a touch-enabled mobile viewport', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();

    try {
      await page.goto('/frozenColumns');

      const scrollContainer = page.locator('[role="rfdg-scroll-container"]');
      const topLeft = page.locator('[data-bgrid-quadrant="top-left"]');
      const topLeftBefore = await topLeft.boundingBox();
      await scrollContainer.evaluate(element => {
        element.scrollTo({ left: 120, top: 220 });
      });
      await expect.poll(() => scrollContainer.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
      await expect.poll(() => scrollContainer.evaluate(element => element.scrollTop)).toBeGreaterThan(0);

      const grid = page.locator('[role="grid"]');
      await expect
        .poll(() =>
          grid.evaluate(root => {
            const scroll = root.querySelector('[role="rfdg-scroll-container"]');
            const header = root.querySelector('[role="rfdg-header"]');
            const topMain = root.querySelector('[role="rfdg-frozen-rows-main"]');
            const bodyLeft = root.querySelector('[data-bgrid-quadrant="body-left"]');
            const bodyMain = root.querySelector('[data-bgrid-quadrant="body-main"]');
            if (!scroll || !header || !topMain || !bodyLeft || !bodyMain) return null;

            const firstVisibleMainRow = bodyMain.querySelector('tr[data-ri]');
            const rowIndex = firstVisibleMainRow?.getAttribute('data-ri');
            const leftRow = rowIndex ? bodyLeft.querySelector(`tr[data-ri="${rowIndex}"]`) : null;
            const mainRow = rowIndex ? bodyMain.querySelector(`tr[data-ri="${rowIndex}"]`) : null;
            const firstMainHeaderCell = header.querySelector('[data-column-index]');
            const columnIndex = firstMainHeaderCell?.getAttribute('data-column-index');
            const firstMainBodyCell = columnIndex
              ? bodyMain.querySelector(`[data-column-index="${columnIndex}"]`)
              : null;
            const firstFrozenRowCell = columnIndex
              ? topMain.querySelector(`[data-column-index="${columnIndex}"]`)
              : null;
            const horizontalDelta = firstMainHeaderCell && firstMainBodyCell
              ? Math.abs(firstMainHeaderCell.getBoundingClientRect().left - firstMainBodyCell.getBoundingClientRect().left)
              : Number.POSITIVE_INFINITY;
            const frozenHorizontalDelta = firstMainHeaderCell && firstFrozenRowCell
              ? Math.abs(firstMainHeaderCell.getBoundingClientRect().left - firstFrozenRowCell.getBoundingClientRect().left)
              : Number.POSITIVE_INFINITY;
            const frozenRowDelta = leftRow && mainRow
              ? Math.abs(leftRow.getBoundingClientRect().top - mainRow.getBoundingClientRect().top)
              : Number.POSITIVE_INFINITY;

            return {
              headerAligned: horizontalDelta <= 1,
              topMainAligned: frozenHorizontalDelta <= 1,
              transformsRemoved:
                header.style.transform === '' &&
                topMain.style.transform === '' &&
                bodyLeft.style.transform === '',
              stickyWrappers:
                getComputedStyle(root.querySelector('[role="rfdg-header-container"]')).position === 'sticky' &&
                getComputedStyle(root.querySelector('[data-bgrid-row-band="frozen"]')).position === 'sticky' &&
                getComputedStyle(root.querySelector('[role="rfdg-frozen-scroll-container"]')).position === 'sticky',
              marginsRemoved:
                getComputedStyle(header).marginLeft === '0px' &&
                getComputedStyle(topMain).marginLeft === '0px' &&
                getComputedStyle(bodyLeft).marginTop === '0px',
              frozenRowsAligned: frozenRowDelta <= 1,
            };
          }),
        )
        .toEqual({
          headerAligned: true,
          topMainAligned: true,
          transformsRemoved: true,
          stickyWrappers: true,
          marginsRemoved: true,
          frozenRowsAligned: true,
        });

      const topLeftAfter = await topLeft.boundingBox();
      expect(topLeftAfter.x).toBeCloseTo(topLeftBefore.x, 0);
      expect(topLeftAfter.y).toBeCloseTo(topLeftBefore.y, 0);
    } finally {
      await context.close();
    }
  });

  test('keeps four quadrants synchronized below the top summary', async ({ page }) => {
    await page.goto('/frozenColumns');

    const summary = page.locator('[role="rfdg-summary-container"]');
    const frozenBand = page.locator('[data-bgrid-row-band="frozen"]');
    const topLeft = page.locator('[data-bgrid-quadrant="top-left"]');
    const topMain = page.locator('[data-bgrid-quadrant="top-main"]');
    const bodyMain = page.locator('[data-bgrid-quadrant="body-main"]');
    const scrollContainer = page.locator('[role="rfdg-scroll-container"]');

    await expect(topLeft.locator('tr[data-ri]')).toHaveCount(2);
    await expect(topMain.locator('tr[data-ri]')).toHaveCount(2);
    await expect(topLeft.locator('.bgrid-line-number-cell')).toHaveCount(2);
    await expect(topMain.locator('tr[data-ri]').last().locator('td').first()).toHaveCSS('border-bottom-width', '0px');
    await expect.poll(() => frozenBand.evaluate(element => getComputedStyle(element, '::after').height)).toBe('1px');
    const frozenRowBoundaryStyle = await frozenBand.evaluate(element => {
      const boundaryStyle = getComputedStyle(element, '::after');
      return {
        color: boundaryStyle.backgroundColor,
        shadow: boundaryStyle.boxShadow,
        zIndex: boundaryStyle.zIndex,
      };
    });
    expect(frozenRowBoundaryStyle.shadow).toBe('rgba(15, 23, 42, 0.09) 0px 2px 2px 0px');
    expect(frozenRowBoundaryStyle.zIndex).toBe('10');
    await expect(bodyMain.locator('tr[data-ri="0"]')).toHaveCount(0);
    await expect(bodyMain.locator('tr[data-ri="1"]')).toHaveCount(0);

    const summaryBox = await summary.boundingBox();
    const frozenBox = await frozenBand.boundingBox();
    expect(summaryBox).not.toBeNull();
    expect(frozenBox).not.toBeNull();
    expect(summaryBox.y + summaryBox.height).toBeCloseTo(frozenBox.y, 0);

    const frozenHeader = page.locator('[role="rfdg-frozen-header"]');
    const headerBoundaryBox = await frozenHeader.boundingBox();
    const summaryBoundaryBox = await page.locator('[role="rfdg-frozen-summary"]').boundingBox();
    const frozenRowsBoundaryBox = await page.locator('.bgrid-frozen-rows-left').boundingBox();
    const bodyBoundaryBox = await page.locator('[role="rfdg-frozen-scroll-container"]').boundingBox();
    const boundaryRight = headerBoundaryBox.x + headerBoundaryBox.width;
    expect(summaryBoundaryBox.x + summaryBoundaryBox.width).toBeCloseTo(boundaryRight, 0);
    expect(frozenRowsBoundaryBox.x + frozenRowsBoundaryBox.width).toBeCloseTo(boundaryRight, 0);
    expect(bodyBoundaryBox.x + bodyBoundaryBox.width).toBeCloseTo(boundaryRight, 0);

    const frozenBoundaryResizer = frozenHeader.locator(
      '.bgrid-col-resizer[data-bgrid-frozen-boundary="true"]',
    );
    const regularResizer = page.locator('[role="rfdg-head"] .bgrid-col-resizer-handle').first();
    await expect(frozenBoundaryResizer).toHaveCount(1);
    const headerBoundaryStyle = await frozenHeader.evaluate(element => {
      const boundaryStyle = getComputedStyle(element, '::after');
      return { color: boundaryStyle.backgroundColor, shadow: getComputedStyle(element).boxShadow };
    });
    const frozenResizerColor = await frozenBoundaryResizer.evaluate(
      element => getComputedStyle(element, '::after').backgroundColor,
    );
    const regularResizerColor = await regularResizer.evaluate(
      element => getComputedStyle(element, '::after').backgroundColor,
    );
    expect(frozenResizerColor).toBe(headerBoundaryStyle.color);
    expect(frozenRowBoundaryStyle.color).toBe(headerBoundaryStyle.color);
    expect(regularResizerColor).not.toBe(headerBoundaryStyle.color);
    expect(headerBoundaryStyle.shadow).toBe('rgba(15, 23, 42, 0.09) 2px 0px 2px 0px');

    const topLeftBefore = await topLeft.boundingBox();
    const topMainBefore = await topMain.boundingBox();
    await scrollContainer.evaluate(element => {
      element.scrollTop = 360;
      element.scrollLeft = 82;
      element.dispatchEvent(new Event('scroll'));
    });

    await expect.poll(async () => scrollContainer.evaluate(element => element.scrollTop)).toBe(360);
    // Virtual rows are rendered in stable eight-row windows so held-key navigation
    // and adjacent scroll events do not remount the body on every row boundary.
    await expect.poll(async () => bodyMain.locator('tr[data-ri]').first().getAttribute('data-ri')).toBe('10');
    await expect(bodyMain.locator('tr[data-ri="14"]')).toHaveCount(1);

    const topLeftAfter = await topLeft.boundingBox();
    const topMainAfter = await topMain.boundingBox();
    const appliedScrollLeft = await scrollContainer.evaluate(element => element.scrollLeft);
    expect(topLeftAfter.y).toBeCloseTo(topLeftBefore.y, 0);
    expect(topMainAfter.x).toBeCloseTo(topMainBefore.x - appliedScrollLeft, 0);

    await scrollContainer.evaluate(element => {
      element.scrollLeft = element.scrollWidth;
      element.dispatchEvent(new Event('scroll'));
    });
    const statusHeader = page.locator('[role="rfdg-head"] [data-column-index="9"]');
    const statusCell = page.locator('[data-bgrid-quadrant="body-main"] [data-column-index="9"]').first();
    const headerFillerCell = page.locator('[role="rfdg-head"] td[data-none]');
    const bodyFillerCell = bodyMain.locator('td[data-none]').first();
    const verticalScrollbar = page.locator('.bgrid-vertical-scrollbar-area');
    const verticalScrollbarGutter = page.locator('.bgrid-vertical-scrollbar-gutter');
    await expect(statusCell).toBeVisible();
    await expect
      .poll(async () => {
        const fillerBox = await headerFillerCell.boundingBox();
        const scrollbarBox = await verticalScrollbar.boundingBox();
        return Math.round(fillerBox.x + fillerBox.width - scrollbarBox.x);
      })
      .toBe(0);

    const statusHeaderBox = await statusHeader.boundingBox();
    const statusCellBox = await statusCell.boundingBox();
    const headerFillerCellBox = await headerFillerCell.boundingBox();
    const bodyFillerCellBox = await bodyFillerCell.boundingBox();
    const verticalScrollbarBox = await verticalScrollbar.boundingBox();
    const verticalScrollbarGutterBox = await verticalScrollbarGutter.boundingBox();
    const gridBox = await page.locator('[role="grid"]').boundingBox();
    const bottomBarBox = await page.locator('[role="rfdg-footer-container"]').boundingBox();
    expect(statusHeaderBox.x + statusHeaderBox.width).toBeCloseTo(statusCellBox.x + statusCellBox.width, 0);
    expect(headerFillerCellBox.x).toBeCloseTo(statusHeaderBox.x + statusHeaderBox.width, 0);
    expect(bodyFillerCellBox.x).toBeCloseTo(statusCellBox.x + statusCellBox.width, 0);
    expect(headerFillerCellBox.x + headerFillerCellBox.width).toBeCloseTo(verticalScrollbarBox.x, 0);
    expect(bodyFillerCellBox.x + bodyFillerCellBox.width).toBeCloseTo(verticalScrollbarBox.x, 0);
    expect(verticalScrollbarGutterBox.x).toBeCloseTo(verticalScrollbarBox.x, 0);
    expect(verticalScrollbarGutterBox.y).toBeCloseTo(gridBox.y + 1, 0);
    expect(verticalScrollbarGutterBox.height).toBeCloseTo(gridBox.height - 2, 0);
    expect(verticalScrollbarBox.y).toBeCloseTo(verticalScrollbarGutterBox.y, 0);
    expect(verticalScrollbarBox.y + verticalScrollbarBox.height).toBeCloseTo(bottomBarBox.y, 0);
    expect(verticalScrollbarGutterBox.height - verticalScrollbarBox.height).toBeCloseTo(
      bottomBarBox.height,
      0,
    );
    await expect(page.locator('[role="rfdg-footer-container"]')).toHaveCSS('border-top-width', '1px');
    await expect(page.locator('[role="rfdg-footer-container"]')).toHaveCSS('z-index', '10');
  });

  test('keeps the keyboard active cell inside the scrollable body viewport', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 720 });
    await page.goto('/frozenColumns');

    const scrollContainer = page.locator('[role="rfdg-scroll-container"]');
    const startCell = page.locator(
      '[data-bgrid-quadrant="body-main"] td[data-row-index="2"][data-column-index="2"]',
    );
    await startCell.click();

    for (let index = 0; index < 10; index += 1) {
      await page.keyboard.press('ArrowDown');
    }

    const activeFragment = page.locator(
      '[data-bgrid-selection-quadrant="body-main"] [data-bgrid-active-fragment="true"]',
    );
    await expect(activeFragment).toHaveCount(1);
    await expect
      .poll(async () => {
        const activeBox = await activeFragment.boundingBox();
        const viewport = await scrollContainer.evaluate(element => {
          const scrollRect = element.getBoundingClientRect();
          const frozenRows = element.querySelector('[data-bgrid-row-band="frozen"]');
          const frozenRowsRect = frozenRows?.getBoundingClientRect();
          return {
            top: frozenRowsRect?.bottom ?? scrollRect.top,
            bottom: scrollRect.top + element.clientHeight,
            scrollTop: element.scrollTop,
          };
        });
        if (!activeBox) return null;
        return {
          insideTop: activeBox.y >= viewport.top - 1,
          insideBottom: activeBox.y + activeBox.height <= viewport.bottom + 1,
          didScroll: viewport.scrollTop > 0,
        };
      })
      .toEqual({ insideTop: true, insideBottom: true, didScroll: true });

    for (let index = 0; index < 7; index += 1) {
      await page.keyboard.press('ArrowRight');
    }

    await expect(page.locator('td.bgrid-cell-active')).toHaveAttribute('data-column-index', '9');
    await expect(activeFragment).toHaveCount(1);
    await expect
      .poll(async () => {
        const activeBox = await activeFragment.boundingBox();
        const viewport = await scrollContainer.evaluate(element => {
          const scrollRect = element.getBoundingClientRect();
          const frozenHeader = element.querySelector('[role="rfdg-frozen-header"]');
          const frozenHeaderRect = frozenHeader?.getBoundingClientRect();
          return {
            left: frozenHeaderRect?.right ?? scrollRect.left,
            right: scrollRect.left + element.clientWidth,
            scrollLeft: element.scrollLeft,
          };
        });
        if (!activeBox) return null;
        return {
          insideLeft: activeBox.x >= viewport.left - 1,
          insideRight: activeBox.x + activeBox.width <= viewport.right + 1,
          didScroll: viewport.scrollLeft > 0,
        };
      })
      .toEqual({ insideLeft: true, insideRight: true, didScroll: true });
  });

  test('changes the frozen row boundary from the example control', async ({ page }) => {
    await page.goto('/frozenColumns');

    const rowCountSelect = page.getByRole('combobox', { name: '고정할 행 수' });
    const frozenBand = page.locator('[data-bgrid-row-band="frozen"]');
    const scrollableBand = page.locator('[data-bgrid-row-band="scrollable"]');

    for (const count of [1, 2, 3, 5]) {
      await selectAntdOption(page, rowCountSelect, `${count}개`);
      const frozenRows = page.locator('[data-bgrid-quadrant="top-main"] tr[data-ri]');
      await expect(frozenRows).toHaveCount(count);
      await expect(page.locator(`[data-bgrid-quadrant="body-main"] tr[data-ri="${count}"]`)).toBeVisible();
      await expect(frozenRows.last().locator('td').first()).toHaveCSS('border-bottom-width', '0px');
      await expect.poll(() => frozenBand.evaluate(element => getComputedStyle(element, '::after').height)).toBe('1px');
      await expect
        .poll(async () => {
          const lastRowBox = await frozenRows.last().boundingBox();
          const frozenBandBox = await frozenBand.boundingBox();
          const scrollableBandBox = await scrollableBand.boundingBox();
          return {
            rowToBoundary: Math.round(frozenBandBox.y + frozenBandBox.height - (lastRowBox.y + lastRowBox.height)),
            boundaryToBody: Math.round(scrollableBandBox.y - (frozenBandBox.y + frozenBandBox.height)),
          };
        })
        .toEqual({ rowToBoundary: 0, boundaryToBody: 0 });
    }

    await selectAntdOption(page, rowCountSelect, '0개');
    await expect(page.locator('[data-bgrid-row-band="frozen"]')).toHaveCount(0);
    await expect(
      page.getByText('Summary 상단 표시 · Summary 다음 줄부터 0개 행, 왼쪽 2개 컬럼을 고정합니다.'),
    ).toBeVisible();
  });

  test('toggles the detailed summary and moves it below the body', async ({ page }) => {
    await page.goto('/frozenColumns');

    const summaryToggle = page.getByLabel('Summary 표시');
    const summaryPosition = page.getByRole('combobox', { name: 'Summary 위치' });
    const summaryBand = page.locator('[role="rfdg-summary-container"]');
    const summaryLabel = summaryBand.getByText('인력 요약');

    await expect(summaryBand).toBeVisible();
    await expect(summaryBand).toContainText('4개 부서');
    await expect(summaryBand).toContainText('평균 80%');
    await expect(summaryLabel.locator('xpath=ancestor::td')).toHaveCSS('text-align', 'center');

    await selectAntdOption(page, summaryPosition, '하단');
    await expect(page.getByText(/Summary 하단 표시 · 첫 데이터 행부터/)).toBeVisible();
    await expect
      .poll(async () => {
        const bodyBox = await page.locator('.bgrid-body-container').boundingBox();
        const summaryBox = await summaryBand.boundingBox();
        return Math.round(summaryBox.y - (bodyBox.y + bodyBox.height));
      })
      .toBe(0);

    await summaryToggle.uncheck();
    await expect(summaryBand).toHaveCount(0);
    await expect(summaryPosition).toBeDisabled();
    await expect(page.getByText(/Summary 숨김 · 첫 데이터 행부터/)).toBeVisible();
  });
});
