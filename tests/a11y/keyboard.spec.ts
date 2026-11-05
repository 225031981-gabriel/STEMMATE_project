import { test, expect } from '@playwright/test';

const URL = 'http://127.0.0.1:5500/client/index.html';

test('T14a: Keyboard navigation works through all form elements', async ({ page }) => {
  await page.goto(URL);
  
  // Sign in
  await page.locator('#pin').fill('123456');
  await page.locator('#create-pin').click();
  await expect(page.locator('#plan-view')).toBeVisible();

  // The app automatically focuses #title on login. 
  // Press Tab 6 times to go through steps, timing, materials, safety, inclusion
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
  }
  
  // After 6 tabs from title, we should be on the Save button
  await expect(page.locator('#save-btn')).toBeFocused();
});