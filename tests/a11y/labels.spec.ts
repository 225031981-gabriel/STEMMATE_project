import { test, expect } from '@playwright/test';

const URL = 'http://127.0.0.1:5500/client/index.html';

test('T17: Every form control has an accessible label', async ({ page }) => {
  await page.goto(URL);
  
  // Sign in
  await page.locator('#pin').fill('123456');
  await page.locator('#create-pin').click();
  await expect(page.locator('#plan-view')).toBeVisible();

  const unlabelled = await page.$$eval(
    'input, select, textarea',
    (els) => els
      .filter((el) => (el as HTMLElement).offsetParent !== null)
      .filter((el) => {
        const e = el as HTMLInputElement;
        return !(e.labels && e.labels.length > 0) && !e.getAttribute('aria-label');
      })
  );
  expect(unlabelled).toEqual([]);
});