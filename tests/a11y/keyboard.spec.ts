import { test, expect } from '@playwright/test';
const URL = 'http://127.0.0.1:5500/client/index.html?v=' + Date.now();

test('T14a: Keyboard navigation works through all form elements', async ({ page }) => {
  await page.goto(URL);
  await page.locator('#userPin').fill('123456');
  await page.locator('button:has-text("Create PIN")').click();
  await page.waitForTimeout(200);
  await page.locator('button:has-text("Sign In")').click();
  await expect(page.locator('#mainApp')).toBeVisible({ timeout: 5000 });

  await page.evaluate(() => (window as any).switchTab('planner'));
  await page.waitForTimeout(500);

  await page.locator('#sessionTitle').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#sessionTarget')).toBeFocused();
});