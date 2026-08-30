import { expect, test } from '@playwright/test';

test.describe('Summary Row E2E', () => {
  test('renders top summary row by default and switches to bottom', async ({ page }) => {
    await page.goto('/summary');

    // Wait for summary row in frozen section (has typo 'summay' in source code)
    const summaryRow = page.locator('[role="rfdg-summay-frozen"]');
    await expect(summaryRow).toBeVisible();

    // Check default top summary text
    const firstCell = summaryRow.locator('td', { hasText: 'Total Sales' });
    await expect(firstCell).toContainText('Top Total Sales · 30cases');

    // Switch to bottom summary using the Antd radio
    const bottomRadio = page.getByRole('radio', { name: 'Bottom Summary' });
    await bottomRadio.click();

    // The text should update to Bottom
    await expect(firstCell).toContainText('Bottom Total Sales · 30cases');
  });
});
