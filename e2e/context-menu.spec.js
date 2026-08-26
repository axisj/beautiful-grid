import { expect, test } from '@playwright/test';

test.describe('Cell context menu example', () => {
  test('demonstrates pointer, dynamic items and source index context', async ({ page }) => {
    await page.goto('/contextMenu');

    const grid = page.locator("[role='grid']");
    await expect(grid).toBeVisible();

    const firstTarget = grid.locator('td[data-row-index="0"][data-column-index="2"]');
    await firstTarget.click({ button: 'right' });
    const menu = page.getByRole('menu', { name: 'DataGrid 셀 메뉴' });
    await expect(menu).toBeVisible();
    await expect(firstTarget).toHaveAttribute('data-bgrid-cell-active', 'true');
    await expect(grid.locator('[data-bgrid-selection-fragment="true"]')).toHaveCount(1);
    await expect(menu.getByRole('menuitem', { name: '그리드에서 검색' })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: '셀 정보 보기' })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: '행 전체 정보 보기' })).toBeVisible();
    await expect(menu.getByRole('separator')).toHaveCount(2);

    const otherCell = grid.locator('td[data-row-index="1"][data-column-index="1"]');
    await otherCell.click();
    await expect(menu).toBeHidden();
    await expect(otherCell).toHaveAttribute('data-bgrid-cell-active', 'true');

    await firstTarget.click({ button: 'right' });
    await expect(menu).toBeVisible();

    await menu.getByRole('menuitem', { name: '셀 정보 보기' }).click();
    const status = page.getByRole('status').first();
    await expect(status).toContainText('REQ-0022');
    await expect(status).toContainText('표시 0, 원본 21');

    await grid.locator('td[data-row-index="1"][data-column-index="1"]').click({ button: 'right' });
    await expect(menu.getByRole('menuitem', { name: '완료된 요청은 담당자 지정 불가' })).toBeDisabled();
  });

  test('opens from the keyboard and hands off to the built-in search item', async ({ page }) => {
    await page.goto('/contextMenu');

    const grid = page.locator("[role='grid']");
    const keyboardGateway = grid.getByRole('textbox', { name: 'DataGrid 키보드 탐색' });
    await grid.focus();
    await expect(keyboardGateway).toBeFocused();
    await keyboardGateway.press('Shift+F10');

    const searchItem = page.getByRole('menuitem', { name: '그리드에서 검색' });
    await expect(searchItem).toBeFocused();
    await searchItem.click();

    await expect(grid.getByRole('textbox', { name: '그리드 데이터 찾기' })).toBeFocused();
  });
});
