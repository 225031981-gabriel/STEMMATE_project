import { test, expect } from '@playwright/test';
const URL = 'http://127.0.0.1:5500/client/index.html?v=' + Date.now();

test('T02: Venue booking shows a clear error message on double-booking', async ({ page }) => {
  await page.goto(URL);
  await page.locator('#userPin').fill('123456');
  await page.locator('button:has-text("Create PIN")').click();
  await page.waitForTimeout(200);
  await page.locator('button:has-text("Sign In")').click();
  await expect(page.locator('#mainApp')).toBeVisible({ timeout: 5000 });

  await page.evaluate(() => switchTab('planner'));
  await page.waitForTimeout(500);

  await page.locator('#bookingVenueName').selectOption('Windhoek Community Science Hall A');
  await page.locator('#bookingDate').fill('2026-11-10');
  await page.locator('#bookingStartTime').fill('10:00');
  await page.locator('#bookingEndTime').fill('12:00');
  await page.locator('#bookingFacilitator').fill('Test User');
  await page.locator('button:has-text("Check Availability")').click();
  await page.waitForTimeout(500);

  await page.locator('#bookingVenueName').selectOption('Windhoek Community Science Hall A');
  await page.locator('#bookingDate').fill('2026-11-10');
  await page.locator('#bookingStartTime').fill('10:30');
  await page.locator('#bookingEndTime').fill('11:30');
  await page.locator('#bookingFacilitator').fill('Test User 2');
  await page.locator('button:has-text("Check Availability")').click();

  const errorBox = page.locator('.error-box');
  await expect(errorBox).toBeVisible({ timeout: 3000 });
  await expect(errorBox).toContainText('Already Booked');
});