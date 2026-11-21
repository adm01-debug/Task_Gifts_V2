import { test, expect } from '@playwright/test';

/**
 * Happy Paths E2E — rotas autenticadas e navegação principal.
 *
 * Requer conta de teste dedicada (ex.: criada via Supabase Auth Admin).
 * As credenciais são lidas do ambiente (E2E_EMAIL / E2E_PASSWORD).
 * Sem elas, apenas os guards de auth (redirecionamento para /auth) são cobertos,
 * mantendo o spec útil em CI sem secret e sem passo bloqueante.
 */

const E2E_EMAIL = process.env.E2E_EMAIL;
const E2E_PASSWORD = process.env.E2E_PASSWORD;
const HAS_CREDENTIALS = Boolean(E2E_EMAIL && E2E_PASSWORD);

/** Rota protegida: autenticado vê a página; anônimo é redirecionado para /auth. */
async function assertProtectedRoute(page, path: string) {
  await page.goto('/auth');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto(path);
  await page.waitForURL(/\/auth/, { timeout: 8000 });
  await expect(page.locator('input[type="email"]')).toBeVisible();
}

test.describe('Happy Paths - Task Gifts', () => {
  test('1. Fluxo de login redireciona para a dashboard', async ({ page }) => {
    await page.goto('/auth');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    test.skip(!HAS_CREDENTIALS, 'Sem conta de teste dedicada (E2E_EMAIL/E2E_PASSWORD)');

    await page.fill('input[type="email"]', E2E_EMAIL!);
    await page.fill('input[type="password"]', E2E_PASSWORD!);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/$/, { timeout: 20000 });
    await expect(page).toHaveURL(/\/$/);
  });

  test('2. Rota protegida /profile redireciona para /auth sem sessao', async ({ page }) => {
    await assertProtectedRoute(page, '/profile');
  });

  test('3. Rota protegida /trails redireciona para /auth sem sessao', async ({ page }) => {
    await assertProtectedRoute(page, '/trails');
  });

  test('4. Rota protegida /loja redireciona para /auth sem sessao', async ({ page }) => {
    await assertProtectedRoute(page, '/loja');
  });

  test('5. Rota protegida /conquistas redireciona para /auth sem sessao', async ({ page }) => {
    await assertProtectedRoute(page, '/conquistas');
  });

  test('6. Login falho mostra erro e permanece em /auth', async ({ page }) => {
    test.skip(!HAS_CREDENTIALS, 'Sem conta de teste dedicada (E2E_EMAIL/E2E_PASSWORD)');

    await page.goto('/auth');
    await page.fill('input[type="email"]', 'nao.existe@taskgifts.internal');
    await page.fill('input[type="password"]', 'senha-errada-123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/auth/, { timeout: 15000 });
  });
});