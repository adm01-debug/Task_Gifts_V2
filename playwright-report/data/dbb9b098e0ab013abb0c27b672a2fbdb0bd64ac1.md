# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/smoke.spec.ts >> Smoke — acessibilidade básica >> /auth tem landmark e labels
- Location: tests/e2e/smoke.spec.ts:82:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('input[type="email"]')
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" locator('input[type="email"]') with timeout 5000ms
  - waiting for locator('input[type="email"]')
    13 × locator resolved to <input value="" size="40" type="email" maxlength="400" name="your-email" aria-required="true" aria-invalid="false" placeholder="E-mail corporativo" class="wpcf7-form-control wpcf7-email wpcf7-validates-as-required wpcf7-text wpcf7-validates-as-email"/>
       - unexpected value "hidden"

```

```yaml
- banner:
  - link "Pular para o conteúdo":
    - /url: "#main"
  - text: Atendimento consultivo para empresas em todo o Brasil
  - navigation "Links institucionais":
    - link "Como funciona":
      - /url: http://localhost:8080/como-funciona-a-personalizacao/
    - link "Técnicas de gravação":
      - /url: http://localhost:8080/tecnicas-de-gravacao/
    - link "Contato":
      - /url: http://localhost:8080/contact-us/
  - link "Promo Brindes — início":
    - /url: http://localhost:8080/
    - img "Promo Brindes"
  - search:
    - text: Buscar no catálogo
    - searchbox "Buscar no catálogo"
    - button "Buscar"
  - button "Produtos selecionados Minha lista Itens selecionados": Produtos selecionados Minha lista 0
  - link "Todos os produtos":
    - /url: http://localhost:8080/catalogo/
  - navigation:
    - list:
      - listitem:
        - link "Papelaria e Escritório":
          - /url: http://localhost:8080/brindes/papelaria_e_escritorio/
      - listitem:
        - link "Bar e Cozinha":
          - /url: http://localhost:8080/brindes/bar_e_cozinha/
      - listitem:
        - link "Esportes e Lazer":
          - /url: http://localhost:8080/brindes/esportes-aventura-lazer-viagem/
      - listitem:
        - link "Tecnologia":
          - /url: http://localhost:8080/brindes/tecnologia-eletronicos/
      - listitem:
        - link "Sacola e Ecobag":
          - /url: http://localhost:8080/brindes/sacola-ecobag/
      - listitem:
        - link "Chaveiros":
          - /url: http://localhost:8080/brindes/chaveiros/
      - listitem:
        - link "Bolsa Térmica":
          - /url: http://localhost:8080/brindes/bolsa_termica/
- navigation "breadcrumb":
  - list:
    - listitem:
      - link "Home ":
        - /url: http://localhost:8080
      - text: 
    - listitem: "404"
- heading "404 " [level=2]
- paragraph: We're sorry, but the page you were looking for doesn't exist.
- heading "Here are some useful links" [level=4]
- list:
  - listitem:
    - link " Home":
      - /url: "#"
  - listitem:
    - link " About Us":
      - /url: "#"
  - listitem:
    - link " FAQ's":
      - /url: "#"
  - listitem:
    - link " Sitemap":
      - /url: "#"
  - listitem:
    - link " Contact Us":
      - /url: "#"
- contentinfo:
  - img "Promo Brindes"
  - paragraph: Brindes corporativos personalizados para transformar marcas em boas lembranças.
  - heading "Encontre seu brinde" [level=2]
  - link "Catálogo completo":
    - /url: http://localhost:8080/catalogo/
  - link "Como funciona":
    - /url: http://localhost:8080/como-funciona-a-personalizacao/
  - link "Técnicas de gravação":
    - /url: http://localhost:8080/tecnicas-de-gravacao/
  - heading "Atendimento" [level=2]
  - paragraph: Conte o que você precisa. Nossa equipe ajuda a escolher produtos, quantidades e personalização.
  - link "Falar com um especialista":
    - /url: http://localhost:8080/contact-us/
  - text: © 2026 Promo Brindes. Site catálogo — vendas mediante orçamento.
- textbox "Search…"
- button "Search": 
- list:
  - listitem:
    - link "Papelaria e Escritório":
      - /url: http://localhost:8080/brindes/papelaria_e_escritorio/
  - listitem:
    - link "Bar e Cozinha":
      - /url: http://localhost:8080/brindes/bar_e_cozinha/
  - listitem:
    - link "Esportes e Lazer":
      - /url: http://localhost:8080/brindes/esportes-aventura-lazer-viagem/
  - listitem:
    - link "Tecnologia":
      - /url: http://localhost:8080/brindes/tecnologia-eletronicos/
  - listitem:
    - link "Sacola e Ecobag":
      - /url: http://localhost:8080/brindes/sacola-ecobag/
  - listitem:
    - link "Chaveiros":
      - /url: http://localhost:8080/brindes/chaveiros/
  - listitem:
    - link "Bolsa Térmica":
      - /url: http://localhost:8080/brindes/bolsa_termica/
- link "Facebook":
  - /url: "#"
  - text: 
- link "X":
  - /url: "#"
  - text: 
- link "Instagram":
  - /url: "#"
  - text: 
- status
- text: 
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * Smoke E2E Suite — Rotas Públicas & Guardas
  5  |  * Não depende de credenciais reais. Valida bootstrap, guardas e SEO essencial.
  6  |  */
  7  | test.describe('Smoke — bootstrap da aplicação', () => {
  8  |   test('carrega /auth sem erros de console críticos', async ({ page }) => {
  9  |     const errors: string[] = [];
  10 |     page.on('pageerror', (e) => errors.push(String(e)));
  11 |     page.on('console', (msg) => {
  12 |       if (msg.type() === 'error') errors.push(msg.text());
  13 |     });
  14 | 
  15 |     await page.goto('/auth', { waitUntil: 'domcontentloaded' });
  16 |     await expect(page.locator('input[type="email"]')).toBeVisible();
  17 | 
  18 |     const critical = errors.filter(
  19 |       (e) => !/favicon|Sentry|manifest|sw\.js|analytics|service worker/i.test(e),
  20 |     );
  21 |     expect(critical, `Erros críticos: ${critical.join('\n')}`).toHaveLength(0);
  22 |   });
  23 | 
  24 |   test('rota protegida redireciona para /auth quando deslogado', async ({ page }) => {
  25 |     await page.goto('/auth');
  26 |     await page.evaluate(() => {
  27 |       localStorage.clear();
  28 |       sessionStorage.clear();
  29 |     });
  30 |     await page.goto('/profile');
  31 |     await page.waitForURL(/\/auth/, { timeout: 8000 });
  32 |     expect(page.url()).toContain('/auth');
  33 |   });
  34 | 
  35 |   test('404 renderiza NotFound', async ({ page }) => {
  36 |     const resp = await page.goto('/rota-que-nao-existe-xyz');
  37 |     // SPA: status 200 mas UI de NotFound
  38 |     expect(resp?.status()).toBeLessThan(500);
  39 |     await expect(page.locator('body')).toContainText(/404|não encontrada|not found/i);
  40 |   });
  41 | 
  42 |   test('meta tags essenciais presentes em /auth', async ({ page }) => {
  43 |     await page.goto('/auth');
  44 |     const title = await page.title();
  45 |     expect(title.length).toBeGreaterThan(3);
  46 |     const desc = await page.locator('meta[name="description"]').getAttribute('content');
  47 |     expect(desc && desc.length).toBeGreaterThan(10);
  48 |   });
  49 | 
  50 |   test('/forgot-password acessível', async ({ page }) => {
  51 |     await page.goto('/forgot-password');
  52 |     await expect(page.locator('text=/esqueceu.*senha/i')).toBeVisible();
  53 |   });
  54 | 
  55 |   test('responsividade mobile no /auth', async ({ page }) => {
  56 |     await page.setViewportSize({ width: 390, height: 844 });
  57 |     await page.goto('/auth');
  58 |     const email = page.locator('input[type="email"]');
  59 |     await expect(email).toBeVisible();
  60 |     const box = await email.boundingBox();
  61 |     expect(box?.width).toBeGreaterThan(200);
  62 |   });
  63 | 
  64 |   test('service worker/PWA manifest disponível', async ({ page, request }) => {
  65 |     await page.goto('/');
  66 |     // Aceita ambos os nomes usados pelo vite-plugin-pwa ao longo do tempo.
  67 |     const manifest =
  68 |       (await request.get('/manifest.webmanifest').catch(() => null)) ??
  69 |       (await request.get('/manifest.json').catch(() => null));
  70 |     // manifest é opcional, mas se existir deve ser JSON válido.
  71 |     // No dev server o Vite devolve o fallback SPA (200 + HTML), então o
  72 |     // content-type é checado antes do parse — o manifest real só existe no build.
  73 |     const contentType = manifest?.headers()['content-type'] ?? '';
  74 |     if (manifest && manifest.ok() && contentType.includes('json')) {
  75 |       const json = await manifest.json();
  76 |       expect(json).toHaveProperty('name');
  77 |     }
  78 |   });
  79 | });
  80 | 
  81 | test.describe('Smoke — acessibilidade básica', () => {
  82 |   test('/auth tem landmark e labels', async ({ page }) => {
  83 |     await page.goto('/auth');
  84 |     const emailInput = page.locator('input[type="email"]');
> 85 |     await expect(emailInput).toBeVisible();
     |                              ^ Error: expect(locator).toBeVisible() failed
  86 |     // Deve ter algum label associado ou aria-label
  87 |     const hasLabel = await emailInput.evaluate((el: HTMLInputElement) => {
  88 |       return !!(el.labels?.length || el.getAttribute('aria-label') || el.placeholder);
  89 |     });
  90 |     expect(hasLabel).toBe(true);
  91 |   });
  92 | });
```