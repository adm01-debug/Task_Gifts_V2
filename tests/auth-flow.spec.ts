import { test, expect } from '@playwright/test';

test.describe('Autenticação e Proteção de Rotas 10/10', () => {
  test('redirecionamento de não autenticado para /auth', async ({ page }) => {
    // Garantir que não há sessão (limpar storage local também pois o Supabase usa localStorage)
    await page.goto('/auth');
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => sessionStorage.clear());
    
    await page.goto('/');
    // Deve redirecionar para /auth
    await page.waitForURL(/\/auth/);
    expect(page.url()).toContain('/auth');
  });

  test('página /auth exibe formulário de login', async ({ page }) => {
    await page.goto('/auth');
    const loginTitle = page.locator('h1, h2').filter({ hasText: 'Task Gifts' });
    await expect(loginTitle).toBeVisible();
    
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
  });
  
  test('acesso à página de recuperar senha', async ({ page }) => {
    await page.goto('/forgot-password');
    const title = page.locator('text=Esqueceu sua senha?');
    await expect(title).toBeVisible();
  });
});
