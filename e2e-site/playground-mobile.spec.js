import { expect, test } from '@playwright/test';

const viewport = { width: 390, height: 844 };

test.describe('playground responsive workspace', () => {
  test.use({ viewport });

  test('keeps every props workflow reachable on mobile', async ({ page }) => {
    await page.goto('/playground');

    const workspace = page.locator('.playground-workspace');
    const previewButton = page.getByRole('button', { name: '미리보기' });
    const settingsButton = page.getByRole('button', { name: '설정' });
    const preview = page.locator('.playground-preview-panel');
    const controls = page.locator('.playground-control-panel');

    await expect(workspace).toHaveAttribute('data-mobile-pane', 'preview');
    await expect(preview).toBeVisible();
    await expect(controls).toBeHidden();
    await expect(page.getByText('상품 재고 (Product inventory)')).toBeVisible();

    const mobileLayout = await page.evaluate(() => {
      const canvas = document.querySelector('.playground-preview-canvas');
      const workbarButtons = [...document.querySelectorAll('.playground-mobile-workbar button')];
      return {
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
        canvasScrollWidth: canvas?.scrollWidth ?? 0,
        canvasClientWidth: canvas?.clientWidth ?? 0,
        minimumButtonHeight: Math.min(...workbarButtons.map(button => button.getBoundingClientRect().height)),
      };
    });

    expect(mobileLayout.documentWidth).toBeLessThanOrEqual(mobileLayout.viewportWidth);
    expect(mobileLayout.canvasScrollWidth).toBeGreaterThan(mobileLayout.canvasClientWidth);
    expect(mobileLayout.minimumButtonHeight).toBeGreaterThanOrEqual(44);

    await settingsButton.click();
    await expect(workspace).toHaveAttribute('data-mobile-pane', 'controls');
    await expect(controls).toBeVisible();
    await expect(preview).toBeHidden();
    await expect(page.getByText('마지막 이벤트 (Last event)')).toBeVisible();
    await expect(page.getByRole('heading', { name: '데이터 그리드 설정' })).toBeVisible();

    // Astro's development toolbar overlaps the last few pixels of this scroll container.
    await page.getByText('셀 탐색 및 클립보드').click({ force: true });
    await expect(page.getByText('활성 셀 열 (activeCell.columnIndex)')).toBeVisible();

    await page.getByRole('button', { name: '코드' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').getByText('현재 Props 소스 코드')).toBeVisible();
    await expect(page.getByRole('dialog').getByRole('button', { name: '코드 복사' })).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click();

    await previewButton.click();
    await expect(preview).toBeVisible();
  });

  test('keeps theme editing and source available on mobile', async ({ page }) => {
    await page.goto('/playground');
    await page.getByRole('tab', { name: 'Theme Builder' }).click();

    await expect(page.getByText('주문 워크스페이스')).toBeVisible();
    await page.getByRole('button', { name: '설정' }).click();
    await expect(page.getByRole('heading', { name: '테마 빌더' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cloud' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Graphite' })).toBeVisible();

    await page.getByRole('button', { name: '코드' }).click();
    await expect(page.getByRole('dialog').getByText('현재 테마 CSS와 사용 코드')).toBeVisible();
    await expect(page.locator('.playground-source-code')).toBeVisible();

    console.log('mobile playground verification passed');
  });
});

test('preserves the desktop split workspace', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto('/playground');

  await expect(page.locator('.playground-mobile-workbar')).toBeHidden();
  await expect(page.locator('.playground-control-panel')).toBeVisible();
  await expect(page.locator('.playground-preview-panel')).toBeVisible();
  await expect(page.getByRole('separator', { name: '컨트롤 패널 너비 조절' })).toBeVisible();

  await page.getByRole('tab', { name: 'Theme Builder' }).click();
  await expect(page.locator('.playground-control-panel')).toBeVisible();
  await expect(page.locator('.playground-preview-panel')).toBeVisible();
});
