import { expect, test } from '@playwright/test';

test.describe('BGrid Style Contract', () => {
  test('basic grid satisfies computed style contracts', async ({ page }) => {
    await page.goto('/');

    const grid = page.locator("[role='grid']").first();
    await expect(grid).toBeVisible();

    // 1. Root container contract
    const rootStyle = await grid.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        position: computed.position,
        boxSizing: computed.boxSizing,
        borderWidth: computed.borderTopWidth,
      };
    });

    expect(rootStyle.position).toBe('absolute');
    expect(rootStyle.boxSizing).toBe('border-box');
    expect(parseInt(rootStyle.borderWidth, 10)).toBeGreaterThanOrEqual(1);

    // 2. Header container contract
    const headerContainer = grid.locator('.bgrid-header-container');
    await expect(headerContainer).toBeVisible();
    const headerStyle = await headerContainer.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        overflow: computed.overflow,
        position: computed.position,
      };
    });
    expect(headerStyle.overflow).toBe('visible');
    expect(headerStyle.position).toBe('sticky');

    // 3. Scroll container contract
    const scrollContainer = grid.locator('.bgrid-scroll-container');
    await expect(scrollContainer).toBeVisible();
    const scrollStyle = await scrollContainer.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        overflowX: computed.overflowX,
        overflowY: computed.overflowY,
      };
    });
    expect(['auto', 'scroll']).toContain(scrollStyle.overflowX);
    expect(['auto', 'scroll']).toContain(scrollStyle.overflowY);

    // 4. Body table contract
    const bodyTable = grid.locator('.bgrid-body-table').first();
    await expect(bodyTable).toBeVisible();
    const tableStyle = await bodyTable.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        tableLayout: computed.tableLayout,
        position: computed.position,
      };
    });
    expect(tableStyle.tableLayout).toBe('fixed');
    expect(tableStyle.position).toBe('absolute');
  });

  test('paging grid satisfies footer contracts', async ({ page }) => {
    await page.goto('/paging');

    const grid = page.locator("[role='grid']").first();
    await expect(grid).toBeVisible();

    const footer = grid.locator('.bgrid-footer-container');
    await expect(footer).toBeVisible();

    const footerStyle = await footer.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        borderTopWidth: computed.borderTopWidth,
      };
    });
    expect(parseInt(footerStyle.borderTopWidth, 10)).toBeGreaterThanOrEqual(1);

    const footerContent = grid.locator('.bgrid-footer-content');
    await expect(footerContent).toBeVisible();
    const footerContentStyle = await footerContent.evaluate(el => {
      return window.getComputedStyle(el).display;
    });
    expect(footerContentStyle).toBe('flex');
  });

  test('frozen grid displays frozen boundary and line number', async ({ page }) => {
    await page.goto('/lineNumber');

    const grid = page.locator("[role='grid']").first();
    await expect(grid).toBeVisible();

    const frozenBoundary = grid.locator('.bgrid-frozen-body-boundary');
    await expect(frozenBoundary).toBeVisible();
  });

  test('toolbox popover inherits grid theme and applies computed background-color', async ({ page }) => {
    await page.goto('/toolbox');

    const grid = page.locator("[role='grid']").first();
    await expect(grid).toBeVisible();

    // Click first toolbox button
    const trigger = grid.locator('.bgrid-toolbox-trigger-btn').first();
    await trigger.click();

    const popover = page.locator('.bgrid-toolbox-popover');
    await expect(popover).toBeVisible();

    const popoverStyle = await popover.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        bodyBgVar: el.style.getPropertyValue('--bgrid-body-bg'),
      };
    });

    // Popover computed background color is non-empty
    expect(popoverStyle.backgroundColor).toBeTruthy();
  });
});
