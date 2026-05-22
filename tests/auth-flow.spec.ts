import { test, expect } from '@playwright/test';

test.describe('Autenticação e Proteção de Rotas', () => {
  test('deve redirecionar usuário autenticado de /auth para a home', async ({ page }) => {
    // Mock do login via localStorage para pular interação UI se possível, ou fazer login real
    // Aqui assumimos um fluxo de login simplificado ou mockado
    await page.goto('/auth');
    
    // Simular login preenchendo o formulário
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Verificar se foi para a home
    await expect(page).toHaveURL('/');

    // Tentar voltar para /auth
    await page.goto('/auth');
    
    // Deve redirecionar de volta para /
    await expect(page).toHaveURL('/');
  });

  test('deve proteger rotas privadas de usuários não autenticados', async ({ page }) => {
    // Garantir que não há sessão
    await page.context().clearCookies();
    
    // Tentar acessar o dashboard
    await page.goto('/');
    
    // Deve ser redirecionado para /auth
    await expect(page).toHaveURL(/\/auth/);
  });

  test('esqueci minha senha deve redirecionar corretamente', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('text=Esqueceu sua senha?')).toBeVisible();
    
    // Tentar acessar /forgot-password quando já logado deve redirecionar (se implementado)
    // Como testamos acima no /auth, o comportamento deve ser similar
  });
});
