import { expect, test } from '@playwright/test';

function intersects(left, right) {
  return (
    left.x < right.x + right.width &&
    left.x + left.width > right.x &&
    left.y < right.y + right.height &&
    left.y + left.height > right.y
  );
}

test.describe('Grid search and cell context menu', () => {
  test('searches virtual rows, navigates results and resolves floating-surface conflicts', async ({ page }) => {
    await page.goto('/search');

    const grid = page.locator("[role='grid']");
    await expect(grid).toBeVisible();
    await grid.focus();
    await page.keyboard.press('Control+f');

    const search = grid.getByRole('search');
    const input = search.getByRole('textbox', { name: '그리드 데이터 찾기' });
    await expect(input).toBeFocused();
    await expect(search).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(search).toHaveCSS('color', 'rgb(51, 65, 85)');
    await expect(input).toHaveCSS('background-color', 'rgb(248, 250, 252)');
    await input.fill('EMP-0200');
    await expect(search.getByRole('status')).toHaveText('1 / 1');

    const current = grid.locator('[data-bgrid-search-current="true"]');
    await expect(current).toHaveAttribute('data-row-index', '199');
    await expect
      .poll(() => grid.locator('.bgrid-scroll-container').evaluate(element => element.scrollTop))
      .toBeGreaterThan(0);

    const currentBox = await current.boundingBox();
    const searchBox = await search.boundingBox();
    expect(currentBox).not.toBeNull();
    expect(searchBox).not.toBeNull();
    expect(intersects(currentBox, searchBox)).toBe(false);

    await input.fill('Project H');
    await expect(search.getByRole('status')).toHaveText('1 / 25');
    await page.keyboard.press('Enter');
    await expect(search.getByRole('status')).toHaveText('2 / 25');
    await page.keyboard.press('Shift+Enter');
    await expect(search.getByRole('status')).toHaveText('1 / 25');

    await page.keyboard.press('Escape');
    await expect(search).toBeHidden();
    const toolboxTrigger = grid.locator('.bgrid-toolbox-trigger-btn').first();
    await toolboxTrigger.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await grid.focus();
    await page.keyboard.press('Control+f');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(search).toBeVisible();
  });

  test('supports pointer and keyboard context menus, Meta+F, focus restore and themed portals', async ({ page }) => {
    await page.goto('/search');
    const grid = page.locator("[role='grid']");
    await expect(grid).toBeVisible();

    await grid.evaluate(element => {
      element.style.setProperty('--bgrid-context-menu-bg', '#0f172a');
      element.style.setProperty('--bgrid-context-menu-color', '#f8fafc');
    });
    await page.getByText('Member 1', { exact: true }).click({ button: 'right' });
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await expect(menu).toHaveCSS('background-color', 'rgb(15, 23, 42)');
    await menu.getByRole('menuitem', { name: /검색/ }).click();
    const input = grid.getByRole('textbox', { name: '그리드 데이터 찾기' });
    await expect(input).toBeFocused();
    await page.keyboard.press('Escape');

    await grid.focus();
    await page.keyboard.press('Shift+F10');
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: /검색/ })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(menu.getByRole('menuitem', { name: "View this cell's information" })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect.poll(() => grid.evaluate(element => element.contains(document.activeElement))).toBe(true);

    await page.keyboard.press('Meta+f');
    await expect(input).toBeFocused();
  });

  test('keeps focused search-match text above the active-cell overlay', async ({ page }) => {
    await page.goto('/search');

    const grid = page.locator("[role='grid']");
    await grid.focus();
    await page.keyboard.press('Control+f');

    const input = grid.getByRole('textbox', { name: '그리드 데이터 찾기' });
    await input.fill('Service Operation');

    const current = grid.locator('[data-bgrid-search-current="true"]');
    await expect(current).toContainText('Service Operation');
    await current.click();
    await expect(current).toHaveClass(/bgrid-cell-active/);

    const content = current.locator('.bgrid-cell-content');
    await expect(content).toHaveCSS('z-index', '3');
    await expect(grid.locator('.bgrid-cell-selection-overlay-layer')).toHaveCSS('z-index', '2');
    await expect
      .poll(() =>
        current.evaluate(cell => {
          const contentElement = cell.querySelector('.bgrid-cell-content');
          const rect = contentElement?.getBoundingClientRect();
          if (!contentElement || !rect) return false;
          const topElement = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
          return topElement === contentElement || contentElement.contains(topElement);
        }),
      )
      .toBe(true);
  });

  test('keeps the search panel fixed at the top-right while the query changes', async ({ page }) => {
    await page.goto('/search');

    const grid = page.locator("[role='grid']");
    await grid.focus();
    await page.keyboard.press('Control+f');

    const search = grid.getByRole('search');
    const input = search.getByRole('textbox', { name: '그리드 데이터 찾기' });
    const initialBox = await search.boundingBox();
    expect(initialBox).not.toBeNull();

    await input.fill('Project');
    await expect(search.getByRole('status')).toHaveText('1 / 200');
    const matchingBox = await search.boundingBox();

    await input.fill('Projectyomae');
    await expect(search.getByRole('status')).toHaveText('0 / 0');
    const emptyBox = await search.boundingBox();

    expect(matchingBox).toEqual(initialBox);
    expect(emptyBox).toEqual(initialBox);
  });

  test('keeps the current next-search match inside the scroll viewport with frozen rows', async ({ page }) => {
    await page.goto('/search');

    const grid = page.locator("[role='grid']");
    await grid.focus();
    await page.keyboard.press('Control+f');

    const search = grid.getByRole('search');
    const input = search.getByRole('textbox', { name: '그리드 데이터 찾기' });
    await input.fill('Seoul');
    await expect(search.getByRole('status')).toHaveText('1 / 67');

    for (let index = 1; index < 14; index += 1) await input.press('Enter');
    await expect(search.getByRole('status')).toHaveText('14 / 67');

    const current = grid.locator('[data-bgrid-search-current="true"]');
    await expect(current).toHaveAttribute('data-row-index', '39');
    await expect
      .poll(async () => {
        const currentBox = await current.boundingBox();
        const scrollBox = await grid.locator('.bgrid-scroll-container').boundingBox();
        return !!currentBox && !!scrollBox && currentBox.y >= scrollBox.y && currentBox.y + currentBox.height <= scrollBox.y + scrollBox.height;
      })
      .toBe(true);
  });

  test('keeps the search surface inside a narrow Grid', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/search');
    const grid = page.locator("[role='grid']");
    await grid.focus();
    await page.keyboard.press('Control+f');
    const search = grid.getByRole('search');
    await expect(search).toBeVisible();

    const gridBox = await grid.boundingBox();
    const searchBox = await search.boundingBox();
    expect(gridBox).not.toBeNull();
    expect(searchBox).not.toBeNull();
    expect(searchBox.x).toBeGreaterThanOrEqual(gridBox.x);
    expect(searchBox.x + searchBox.width).toBeLessThanOrEqual(gridBox.x + gridBox.width + 1);
  });
});
