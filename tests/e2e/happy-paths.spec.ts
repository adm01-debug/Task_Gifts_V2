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

// Com credenciais reais, evita gravar a senha no trace do Playwright
// (artefato público do CI). Sem credenciais o trace continua para debug.
test.use({ trace: HAS_CREDENTIALS ? 'off' : 'on-first-retry' });

/**
 * Encerra a sessão no servidor (revoga refresh token) além de limpar o
 * storage local — evita deixar sessões órfãs de teste em produção
 * (docs/agentes/banco.md: isolamento).
 */
async function signOutFromServer(page) {
  const creds = await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.includes('-auth-token')) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key)!);
          return { accessToken: parsed.access_token ?? null, refreshToken: parsed.currentSession?.refresh_token ?? parsed.refresh_token ?? null };
        } catch {
          /* ignore */
        }
      }
    }
    return { accessToken: null, refreshToken: null };
  });
  const url = process.env.E2E_SUPABASE_URL ?? '';
  if (!creds.accessToken || !url || !process.env.E2E_SUPABASE_ANON_KEY) {
    throw new Error('signOutFromServer: falta access_token ou credenciais E2E_SUPABASE_URL/ANON_KEY');
  }
  const res = await fetch(`${url}/auth/v1/logout`, {
    method: 'POST',
    headers: {
      apikey: process.env.E2E_SUPABASE_ANON_KEY,
      authorization: `Bearer ${creds.accessToken}`,
    },
  });
  if (res.status !== 204 && res.status !== 200) {
    throw new Error(`signOutFromServer: logout respondeu HTTP ${res.status}`);
  }
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

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

    // Encerra a sessao no servidor (sem fila orfa em producao)
    await signOutFromServer(page);
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

    // Email aleatorio evita herdar contagem de tentativas acumulada de
    // outras execucoes (lockout muda a mensagem de erro)
    const randomEmail = `nao.existe.${Date.now()}@taskgifts.internal`;

    await page.goto('/auth');
    await page.fill('input[type="email"]', randomEmail);
    await page.fill('input[type="password"]', 'senha-errada-123');
    await page.click('button[type="submit"]');

    // O app mostra uma das 3 mensagens legitimas de credencial invalida
    await expect(page.locator('body')).toContainText(/incorretos|Credenciais incorretas|Conta bloqueada|bloqueada/i, { timeout: 15000 });
    await expect(page).toHaveURL(/\/auth/);
  });
});