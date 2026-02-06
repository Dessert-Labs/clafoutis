import { expect, test } from '@playwright/test';

test.describe('DashboardView', () => {
  test('renders default state with all cards', async ({ page }) => {
    await page.goto('/iframe.html?id=views-dashboardview--default');
    await expect(page.getByText('Clafoutis Studio')).toBeVisible();
    await expect(page.getByText('Create a new design system')).toBeVisible();
    await expect(page.getByText('Open a public GitHub repo')).toBeVisible();
    await expect(page.getByText('Sign in with GitHub')).toBeVisible();
  });

  test('renders authenticated state', async ({ page }) => {
    await page.goto('/iframe.html?id=views-dashboardview--authenticated');
    await expect(page.getByText('Your GitHub repos')).toBeVisible();
    await expect(page.getByText('Browse my repos')).toBeVisible();
  });

  test('renders repos list', async ({ page }) => {
    await page.goto('/iframe.html?id=views-dashboardview--with-repos');
    await expect(page.getByText('acme/design-tokens')).toBeVisible();
    await expect(page.getByText('acme/brand-system')).toBeVisible();
  });

  test('renders loading state for repos', async ({ page }) => {
    await page.goto('/iframe.html?id=views-dashboardview--repos-loading');
    await expect(page.getByText('Your GitHub repos')).toBeVisible();
  });

  test('renders public repo error', async ({ page }) => {
    await page.goto('/iframe.html?id=views-dashboardview--with-public-repo-error');
    await expect(page.getByText('Enter a valid repo like')).toBeVisible();
  });
});
