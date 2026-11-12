# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-flow.spec.ts >> Autenticação e Proteção de Rotas 10/10 >> acesso à página de recuperar senha
- Location: tests/auth-flow.spec.ts:28:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Esqueceu sua senha?')
Expected: visible
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('text=Esqueceu sua senha?') with timeout 5000ms
  - waiting for locator('text=Esqueceu sua senha?')
  - Target page, context or browser has been closed

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
  3  | test.describe('Autenticação e Proteção de Rotas 10/10', () => {
  4  |   test('redirecionamento de não autenticado para /auth', async ({ page }) => {
  5  |     // Garantir que não há sessão (limpar storage local também pois o Supabase usa localStorage)
  6  |     await page.goto('/auth');
  7  |     await page.evaluate(() => localStorage.clear());
  8  |     await page.evaluate(() => sessionStorage.clear());
  9  |     
  10 |     await page.goto('/');
  11 |     // Deve redirecionar para /auth
  12 |     await page.waitForURL(/\/auth/);
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
> 31 |     await expect(title).toBeVisible();
     |                         ^ Error: expect(locator).toBeVisible() failed
  32 |   });
  33 | });
  34 | 
```