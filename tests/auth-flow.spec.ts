import { test, expect } from '@playwright/test';

test.describe('Autenticação e Proteção de Rotas', () => {
  // Nota: Estes testes requerem que a aplicação esteja rodando e os mocks ou dados de teste existam.
  
  test('deve redirecionar usuário não autenticado para /auth ao acessar /', async ({ page }) => {
    // Limpar cookies para garantir que não está logado
    await page.context().clearCookies();
    await page.goto('/');
    await page.waitForURL(/\/auth/);
    expect(page.url()).toContain('/auth');
  });

  test('deve mostrar erro ao tentar login com credenciais inválidas', async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'invalido@exemplo.com');
    await page.fill('input[type="password"]', 'SenhaIncorreta123');
    await page.click('button[type="submit"]');
    
    // Verificar se algum alerta ou toast de erro aparece
    // O sistema usa sonner, então procuramos por elementos de toast
    await expect(page.locator('ol[data-sonner-toaster]')).toBeVisible();
  });
  
  test('deve permitir navegação para esqueci minha senha', async ({ page }) => {
    await page.goto('/auth');
    await page.click('button:has-text("Esqueceu sua senha?")');
    await page.waitForURL(/\/forgot-password/);
    expect(page.url()).toContain('/forgot-password');
  });
});
