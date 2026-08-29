import { expect, test } from '@playwright/test';

test.describe('Summary Row E2E', () => {
  test('renders top summary row by default and switches to bottom', async ({ page }) => {
    await page.goto('/summary');

    // Wait for summary row in frozen section (has typo 'summay' in source code)
    const summaryRow = page.locator('[role="rfdg-summay-frozen"]');
    await expect(summaryRow).toBeVisible();

    // Check default top summary text
    const firstCell = summaryRow.locator('td', { hasText: '매출 합계' });
    await expect(firstCell).toContainText('상단 매출 합계 · 30건');

    // Switch to bottom summary using the Antd radio
    const bottomRadio = page.getByRole('radio', { name: '하단 요약' });
    await bottomRadio.click();

    // The text should update to 하단
    await expect(firstCell).toContainText('하단 매출 합계 · 30건');
  });
});
