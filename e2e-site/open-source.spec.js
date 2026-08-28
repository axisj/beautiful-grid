import { expect, test } from '@playwright/test';

test.describe('open-source adopter experience', () => {
  test('presents verifiable product evidence without centering contribution', async ({ page }) => {
    await page.goto('/open-source');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('무료로 시작하고');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('자유롭게 사용하세요');
    await expect(page.locator('.open-contract')).toHaveCount(0);
    await expect(page.locator('.hero-promise')).toContainText('도입 전에는 검증 가능하게');
    await expect(page.locator('.hero-promise')).toContainText('도입 후에도 선택권이 남게');
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('main main')).toHaveCount(0);
    await expect(page.locator('.evidence-item')).toHaveCount(4);
    await expect(page.locator('.legal-documents a')).toHaveCount(3);
    await expect(page.locator('.hero-actions')).not.toContainText('기여');
    await expect(page.locator('.final-actions')).not.toContainText('기여');
    await expect(page.locator('.project-resources')).toContainText('기여 안내');
    await expect(page.locator('.project-resources')).toContainText('보안 취약점은 공개 이슈가 아닌');

    for (const link of await page.locator('.evidence-item').all()) {
      await expect(link).toHaveAttribute('href', /.+/);
    }
  });

  test('keeps mobile gutters and avoids horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/open-source');

    const layout = await page.evaluate(() => {
      const heading = document.querySelector('.principles-section h2');
      const headingRect = heading?.getBoundingClientRect();
      return {
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
        headingLeft: headingRect?.left ?? 0,
        headingRight: headingRect?.right ?? Number.POSITIVE_INFINITY,
      };
    });

    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.headingLeft).toBeGreaterThanOrEqual(16);
    expect(layout.headingRight).toBeLessThanOrEqual(layout.viewportWidth - 16);

    await page.getByRole('button', { name: '메뉴 열기' }).click();
    const mobileDrawer = page.getByRole('dialog');
    await expect(mobileDrawer).toBeVisible();
    await mobileDrawer.getByRole('button', { name: '테마 선택' }).click({ force: true });
    await mobileDrawer.getByRole('menuitemradio', { name: '다크' }).click({ force: true });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('heading', { level: 2, name: '보이는 신뢰.' })).toBeVisible();
  });

  test('keeps the English page aligned with the same positioning', async ({ page }) => {
    await page.goto('/en/open-source');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Start free.');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Build with freedom.');
    await expect(page.locator('.hero-promise')).toContainText('Verify before adoption.');
    await expect(page.getByRole('heading', { level: 2, name: 'Visible trust.' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Freedom, defined.' })).toBeVisible();
    await expect(page.locator('.project-resources')).toContainText('Contributing guide');
  });
});
