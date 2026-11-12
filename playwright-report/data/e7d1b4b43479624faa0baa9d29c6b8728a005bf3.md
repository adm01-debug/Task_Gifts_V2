# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/happy-paths.spec.ts >> Happy Paths - Dashboard Elite >> 4. Shop Experience
- Location: tests/e2e/happy-paths.spec.ts:39:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h1')
Expected substring: "Loja"
Received string:    "Shop"
Timeout: 5000ms

Call log:
  - Expect "toContainText" locator('h1') with timeout 5000ms
  - waiting for locator('h1')
    14 × locator resolved to <h1 class="page-title">Shop</h1>
       - unexpected value "Shop"

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
    - listitem: Shop
- main:
  - article
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
  3  | test.describe('Happy Paths - Dashboard Elite', () => {
  4  |   
  5  |   test('1. Login Flow', async ({ page }) => {
  6  |     await page.goto('/');
  7  |     // Assuming we have a login button or redirect to /auth
  8  |     await expect(page).toHaveURL(/.*auth/);
  9  |     
  10 |     // Fill credentials (using placeholder selectors based on common patterns)
  11 |     // Note: In a real scenario, we'd use test accounts
  12 |     await page.fill('input[type="email"]', 'test@example.com');
  13 |     await page.fill('input[type="password"]', 'password123');
  14 |     await page.click('button[type="submit"]');
  15 |     
  16 |     // Should redirect to dashboard
  17 |     // await expect(page).toHaveURL(/.*dashboard/);
  18 |   });
  19 | 
  20 |   test('2. Quest System', async ({ page }) => {
  21 |     // Navigate to quests
  22 |     await page.goto('/quests');
  23 |     await expect(page.locator('h1')).toContainText('Missões');
  24 |     
  25 |     // Verify quest list is visible (Skeleton removed)
  26 |     const questCard = page.locator('.quest-card').first();
  27 |     await expect(questCard).toBeVisible();
  28 |   });
  29 | 
  30 |   test('3. Kudos/Rewards Flow', async ({ page }) => {
  31 |     await page.goto('/kudos');
  32 |     await expect(page.locator('h1')).toContainText('Kudos');
  33 |     
  34 |     // Check balance
  35 |     const balance = page.locator('.kudos-balance');
  36 |     await expect(balance).toBeVisible();
  37 |   });
  38 | 
  39 |   test('4. Shop Experience', async ({ page }) => {
  40 |     await page.goto('/shop');
> 41 |     await expect(page.locator('h1')).toContainText('Loja');
     |                                      ^ Error: expect(locator).toContainText(expected) failed
  42 |     
  43 |     // Verify items
  44 |     const shopItem = page.locator('.shop-item').first();
  45 |     await expect(shopItem).toBeVisible();
  46 |   });
  47 | 
  48 |   test('5. User Profile & Settings', async ({ page }) => {
  49 |     await page.goto('/profile');
  50 |     await expect(page.locator('h1')).toContainText('Perfil');
  51 |     
  52 |     // Check for rank badge (the one we improved with skeletons/fallbacks)
  53 |     const rankBadge = page.locator('.rank-badge');
  54 |     await expect(rankBadge).toBeVisible();
  55 |   });
  56 | });
  57 | 
```