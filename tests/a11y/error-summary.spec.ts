import { test, expect } from '@playwright/test';

const URL = 'http://127.0.0.1:5500/client/index.html';

test('T02: Error summary appears and receives focus on empty submit', async ({ page }) => {
  await page.goto(URL);
  
  // Sign in
  await page.locator('#pin').fill('123456');
  await page.locator('#create-pin').click();
  await expect(page.locator('#plan-view')).toBeVisible();
  
  // Click Save without filling anything
  await page.locator('#save-btn').click();

  const summary = page.locator('#summary');
  await expect(summary).toBeVisible();
  await expect(summary).toBeFocused();
  await expect(page.locator('#title-err')).toBeVisible();
});