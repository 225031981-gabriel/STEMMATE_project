import { test, expect } from '@playwright/test';

const URL = 'http://127.0.0.1:5500/client/index.html';

test('T18: Interactive targets are at least 44x44 pixels', async ({ page }) => {
  await page.goto(URL);
  
  // Sign in
  await page.locator('#pin').fill('123456');
  await page.locator('#create-pin').click();
  await expect(page.locator('#plan-view')).toBeVisible();

  const tooSmall = await page.$$eval(
    'button, a[href], input[type=checkbox], input[type=radio], [role=button]',
    (els) => els
      .filter((el) => (el as HTMLElement).offsetParent !== null)
      .map((el) => {
        const r = (el as HTMLElement).getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      })
      .filter((x) => x.w < 44 || x.h < 44)
  );
  expect(tooSmall).toEqual([]);
});