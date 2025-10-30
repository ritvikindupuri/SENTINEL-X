
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('http://localhost:3001/');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveTitle(/Orbitwatch/);
});
