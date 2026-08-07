import { test, expect } from '@playwright/test';

test.describe('Happy Paths - Dashboard Elite', () => {
  
  test('1. Login Flow', async ({ page }) => {
    await page.goto('/');
    // Assuming we have a login button or redirect to /auth
    await expect(page).toHaveURL(/.*auth/);
    
    // Fill credentials (using placeholder selectors based on common patterns)
    // Note: In a real scenario, we'd use test accounts
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    // await expect(page).toHaveURL(/.*dashboard/);
  });

  test('2. Quest System', async ({ page }) => {
    // Navigate to quests
    await page.goto('/quests');
    await expect(page.locator('h1')).toContainText('Missões');
    
    // Verify quest list is visible (Skeleton removed)
    const questCard = page.locator('.quest-card').first();
    await expect(questCard).toBeVisible();
  });

  test('3. Kudos/Rewards Flow', async ({ page }) => {
    await page.goto('/kudos');
    await expect(page.locator('h1')).toContainText('Kudos');
    
    // Check balance
    const balance = page.locator('.kudos-balance');
    await expect(balance).toBeVisible();
  });

  test('4. Shop Experience', async ({ page }) => {
    await page.goto('/shop');
    await expect(page.locator('h1')).toContainText('Loja');
    
    // Verify items
    const shopItem = page.locator('.shop-item').first();
    await expect(shopItem).toBeVisible();
  });

  test('5. User Profile & Settings', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('h1')).toContainText('Perfil');
    
    // Check for rank badge (the one we improved with skeletons/fallbacks)
    const rankBadge = page.locator('.rank-badge');
    await expect(rankBadge).toBeVisible();
  });
});
