# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/smoke.spec.ts >> Smoke — bootstrap da aplicação >> rota protegida redireciona para /auth quando deslogado
- Location: tests/e2e/smoke.spec.ts:24:3

# Error details

```
TimeoutError: page.waitForURL: Timeout 8000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
  navigated to "http://localhost:8080/profile"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=f7e1]:
  - generic [ref=f7e2]:
    - banner [ref=f7e4]:
      - generic [ref=f7e6]:
        - link "Pular para o conteúdo" [ref=f7e7] [cursor=pointer]:
          - /url: "#main"
        - generic [ref=f7e8]:
          - generic [ref=f7e10]:
            - generic [ref=f7e11]: Atendimento consultivo para empresas em todo o Brasil
            - navigation "Links institucionais" [ref=f7e12]:
              - link "Como funciona" [ref=f7e13] [cursor=pointer]:
                - /url: http://localhost:8080/como-funciona-a-personalizacao/
              - link "Técnicas de gravação" [ref=f7e14] [cursor=pointer]:
                - /url: http://localhost:8080/tecnicas-de-gravacao/
              - link "Contato" [ref=f7e15] [cursor=pointer]:
                - /url: http://localhost:8080/contact-us/
          - generic [ref=f7e16]:
            - link "Promo Brindes — início" [ref=f7e17] [cursor=pointer]:
              - /url: http://localhost:8080/
              - img "Promo Brindes" [ref=f7e18]
            - search [ref=f7e19]:
              - generic [ref=f7e20]: Buscar no catálogo
              - searchbox "Buscar no catálogo" [ref=f7e21]
              - generic [aria-hidden] [ref=f7e22]: /
              - button "Buscar" [ref=f7e23] [cursor=pointer]
            - button "Produtos selecionados Minha lista Itens selecionados" [ref=f7e27] [cursor=pointer]:
              - generic [ref=f7e31]:
                - generic [ref=f7e32]: Produtos selecionados
                - text: Minha lista
              - generic "Itens selecionados" [ref=f7e33]: "0"
          - generic [ref=f7e35]:
            - link "Todos os produtos" [ref=f7e36] [cursor=pointer]:
              - /url: http://localhost:8080/catalogo/
            - navigation [ref=f7e37]:
              - list [ref=f7e38]:
                - listitem [ref=f7e39]:
                  - link "Papelaria e Escritório" [ref=f7e40] [cursor=pointer]:
                    - /url: http://localhost:8080/brindes/papelaria_e_escritorio/
                - listitem [ref=f7e41]:
                  - link "Bar e Cozinha" [ref=f7e42] [cursor=pointer]:
                    - /url: http://localhost:8080/brindes/bar_e_cozinha/
                - listitem [ref=f7e43]:
                  - link "Esportes e Lazer" [ref=f7e44] [cursor=pointer]:
                    - /url: http://localhost:8080/brindes/esportes-aventura-lazer-viagem/
                - listitem [ref=f7e45]:
                  - link "Tecnologia" [ref=f7e46] [cursor=pointer]:
                    - /url: http://localhost:8080/brindes/tecnologia-eletronicos/
                - listitem [ref=f7e47]:
                  - link "Sacola e Ecobag" [ref=f7e48] [cursor=pointer]:
                    - /url: http://localhost:8080/brindes/sacola-ecobag/
                - listitem [ref=f7e49]:
                  - link "Chaveiros" [ref=f7e50] [cursor=pointer]:
                    - /url: http://localhost:8080/brindes/chaveiros/
                - listitem [ref=f7e51]:
                  - link "Bolsa Térmica" [ref=f7e52] [cursor=pointer]:
                    - /url: http://localhost:8080/brindes/bolsa_termica/
    - navigation "breadcrumb" [ref=f7e57]:
      - list [ref=f7e58]:
        - listitem [ref=f7e59]:
          - link "Home " [ref=f7e60] [cursor=pointer]:
            - /url: http://localhost:8080
          - generic [ref=f7e61]: 
        - listitem [ref=f7e62]: "404"
    - generic [ref=f7e70]:
      - generic [ref=f7e72]:
        - heading "404 " [level=2] [ref=f7e73]:
          - text: "404"
          - generic [ref=f7e74]: 
        - paragraph [ref=f7e75]: We're sorry, but the page you were looking for doesn't exist.
      - generic [ref=f7e77]:
        - heading "Here are some useful links" [level=4] [ref=f7e78]
        - list [ref=f7e79]:
          - listitem [ref=f7e80]:
            - link " Home" [ref=f7e81] [cursor=pointer]:
              - /url: "#"
          - listitem [ref=f7e82]:
            - link " About Us" [ref=f7e83] [cursor=pointer]:
              - /url: "#"
          - listitem [ref=f7e84]:
            - link " FAQ's" [ref=f7e85] [cursor=pointer]:
              - /url: "#"
          - listitem [ref=f7e86]:
            - link " Sitemap" [ref=f7e87] [cursor=pointer]:
              - /url: "#"
          - listitem [ref=f7e88]:
            - link " Contact Us" [ref=f7e89] [cursor=pointer]:
              - /url: "#"
    - contentinfo [ref=f7e91]:
      - generic [ref=f7e94]:
        - generic [ref=f7e95]:
          - generic [ref=f7e96]:
            - img "Promo Brindes" [ref=f7e97]
            - paragraph [ref=f7e98]: Brindes corporativos personalizados para transformar marcas em boas lembranças.
          - generic [ref=f7e99]:
            - heading "Encontre seu brinde" [level=2] [ref=f7e100]
            - link "Catálogo completo" [ref=f7e101] [cursor=pointer]:
              - /url: http://localhost:8080/catalogo/
            - link "Como funciona" [ref=f7e102] [cursor=pointer]:
              - /url: http://localhost:8080/como-funciona-a-personalizacao/
            - link "Técnicas de gravação" [ref=f7e103] [cursor=pointer]:
              - /url: http://localhost:8080/tecnicas-de-gravacao/
          - generic [ref=f7e104]:
            - heading "Atendimento" [level=2] [ref=f7e105]
            - paragraph [ref=f7e106]: Conte o que você precisa. Nossa equipe ajuda a escolher produtos, quantidades e personalização.
            - link "Falar com um especialista" [ref=f7e107] [cursor=pointer]:
              - /url: http://localhost:8080/contact-us/
        - generic [ref=f7e108]:
          - generic [ref=f7e109]: © 2026 Promo Brindes.
          - generic [ref=f7e110]: Site catálogo — vendas mediante orçamento.
  - generic [ref=f7e111]:
    - generic [ref=f7e113]:
      - textbox "Search…" [ref=f7e115]
      - button "Search" [ref=f7e117] [cursor=pointer]:
        - generic [ref=f7e118]: 
    - list [ref=f7e120]:
      - listitem [ref=f7e121]:
        - link "Papelaria e Escritório" [ref=f7e122] [cursor=pointer]:
          - /url: http://localhost:8080/brindes/papelaria_e_escritorio/
      - listitem [ref=f7e123]:
        - link "Bar e Cozinha" [ref=f7e124] [cursor=pointer]:
          - /url: http://localhost:8080/brindes/bar_e_cozinha/
      - listitem [ref=f7e125]:
        - link "Esportes e Lazer" [ref=f7e126] [cursor=pointer]:
          - /url: http://localhost:8080/brindes/esportes-aventura-lazer-viagem/
      - listitem [ref=f7e127]:
        - link "Tecnologia" [ref=f7e128] [cursor=pointer]:
          - /url: http://localhost:8080/brindes/tecnologia-eletronicos/
      - listitem [ref=f7e129]:
        - link "Sacola e Ecobag" [ref=f7e130] [cursor=pointer]:
          - /url: http://localhost:8080/brindes/sacola-ecobag/
      - listitem [ref=f7e131]:
        - link "Chaveiros" [ref=f7e132] [cursor=pointer]:
          - /url: http://localhost:8080/brindes/chaveiros/
      - listitem [ref=f7e133]:
        - link "Bolsa Térmica" [ref=f7e134] [cursor=pointer]:
          - /url: http://localhost:8080/brindes/bolsa_termica/
    - generic [ref=f7e135]:
      - link "Facebook" [ref=f7e136] [cursor=pointer]:
        - /url: "#"
        - text: 
      - link "X" [ref=f7e137] [cursor=pointer]:
        - /url: "#"
        - text: 
      - link "Instagram" [ref=f7e138] [cursor=pointer]:
        - /url: "#"
        - text: 
  - status
  - generic [ref=f7e139] [cursor=pointer]: 
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
> 31 |     await page.waitForURL(/\/auth/, { timeout: 8000 });
     |                ^ TimeoutError: page.waitForURL: Timeout 8000ms exceeded.
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
  85 |     await expect(emailInput).toBeVisible();
  86 |     // Deve ter algum label associado ou aria-label
  87 |     const hasLabel = await emailInput.evaluate((el: HTMLInputElement) => {
  88 |       return !!(el.labels?.length || el.getAttribute('aria-label') || el.placeholder);
  89 |     });
  90 |     expect(hasLabel).toBe(true);
  91 |   });
  92 | });
```