import { test, expect } from '@playwright/test';

const URL = 'http://127.0.0.1:5500/client/index.html';

test('T02: Error summary appears and receives focus on empty submit', async ({ page }) => {
  await page.goto(URL);
  await page.locator('#username').fill('facilitator');
  await page.locator('#pin').fill('1234');
  await page.locator('#signin-form button[type="submit"]').click();
  
  await page.locator('#btn-complete').click();

  const summary = page.locator('#error-summary');
  await expect(summary).toBeVisible();
  await expect(summary).toBeFocused();
  await expect(page.locator('#title-error')).toBeVisible();
});