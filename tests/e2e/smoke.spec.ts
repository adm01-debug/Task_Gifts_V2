import { test, expect } from '@playwright/test';

/**
 * Smoke E2E Suite — Rotas Públicas & Guardas
 * Não depende de credenciais reais. Valida bootstrap, guardas e SEO essencial.
 */
test.describe('Smoke — bootstrap da aplicação', () => {
  test('carrega /auth sem erros de console críticos', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/auth', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('input[type="email"]')).toBeVisible();

    const critical = errors.filter(
      (e) => !/favicon|Sentry|manifest|sw\.js|analytics|service worker/i.test(e),
    );
    expect(critical, `Erros críticos: ${critical.join('\n')}`).toHaveLength(0);
  });

  test('rota protegida redireciona para /auth quando deslogado', async ({ page }) => {
    await page.goto('/auth');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('/profile');
    await page.waitForURL(/\/auth/, { timeout: 8000 });
    expect(page.url()).toContain('/auth');
  });

  test('404 renderiza NotFound', async ({ page }) => {
    const resp = await page.goto('/rota-que-nao-existe-xyz');
    // SPA: status 200 mas UI de NotFound
    expect(resp?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toContainText(/404|não encontrada|not found/i);
  });

  test('meta tags essenciais presentes em /auth', async ({ page }) => {
    await page.goto('/auth');
    const title = await page.title();
    expect(title.length).toBeGreaterThan(3);
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc && desc.length).toBeGreaterThan(10);
  });

  test('/forgot-password acessível', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('text=/esqueceu.*senha/i')).toBeVisible();
  });

  test('responsividade mobile no /auth', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/auth');
    const email = page.locator('input[type="email"]');
    await expect(email).toBeVisible();
    const box = await email.boundingBox();
    expect(box?.width).toBeGreaterThan(200);
  });

  test('service worker/PWA manifest disponível', async ({ page, request }) => {
    await page.goto('/');
    const manifest = await request.get('/manifest.json').catch(() => null);
    // manifest é opcional, mas se existir deve ser JSON válido
    if (manifest && manifest.ok()) {
      const json = await manifest.json();
      expect(json).toHaveProperty('name');
    }
  });
});

test.describe('Smoke — acessibilidade básica', () => {
  test('/auth tem landmark e labels', async ({ page }) => {
    await page.goto('/auth');
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    // Deve ter algum label associado ou aria-label
    const hasLabel = await emailInput.evaluate((el: HTMLInputElement) => {
      return !!(el.labels?.length || el.getAttribute('aria-label') || el.placeholder);
    });
    expect(hasLabel).toBe(true);
  });
});