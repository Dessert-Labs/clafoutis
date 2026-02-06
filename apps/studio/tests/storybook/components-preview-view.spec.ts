import { expect, test } from '@playwright/test';

test.describe('ComponentsPreviewView', () => {
  test('renders default state with component previews', async ({ page }) => {
    await page.goto('/iframe.html?id=views-componentspreviewview--default');
    await expect(page.getByText('Component Preview')).toBeVisible();
    await expect(page.getByText('Color Palette')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dark Mode' })).toBeVisible();
  });

  test('renders dark mode state', async ({ page }) => {
    await page.goto('/iframe.html?id=views-componentspreviewview--dark-mode');
    await expect(page.getByRole('button', { name: 'Light Mode' })).toBeVisible();
  });

  test('renders with no tokens', async ({ page }) => {
    await page.goto('/iframe.html?id=views-componentspreviewview--no-tokens');
    await expect(page.getByText('Component Preview')).toBeVisible();
  });
});
