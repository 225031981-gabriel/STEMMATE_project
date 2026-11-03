import { test, expect } from '@playwright/test';

const URL = 'http://127.0.0.1:5500/client/index.html';

test('T14a: Keyboard navigation works through all form elements', async ({ page }) => {
  await page.goto(URL);
  await page.locator('#username').fill('facilitator');
  await page.locator('#pin').fill('1234');
  await page.locator('#signin-form button[type="submit"]').click();

  await page.locator('#title').focus();
  
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
  }
  await expect(page.locator('#btn-save-draft')).toBeFocused();
  
  await page.keyboard.press('Tab');
  await expect(page.locator('#btn-complete')).toBeFocused();
});