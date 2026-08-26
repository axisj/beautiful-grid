import { expect, test } from '@playwright/test';

const demoPages = [
  { path: '/', title: 'Basic' },
  { path: '/toolbox', title: 'Header Toolbox (Sort & Filter)' },
  { path: '/lineNumber', title: 'LineNumber' },
  { path: '/columnGroup', title: 'ColumnsGroup' },
  { path: '/sort', title: 'Sort' },
  { path: '/radioBox', title: 'Radio Checkbox' },
  { path: '/paging', title: 'Paging' },
  { path: '/loading', title: 'Loading' },
  { path: '/focus', title: 'Focus' },
  { path: '/editor', title: 'Editor' },
  { path: '/virtualScroll', title: 'VirtualScroll' },
  { path: '/getRowClassName', title: 'GetRowClassName' },
  { path: '/cellMerge', title: 'CellMerge' },
  { path: '/summary', title: 'Summary' },
  { path: '/columnSort', title: 'Column Sort' },
  { path: '/reorder', title: 'Reorder data' },
  { path: '/contextMenu', title: 'Cell Context Menu' },
];

test.describe('BGrid Demo', () => {
  for (const demo of demoPages) {
    test(`page ${demo.path} renders datagrid`, async ({ page }) => {
      await page.goto(demo.path);

      await expect(page.getByRole('heading', { level: 1, name: 'beautiful-grid' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 2, name: demo.title })).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`${demo.path === '/' ? '/$' : `${demo.path}$`}`));

      // BGrid root role is a stable contract in this project.
      await expect(page.locator("[role='grid']").first()).toBeVisible();
    });
  }

  test('can navigate with tabs', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: /^Sort$/i }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Sort' })).toBeVisible();
  });
});
