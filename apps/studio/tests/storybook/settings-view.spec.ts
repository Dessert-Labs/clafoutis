import { expect, test } from '@playwright/test';

test.describe('SettingsView', () => {
  test('renders default state', async ({ page }) => {
    await page.goto('/iframe.html?id=views-settingsview--default');
    await expect(page.getByText('Settings')).toBeVisible();
    await expect(page.getByText('Appearance')).toBeVisible();
    await expect(page.getByText('GitHub Account')).toBeVisible();
    await expect(page.getByText('About')).toBeVisible();
    await expect(page.getByText('Sign in with GitHub')).toBeVisible();
  });

  test('renders dark mode toggle', async ({ page }) => {
    await page.goto('/iframe.html?id=views-settingsview--dark-mode');
    const toggle = page.getByRole('switch');
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  test('renders authenticated user', async ({ page }) => {
    await page.goto('/iframe.html?id=views-settingsview--authenticated');
    await expect(page.getByText('@beauwilliams')).toBeVisible();
    await expect(page.getByText('Sign out')).toBeVisible();
  });
});
