import { expect, test } from '@playwright/test';

test.describe('PublishView', () => {
  test('renders default state with diff table', async ({ page }) => {
    await page.goto('/iframe.html?id=views-publishview--default');
    await expect(page.getByText('Publish Changes')).toBeVisible();
    await expect(page.getByText('colors.primary.500')).toBeVisible();
    await expect(page.getByText('modified')).toBeVisible();
    await expect(page.getByText('Create branch & PR')).toBeVisible();
  });

  test('renders no changes state', async ({ page }) => {
    await page.goto('/iframe.html?id=views-publishview--no-changes');
    await expect(page.getByText('No changes to publish.')).toBeVisible();
  });

  test('renders local project warning', async ({ page }) => {
    await page.goto('/iframe.html?id=views-publishview--local-project');
    await expect(page.getByText('This is a local project')).toBeVisible();
  });

  test('renders not authenticated state', async ({ page }) => {
    await page.goto('/iframe.html?id=views-publishview--not-authenticated');
    await expect(page.getByText('Sign in to publish')).toBeVisible();
  });

  test('renders pushing state', async ({ page }) => {
    await page.goto('/iframe.html?id=views-publishview--pushing');
    await expect(page.getByText('Creating PR...')).toBeVisible();
  });

  test('renders error state', async ({ page }) => {
    await page.goto('/iframe.html?id=views-publishview--with-error');
    await expect(page.getByText('Failed to create branch: 403 Forbidden')).toBeVisible();
  });

  test('renders success state', async ({ page }) => {
    await page.goto('/iframe.html?id=views-publishview--success');
    await expect(page.getByText('Pull request created!')).toBeVisible();
    await expect(page.getByText('View PR')).toBeVisible();
  });
});
