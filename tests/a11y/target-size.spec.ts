import { test, expect } from '@playwright/test';
const URL = 'http://127.0.0.1:5500/client/index.html?v=' + Date.now();

test('T18: Interactive targets are at least 44x44 pixels', async ({ page }) => {
  await page.goto(URL);
  await page.locator('#userPin').fill('123456');
  await page.locator('button:has-text("Create PIN")').click();
  await page.waitForTimeout(200);
  await page.locator('button:has-text("Sign In")').click();
  await expect(page.locator('#mainApp')).toBeVisible({ timeout: 5000 });
  
  await page.waitForTimeout(500);

  const tooSmall = await page.$$eval(
    'button, a[href], input, select, textarea',
    (els) => els
      .filter((el) => (el as HTMLElement).offsetParent !== null)
      .map((el) => {
        const r = (el as HTMLElement).getBoundingClientRect();
        return { tag: el.tagName, w: Math.round(r.width), h: Math.round(r.height) };
      })
      .filter((x) => x.w < 44 || x.h < 44)
  );
  expect(tooSmall).toEqual([]);
});