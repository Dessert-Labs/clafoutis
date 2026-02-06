import { expect, test } from '@playwright/test';

test.describe('CanvasEditorView', () => {
  test('renders default state with toolbar and panels', async ({ page }) => {
    await page.goto('/iframe.html?id=views-canvaseditorview--default');
    await expect(page.getByTitle('Select (V)')).toBeVisible();
    await expect(page.getByTitle('Rectangle (R)')).toBeVisible();
    await expect(page.getByText('Layers')).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('renders with selection showing properties panel', async ({ page }) => {
    await page.goto('/iframe.html?id=views-canvaseditorview--with-selection');
    await expect(page.getByText('Card')).toBeVisible();
  });

  test('renders empty canvas with no layers message', async ({ page }) => {
    await page.goto('/iframe.html?id=views-canvaseditorview--empty-canvas');
    await expect(page.getByText('No layers')).toBeVisible();
  });

  test('renders drawing mode with rectangle tool active', async ({ page }) => {
    await page.goto('/iframe.html?id=views-canvaseditorview--drawing-mode');
    const rectButton = page.getByTitle('Rectangle (R)');
    await expect(rectButton).toBeVisible();
  });
});
