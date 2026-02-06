import { expect, test } from '@playwright/test';

test.describe('TokenCategoryDetailView', () => {
  test('renders default state with tokens table', async ({ page }) => {
    await page.goto('/iframe.html?id=views-tokencategorydetailview--default');
    await expect(page.getByText('colors')).toBeVisible();
    await expect(page.getByText('6 tokens')).toBeVisible();
    await expect(page.getByText('colors.primary.500')).toBeVisible();
    await expect(page.getByText('colors.error.500')).toBeVisible();
  });

  test('renders filtered results', async ({ page }) => {
    await page.goto('/iframe.html?id=views-tokencategorydetailview--with-search');
    await expect(page.getByText('colors.primary.500')).toBeVisible();
    await expect(page.getByText('colors.error.500')).not.toBeVisible();
  });

  test('renders empty state', async ({ page }) => {
    await page.goto('/iframe.html?id=views-tokencategorydetailview--empty');
    await expect(page.getByText('0 tokens')).toBeVisible();
  });
});
