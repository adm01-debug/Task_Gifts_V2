# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-flow.spec.ts >> Autenticação e Proteção de Rotas 10/10 >> redirecionamento de não autenticado para /auth
- Location: tests/auth-flow.spec.ts:4:3

# Error details

```
Error: page.waitForURL: Target page, context or browser has been closed
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Autenticação e Proteção de Rotas 10/10', () => {
  4  |   test('redirecionamento de não autenticado para /auth', async ({ page }) => {
  5  |     // Garantir que não há sessão (limpar storage local também pois o Supabase usa localStorage)
  6  |     await page.goto('/auth');
  7  |     await page.evaluate(() => localStorage.clear());
  8  |     await page.evaluate(() => sessionStorage.clear());
  9  |     
  10 |     await page.goto('/');
  11 |     // Deve redirecionar para /auth
> 12 |     await page.waitForURL(/\/auth/);
     |                ^ Error: page.waitForURL: Target page, context or browser has been closed
  13 |     expect(page.url()).toContain('/auth');
  14 |   });
  15 | 
  16 |   test('página /auth exibe formulário de login', async ({ page }) => {
  17 |     await page.goto('/auth');
  18 |     const loginTitle = page.locator('h1, h2').filter({ hasText: 'Task Gifts' });
  19 |     await expect(loginTitle).toBeVisible();
  20 |     
  21 |     const emailInput = page.locator('input[type="email"]');
  22 |     await expect(emailInput).toBeVisible();
  23 |     
  24 |     const passwordInput = page.locator('input[type="password"]');
  25 |     await expect(passwordInput).toBeVisible();
  26 |   });
  27 |   
  28 |   test('acesso à página de recuperar senha', async ({ page }) => {
  29 |     await page.goto('/forgot-password');
  30 |     const title = page.locator('text=Esqueceu sua senha?');
  31 |     await expect(title).toBeVisible();
  32 |   });
  33 | });
  34 | 
```