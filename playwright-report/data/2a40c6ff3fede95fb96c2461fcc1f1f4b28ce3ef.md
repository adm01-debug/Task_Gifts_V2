# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/happy-paths.spec.ts >> Happy Paths - Dashboard Elite >> 2. Quest System
- Location: tests/e2e/happy-paths.spec.ts:20:3

# Error details

```
Error: page.goto: Target page, context or browser has been closed
Call log:
  - navigating to "http://localhost:8080/quests", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Happy Paths - Dashboard Elite', () => {
  4  |   
  5  |   test('1. Login Flow', async ({ page }) => {
  6  |     await page.goto('/');
  7  |     // Assuming we have a login button or redirect to /auth
  8  |     await expect(page).toHaveURL(/.*auth/);
  9  |     
  10 |     // Fill credentials (using placeholder selectors based on common patterns)
  11 |     // Note: In a real scenario, we'd use test accounts
  12 |     await page.fill('input[type="email"]', 'test@example.com');
  13 |     await page.fill('input[type="password"]', 'password123');
  14 |     await page.click('button[type="submit"]');
  15 |     
  16 |     // Should redirect to dashboard
  17 |     // await expect(page).toHaveURL(/.*dashboard/);
  18 |   });
  19 | 
  20 |   test('2. Quest System', async ({ page }) => {
  21 |     // Navigate to quests
> 22 |     await page.goto('/quests');
     |                ^ Error: page.goto: Target page, context or browser has been closed
  23 |     await expect(page.locator('h1')).toContainText('Missões');
  24 |     
  25 |     // Verify quest list is visible (Skeleton removed)
  26 |     const questCard = page.locator('.quest-card').first();
  27 |     await expect(questCard).toBeVisible();
  28 |   });
  29 | 
  30 |   test('3. Kudos/Rewards Flow', async ({ page }) => {
  31 |     await page.goto('/kudos');
  32 |     await expect(page.locator('h1')).toContainText('Kudos');
  33 |     
  34 |     // Check balance
  35 |     const balance = page.locator('.kudos-balance');
  36 |     await expect(balance).toBeVisible();
  37 |   });
  38 | 
  39 |   test('4. Shop Experience', async ({ page }) => {
  40 |     await page.goto('/shop');
  41 |     await expect(page.locator('h1')).toContainText('Loja');
  42 |     
  43 |     // Verify items
  44 |     const shopItem = page.locator('.shop-item').first();
  45 |     await expect(shopItem).toBeVisible();
  46 |   });
  47 | 
  48 |   test('5. User Profile & Settings', async ({ page }) => {
  49 |     await page.goto('/profile');
  50 |     await expect(page.locator('h1')).toContainText('Perfil');
  51 |     
  52 |     // Check for rank badge (the one we improved with skeletons/fallbacks)
  53 |     const rankBadge = page.locator('.rank-badge');
  54 |     await expect(rankBadge).toBeVisible();
  55 |   });
  56 | });
  57 | 
```