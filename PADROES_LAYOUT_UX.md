# 📐 PADRÕES DE LAYOUT/UX - TASK GIFTS

> Documento de referência completo para replicar o design system em novos projetos.
> Última atualização: Dezembro 2024

---

## 📑 ÍNDICE

1. [Tipografia](#1-tipografia)
2. [Paleta de Cores](#2-paleta-de-cores)
3. [Gradientes](#3-gradientes)
4. [Sombras](#4-sombras)
5. [Border Radius](#5-border-radius)
6. [Spacing Tokens](#6-spacing-tokens)
7. [Animações e Keyframes](#7-animações-e-keyframes)
8. [Timing Functions](#8-timing-functions)
9. [Card Styles](#9-card-styles)
10. [Hover Effects](#10-hover-effects)
11. [Focus States](#11-focus-states)
12. [Rank Badges](#12-rank-badges)
13. [Sidebar Tokens](#13-sidebar-tokens)
14. [Glass Morphism](#14-glass-morphism)
15. [Scrollbar Styling](#15-scrollbar-styling)
16. [Acessibilidade](#16-acessibilidade)
17. [Framer Motion Patterns](#17-framer-motion-patterns)
18. [SEO e Meta Tags](#18-seo-e-meta-tags)
19. [Componentes UI Padrão](#19-componentes-ui-padrão)
20. [Padrões de Arquitetura](#20-padrões-de-arquitetura)

---

## 1. TIPOGRAFIA

### Fontes Utilizadas

```css
/* Google Fonts Import */
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
```

### CSS Variables

```css
:root {
  --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-display: 'Outfit', system-ui, sans-serif;
}
```

### Tailwind Config

```typescript
// tailwind.config.ts
fontFamily: {
  sans: ["var(--font-sans)", "system-ui", "sans-serif"],
  display: ["var(--font-display)", "system-ui", "sans-serif"],
}
```

### Hierarquia Tipográfica

```css
/* Headings - Usam font-display (Outfit) */
h1 {
  @apply font-display text-3xl md:text-4xl font-bold tracking-tight;
}

h2 {
  @apply font-display text-2xl md:text-3xl font-semibold tracking-tight;
}

h3 {
  @apply font-display text-xl md:text-2xl font-semibold;
}

/* Display utilities */
.display-font {
  font-family: var(--font-display);
}

.text-display {
  @apply font-display text-3xl md:text-4xl font-bold tracking-tight;
}

.text-display-xl {
  @apply font-display text-4xl md:text-5xl font-bold tracking-tighter;
}

.text-display-2xl {
  @apply font-display text-5xl md:text-6xl font-extrabold tracking-tighter;
}
```

---

## 2. PALETA DE CORES

### ⚠️ REGRA CRÍTICA
> **NUNCA** use cores diretas como `text-white`, `bg-black`, `text-gray-500`.
> **SEMPRE** use tokens semânticos do design system.

### Light Mode (:root)

```css
:root {
  /* ===== BASE ===== */
  --background: 40 20% 95%;           /* Fundo principal - bege suave */
  --foreground: 225 25% 12%;          /* Texto principal */
  
  /* ===== CARDS ===== */
  --card: 40 25% 97%;                 /* Fundo de cards */
  --card-foreground: 225 25% 12%;     /* Texto em cards */
  --card-elevated: 0 0% 100%;         /* Cards elevados */
  
  /* ===== POPOVER/DIALOG ===== */
  --popover: 0 0% 100%;
  --popover-foreground: 225 25% 12%;
  
  /* ===== CORES PRIMÁRIAS ===== */
  --primary: 252 87% 64%;             /* Roxo vibrante */
  --primary-foreground: 0 0% 100%;    /* Texto sobre primary */
  --primary-glow: 252 90% 75%;        /* Versão mais clara para glow */
  
  /* ===== CORES SECUNDÁRIAS ===== */
  --secondary: 40 30% 92%;            /* Superfícies secundárias */
  --secondary-foreground: 225 25% 20%;
  
  /* ===== MUTED ===== */
  --muted: 40 20% 90%;
  --muted-foreground: 225 22% 38%;    /* Contraste aumentado */
  
  /* ===== ACCENT ===== */
  --accent: 40 30% 88%;
  --accent-foreground: 225 25% 15%;
  
  /* ===== DESTRUCTIVE ===== */
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  
  /* ===== BORDAS E INPUTS ===== */
  --border: 40 20% 82%;
  --input: 40 20% 88%;
  --ring: 252 87% 64%;
  
  /* ===== ESTADOS ===== */
  --success: 142 71% 45%;
  --success-foreground: 0 0% 100%;
  --warning: 38 92% 50%;
  --warning-foreground: 0 0% 100%;
  
  /* ===== GAMIFICAÇÃO ===== */
  --xp: 280 85% 60%;                  /* Roxo XP */
  --xp-foreground: 0 0% 100%;
  --coins: 45 93% 47%;                /* Dourado moedas */
  --coins-foreground: 0 0% 10%;
  --streak: 25 95% 53%;               /* Laranja streak */
  --streak-foreground: 0 0% 100%;
  
  /* ===== RANKS ===== */
  --rank-gold: 45 93% 47%;
  --rank-gold-foreground: 45 100% 15%;
  --rank-silver: 220 13% 70%;
  --rank-silver-foreground: 220 20% 20%;
  --rank-bronze: 30 50% 50%;
  --rank-bronze-foreground: 30 60% 15%;
  
  /* ===== ELEVAÇÃO ===== */
  --elevated: 0 0% 100%;
  --elevated-hover: 40 25% 98%;
  
  /* ===== GLASS ===== */
  --glass-bg: 0 0% 100% / 0.7;
  --glass-border: 0 0% 100% / 0.3;
  
  /* ===== CHART ===== */
  --chart-1: 252 87% 64%;
  --chart-2: 142 71% 45%;
  --chart-3: 45 93% 47%;
  --chart-4: 280 85% 60%;
  --chart-5: 25 95% 53%;
}
```

### Dark Mode (.dark)

```css
.dark {
  /* ===== BASE ===== */
  --background: 225 35% 8%;           /* Azul escuro profundo */
  --foreground: 210 40% 96%;          /* Texto claro */
  
  /* ===== CARDS ===== */
  --card: 225 30% 12%;
  --card-foreground: 210 40% 96%;
  --card-elevated: 225 28% 15%;
  
  /* ===== POPOVER/DIALOG ===== */
  --popover: 225 30% 12%;
  --popover-foreground: 210 40% 96%;
  
  /* ===== CORES PRIMÁRIAS ===== */
  --primary: 252 87% 64%;
  --primary-foreground: 0 0% 100%;
  --primary-glow: 252 100% 75%;
  
  /* ===== CORES SECUNDÁRIAS ===== */
  --secondary: 225 25% 18%;
  --secondary-foreground: 210 40% 90%;
  
  /* ===== MUTED ===== */
  --muted: 225 20% 20%;
  --muted-foreground: 215 20% 60%;
  
  /* ===== ACCENT ===== */
  --accent: 225 25% 20%;
  --accent-foreground: 210 40% 96%;
  
  /* ===== DESTRUCTIVE ===== */
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 100%;
  
  /* ===== BORDAS E INPUTS ===== */
  --border: 225 20% 22%;
  --input: 225 25% 18%;
  --ring: 252 87% 64%;
  
  /* ===== ESTADOS ===== */
  --success: 142 71% 45%;
  --success-foreground: 0 0% 100%;
  --warning: 38 92% 50%;
  --warning-foreground: 0 0% 100%;
  
  /* ===== GAMIFICAÇÃO ===== */
  --xp: 280 85% 65%;
  --xp-foreground: 0 0% 100%;
  --coins: 45 93% 55%;
  --coins-foreground: 0 0% 10%;
  --streak: 25 95% 58%;
  --streak-foreground: 0 0% 100%;
  
  /* ===== RANKS ===== */
  --rank-gold: 45 93% 55%;
  --rank-gold-foreground: 45 100% 95%;
  --rank-silver: 220 15% 75%;
  --rank-silver-foreground: 220 20% 95%;
  --rank-bronze: 30 55% 55%;
  --rank-bronze-foreground: 30 60% 95%;
  
  /* ===== ELEVAÇÃO ===== */
  --elevated: 225 28% 15%;
  --elevated-hover: 225 28% 18%;
  
  /* ===== GLASS ===== */
  --glass-bg: 225 30% 15% / 0.8;
  --glass-border: 225 30% 30% / 0.3;
  
  /* ===== CHART ===== */
  --chart-1: 252 87% 70%;
  --chart-2: 142 71% 55%;
  --chart-3: 45 93% 60%;
  --chart-4: 280 85% 70%;
  --chart-5: 25 95% 63%;
}
```

### Tailwind Config - Colors

```typescript
// tailwind.config.ts
colors: {
  border: "hsl(var(--border))",
  input: "hsl(var(--input))",
  ring: "hsl(var(--ring))",
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  primary: {
    DEFAULT: "hsl(var(--primary))",
    foreground: "hsl(var(--primary-foreground))",
    glow: "hsl(var(--primary-glow))",
  },
  secondary: {
    DEFAULT: "hsl(var(--secondary))",
    foreground: "hsl(var(--secondary-foreground))",
  },
  destructive: {
    DEFAULT: "hsl(var(--destructive))",
    foreground: "hsl(var(--destructive-foreground))",
  },
  muted: {
    DEFAULT: "hsl(var(--muted))",
    foreground: "hsl(var(--muted-foreground))",
  },
  accent: {
    DEFAULT: "hsl(var(--accent))",
    foreground: "hsl(var(--accent-foreground))",
  },
  popover: {
    DEFAULT: "hsl(var(--popover))",
    foreground: "hsl(var(--popover-foreground))",
  },
  card: {
    DEFAULT: "hsl(var(--card))",
    foreground: "hsl(var(--card-foreground))",
    elevated: "hsl(var(--card-elevated))",
  },
  success: {
    DEFAULT: "hsl(var(--success))",
    foreground: "hsl(var(--success-foreground))",
  },
  warning: {
    DEFAULT: "hsl(var(--warning))",
    foreground: "hsl(var(--warning-foreground))",
  },
  xp: {
    DEFAULT: "hsl(var(--xp))",
    foreground: "hsl(var(--xp-foreground))",
  },
  coins: {
    DEFAULT: "hsl(var(--coins))",
    foreground: "hsl(var(--coins-foreground))",
  },
  streak: {
    DEFAULT: "hsl(var(--streak))",
    foreground: "hsl(var(--streak-foreground))",
  },
  "rank-gold": {
    DEFAULT: "hsl(var(--rank-gold))",
    foreground: "hsl(var(--rank-gold-foreground))",
  },
  "rank-silver": {
    DEFAULT: "hsl(var(--rank-silver))",
    foreground: "hsl(var(--rank-silver-foreground))",
  },
  "rank-bronze": {
    DEFAULT: "hsl(var(--rank-bronze))",
    foreground: "hsl(var(--rank-bronze-foreground))",
  },
}
```

---

## 3. GRADIENTES

### CSS Variables

```css
:root {
  /* Light Mode Gradients */
  --gradient-primary: linear-gradient(135deg, hsl(252 87% 64%), hsl(280 85% 60%));
  --gradient-secondary: linear-gradient(135deg, hsl(40 30% 92%), hsl(40 25% 97%));
  --gradient-success: linear-gradient(135deg, hsl(142 71% 45%), hsl(142 71% 55%));
  --gradient-xp: linear-gradient(90deg, hsl(280 85% 60%), hsl(252 87% 64%));
  --gradient-gold: linear-gradient(135deg, hsl(45 93% 47%), hsl(38 92% 50%));
  --gradient-surface: linear-gradient(180deg, hsl(40 25% 97%), hsl(40 20% 95%));
  --gradient-divider: linear-gradient(90deg, transparent, hsl(40 20% 82% / 0.5), transparent);
}

.dark {
  /* Dark Mode Gradients */
  --gradient-primary: linear-gradient(135deg, hsl(252 87% 64%), hsl(280 85% 65%));
  --gradient-secondary: linear-gradient(135deg, hsl(225 25% 18%), hsl(225 30% 12%));
  --gradient-success: linear-gradient(135deg, hsl(142 71% 45%), hsl(142 71% 55%));
  --gradient-xp: linear-gradient(90deg, hsl(280 85% 65%), hsl(252 87% 70%));
  --gradient-gold: linear-gradient(135deg, hsl(45 93% 55%), hsl(38 92% 50%));
  --gradient-surface: linear-gradient(180deg, hsl(225 30% 12%), hsl(225 35% 8%));
  --gradient-divider: linear-gradient(90deg, transparent, hsl(225 20% 22% / 0.5), transparent);
}
```

### Utility Classes

```css
/* Gradient Text */
.gradient-text {
  @apply bg-clip-text text-transparent;
  background-image: var(--gradient-primary);
}

.gradient-text-secondary {
  @apply bg-clip-text text-transparent;
  background-image: var(--gradient-secondary);
}

.gradient-text-success {
  @apply bg-clip-text text-transparent;
  background-image: var(--gradient-success);
}

.gradient-text-gold {
  @apply bg-clip-text text-transparent;
  background-image: var(--gradient-gold);
}
```

---

## 4. SOMBRAS

### CSS Variables

```css
:root {
  /* Light Mode Shadows */
  --shadow-xs: 0 1px 2px hsl(225 25% 12% / 0.03);
  --shadow-sm: 0 1px 3px hsl(225 25% 12% / 0.04), 0 1px 2px hsl(225 25% 12% / 0.03);
  --shadow-md: 0 4px 6px -1px hsl(225 25% 12% / 0.05), 0 2px 4px -2px hsl(225 25% 12% / 0.04);
  --shadow-lg: 0 10px 15px -3px hsl(225 25% 12% / 0.06), 0 4px 6px -4px hsl(225 25% 12% / 0.04);
  --shadow-xl: 0 20px 25px -5px hsl(225 25% 12% / 0.08), 0 8px 10px -6px hsl(225 25% 12% / 0.05);
  
  /* Glow Shadows */
  --shadow-glow-primary: 0 0 20px hsl(252 87% 64% / 0.25);
  --shadow-glow-secondary: 0 0 20px hsl(40 30% 92% / 0.3);
  --shadow-glow-success: 0 0 20px hsl(142 71% 45% / 0.25);
  
  /* Header Shadow */
  --shadow-header: 0 1px 3px hsl(225 25% 12% / 0.05), 0 1px 2px hsl(225 25% 12% / 0.03);
}

.dark {
  /* Dark Mode - Sombras mais pronunciadas + inset highlights */
  --shadow-xs: 0 1px 2px hsl(225 50% 5% / 0.4);
  --shadow-sm: 0 1px 3px hsl(225 50% 5% / 0.5), 0 1px 2px hsl(225 50% 5% / 0.4);
  --shadow-md: 0 4px 6px -1px hsl(225 50% 5% / 0.5), 0 2px 4px -2px hsl(225 50% 5% / 0.4);
  --shadow-lg: 0 10px 15px -3px hsl(225 50% 5% / 0.5), 0 4px 6px -4px hsl(225 50% 5% / 0.4);
  --shadow-xl: 0 20px 25px -5px hsl(225 50% 5% / 0.6), 0 8px 10px -6px hsl(225 50% 5% / 0.5);
  
  /* Glow mais intenso no dark */
  --shadow-glow-primary: 0 0 30px hsl(252 87% 64% / 0.35);
  --shadow-glow-secondary: 0 0 25px hsl(225 25% 18% / 0.4);
  --shadow-glow-success: 0 0 25px hsl(142 71% 45% / 0.3);
  
  /* Header com inset */
  --shadow-header: 0 1px 3px hsl(225 50% 5% / 0.5), inset 0 1px 0 hsl(225 20% 25% / 0.3);
}
```

### Tailwind Config

```typescript
boxShadow: {
  xs: "var(--shadow-xs)",
  sm: "var(--shadow-sm)",
  md: "var(--shadow-md)",
  lg: "var(--shadow-lg)",
  xl: "var(--shadow-xl)",
  "glow-primary": "var(--shadow-glow-primary)",
  "glow-secondary": "var(--shadow-glow-secondary)",
  "glow-success": "var(--shadow-glow-success)",
  header: "var(--shadow-header)",
  elevated: "0 4px 20px -2px hsl(var(--foreground) / 0.08)",
}
```

### Utility Classes

```css
.shadow-elevated {
  box-shadow: 0 4px 20px -2px hsl(var(--foreground) / 0.08);
}

.glow-primary {
  box-shadow: var(--shadow-glow-primary);
}

.glow-secondary {
  box-shadow: var(--shadow-glow-secondary);
}

.glow-success {
  box-shadow: var(--shadow-glow-success);
}
```

---

## 5. BORDER RADIUS

### CSS Variables

```css
:root {
  --radius: 0.75rem; /* 12px base */
}
```

### Tailwind Config

```typescript
borderRadius: {
  lg: "var(--radius)",           // 12px
  md: "calc(var(--radius) - 2px)", // 10px
  sm: "calc(var(--radius) - 4px)", // 8px
  xl: "calc(var(--radius) + 4px)", // 16px
  "2xl": "calc(var(--radius) + 8px)", // 20px
  "3xl": "calc(var(--radius) + 12px)", // 24px
}
```

---

## 6. SPACING TOKENS

### CSS Variables

```css
:root {
  /* Spacing padrão */
  --spacing-card: 1.5rem;      /* 24px - padding interno de cards */
  --spacing-card-sm: 1rem;     /* 16px - cards compactos */
  --spacing-card-lg: 2rem;     /* 32px - cards grandes */
  --spacing-section: 2rem;     /* 32px - gap entre seções */
  --spacing-section-lg: 3rem;  /* 48px - seções maiores */
}
```

### Tailwind Config

```typescript
spacing: {
  "card": "var(--spacing-card)",
  "card-sm": "var(--spacing-card-sm)",
  "card-lg": "var(--spacing-card-lg)",
  "section": "var(--spacing-section)",
  "section-lg": "var(--spacing-section-lg)",
}
```

---

## 7. ANIMAÇÕES E KEYFRAMES

### Keyframes CSS

```css
@keyframes accordion-down {
  from { height: 0; opacity: 0; }
  to { height: var(--radix-accordion-content-height); opacity: 1; }
}

@keyframes accordion-up {
  from { height: var(--radix-accordion-content-height); opacity: 1; }
  to { height: 0; opacity: 0; }
}

@keyframes pulse-ring {
  0% { transform: scale(0.8); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 0; }
  100% { transform: scale(0.8); opacity: 0.5; }
}

@keyframes bounce-in {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes slide-up {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slide-down {
  from { transform: translateY(-10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slide-left {
  from { transform: translateX(10px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slide-right {
  from { transform: translateX(-10px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes scale-in {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 5px hsl(var(--primary) / 0.3); }
  50% { box-shadow: 0 0 20px hsl(var(--primary) / 0.6); }
}

@keyframes border-glow {
  0%, 100% { border-color: hsl(var(--primary) / 0.3); }
  50% { border-color: hsl(var(--primary) / 0.8); }
}

@keyframes wiggle {
  0%, 100% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
}

@keyframes pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes count-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Animações de Gamificação

```css
/* XP Bar Shimmer */
@keyframes xp-shimmer {
  0% { background-position: -100% 0; }
  100% { background-position: 200% 0; }
}

.animate-xp-shimmer {
  background: linear-gradient(
    90deg,
    hsl(var(--xp)) 0%,
    hsl(var(--xp) / 0.7) 50%,
    hsl(var(--xp)) 100%
  );
  background-size: 200% 100%;
  animation: xp-shimmer 2s ease-in-out infinite;
}

/* Streak Fire Pulse */
@keyframes streak-fire {
  0%, 100% { 
    transform: scale(1); 
    filter: brightness(1); 
  }
  50% { 
    transform: scale(1.1); 
    filter: brightness(1.3); 
  }
}

.animate-streak-fire {
  animation: streak-fire 0.8s ease-in-out infinite;
}

/* Coin Shine */
@keyframes coin-shine {
  0% { transform: rotateY(0deg); }
  50% { transform: rotateY(180deg); }
  100% { transform: rotateY(360deg); }
}

.animate-coin-shine {
  animation: coin-shine 2s ease-in-out infinite;
}

/* Level Up Flash */
@keyframes level-up {
  0% { 
    transform: scale(1); 
    box-shadow: 0 0 0 0 hsl(var(--primary) / 0.7); 
  }
  50% { 
    transform: scale(1.05); 
    box-shadow: 0 0 30px 10px hsl(var(--primary) / 0.4); 
  }
  100% { 
    transform: scale(1); 
    box-shadow: 0 0 0 0 hsl(var(--primary) / 0); 
  }
}

.animate-level-up {
  animation: level-up 0.6s ease-out;
}

/* Pulse Glow */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 5px hsl(var(--primary) / 0.5); }
  50% { box-shadow: 0 0 20px hsl(var(--primary) / 0.8); }
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}
```

### Tailwind Config - Animations

```typescript
keyframes: {
  "accordion-down": {
    from: { height: "0", opacity: "0" },
    to: { height: "var(--radix-accordion-content-height)", opacity: "1" },
  },
  "accordion-up": {
    from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
    to: { height: "0", opacity: "0" },
  },
  "pulse-ring": {
    "0%": { transform: "scale(0.8)", opacity: "0.5" },
    "50%": { transform: "scale(1.2)", opacity: "0" },
    "100%": { transform: "scale(0.8)", opacity: "0.5" },
  },
  "bounce-in": {
    "0%": { transform: "scale(0.3)", opacity: "0" },
    "50%": { transform: "scale(1.05)" },
    "70%": { transform: "scale(0.9)" },
    "100%": { transform: "scale(1)", opacity: "1" },
  },
  "slide-up": {
    from: { transform: "translateY(10px)", opacity: "0" },
    to: { transform: "translateY(0)", opacity: "1" },
  },
  "fade-in": {
    from: { opacity: "0" },
    to: { opacity: "1" },
  },
  shimmer: {
    "0%": { backgroundPosition: "-200% 0" },
    "100%": { backgroundPosition: "200% 0" },
  },
  float: {
    "0%, 100%": { transform: "translateY(0)" },
    "50%": { transform: "translateY(-10px)" },
  },
  "glow-pulse": {
    "0%, 100%": { boxShadow: "0 0 5px hsl(var(--primary) / 0.3)" },
    "50%": { boxShadow: "0 0 20px hsl(var(--primary) / 0.6)" },
  },
  wiggle: {
    "0%, 100%": { transform: "rotate(-3deg)" },
    "50%": { transform: "rotate(3deg)" },
  },
  pop: {
    "0%": { transform: "scale(1)" },
    "50%": { transform: "scale(1.1)" },
    "100%": { transform: "scale(1)" },
  },
},
animation: {
  "accordion-down": "accordion-down 0.2s ease-out",
  "accordion-up": "accordion-up 0.2s ease-out",
  "pulse-ring": "pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  "bounce-in": "bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  "slide-up": "slide-up 0.3s ease-out",
  "slide-down": "slide-down 0.3s ease-out",
  "slide-left": "slide-left 0.3s ease-out",
  "slide-right": "slide-right 0.3s ease-out",
  "fade-in": "fade-in 0.2s ease-out",
  "fade-out": "fade-out 0.2s ease-out",
  "scale-in": "scale-in 0.2s ease-out",
  shimmer: "shimmer 2s linear infinite",
  float: "float 3s ease-in-out infinite",
  "glow-pulse": "glow-pulse 2s ease-in-out infinite",
  "border-glow": "border-glow 2s ease-in-out infinite",
  wiggle: "wiggle 0.3s ease-in-out",
  pop: "pop 0.3s ease-out",
  "count-up": "count-up 0.4s ease-out forwards",
}
```

---

## 8. TIMING FUNCTIONS

### Tailwind Config

```typescript
transitionDuration: {
  "150": "150ms",
  "200": "200ms",
  "250": "250ms",
  "300": "300ms",
  "400": "400ms",
  "500": "500ms",
},
transitionTimingFunction: {
  "bounce-in": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
  spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
}
```

---

## 9. CARD STYLES

### CSS Classes

```css
/* Base Card */
.card-base {
  @apply bg-card rounded-xl border border-border p-card transition-all duration-200;
}

/* Elevated Card */
.card-elevated {
  @apply bg-card-elevated rounded-xl border border-border p-card shadow-md hover:shadow-lg transition-all duration-200;
}

/* Interactive Card - Com efeitos hover */
.card-interactive {
  @apply relative bg-card rounded-xl border border-border p-card transition-all duration-300 
         hover:border-primary/30 hover:shadow-lg overflow-hidden cursor-pointer;
}

/* Shimmer e glow no hover */
.card-interactive::before {
  content: '';
  @apply absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none;
  background: linear-gradient(
    135deg,
    transparent 0%,
    hsl(var(--primary) / 0.03) 50%,
    transparent 100%
  );
}

.card-interactive:hover::before {
  @apply opacity-100;
}

.card-interactive::after {
  content: '';
  @apply absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none;
  background: radial-gradient(
    600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    hsl(var(--primary) / 0.06),
    transparent 40%
  );
}

.card-interactive:hover::after {
  @apply opacity-100;
}

/* Glass Card */
.glass-card {
  @apply rounded-xl p-card backdrop-blur-md border transition-all duration-200;
  background: hsl(var(--glass-bg));
  border-color: hsl(var(--glass-border));
}

/* Stat Card - Para métricas/estatísticas */
.stat-card {
  @apply bg-card rounded-xl border border-border p-card-sm transition-all duration-200 
         hover:border-primary/20 hover:shadow-sm;
}

/* Hierarquia de Cards */
.card-subtle {
  @apply bg-muted/30 border-transparent;
}

.card-prominent {
  @apply bg-card-elevated shadow-md border-primary/10;
}

.card-featured {
  @apply bg-card-elevated shadow-lg border-primary/20 ring-1 ring-primary/5;
}

/* Cards com estados */
.card-pulse-subtle {
  @apply animate-pulse bg-primary/5;
}

.card-pulse-warning {
  @apply border-warning/50 bg-warning/5;
}

.card-pulse-success {
  @apply border-success/50 bg-success/5;
}
```

---

## 10. HOVER EFFECTS

### CSS Classes

```css
/* Lift Effects */
.hover-lift {
  @apply transition-all duration-200 hover:-translate-y-1 hover:shadow-lg;
}

.hover-lift-sm {
  @apply transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md;
}

.hover-lift-lg {
  @apply transition-all duration-200 hover:-translate-y-2 hover:shadow-xl;
}

/* Scale Effects */
.hover-scale {
  @apply transition-transform duration-200 hover:scale-105;
}

.hover-scale-sm {
  @apply transition-transform duration-200 hover:scale-102;
}

/* Glow Effects */
.hover-glow {
  @apply transition-shadow duration-300 hover:shadow-glow-primary;
}

.hover-glow-primary {
  @apply transition-shadow duration-300;
}
.hover-glow-primary:hover {
  box-shadow: 0 0 20px hsl(var(--primary) / 0.4);
}

.hover-glow-secondary {
  @apply transition-shadow duration-300;
}
.hover-glow-secondary:hover {
  box-shadow: 0 0 20px hsl(var(--secondary) / 0.4);
}

.hover-glow-success {
  @apply transition-shadow duration-300;
}
.hover-glow-success:hover {
  box-shadow: 0 0 20px hsl(var(--success) / 0.4);
}

/* Press Effects */
.press-scale {
  @apply transition-transform duration-100 active:scale-95;
}

.press-scale-sm {
  @apply transition-transform duration-100 active:scale-98;
}
```

---

## 11. FOCUS STATES

### CSS - Acessibilidade

```css
/* Focus ring padrão elegante */
:focus-visible {
  @apply outline-none;
  box-shadow: 
    0 0 0 2px hsl(var(--background)),
    0 0 0 4px hsl(var(--ring)),
    0 0 16px hsl(var(--primary) / 0.2);
}

/* Botões com focus especial */
button:focus-visible,
[role="button"]:focus-visible {
  @apply outline-none;
  box-shadow: 
    0 0 0 2px hsl(var(--background)),
    0 0 0 4px hsl(var(--primary)),
    0 0 20px hsl(var(--primary) / 0.3);
}

/* Inputs com focus */
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  @apply outline-none border-primary;
  box-shadow: 
    0 0 0 3px hsl(var(--primary) / 0.1),
    0 0 12px hsl(var(--primary) / 0.15);
}
```

---

## 12. RANK BADGES

### CSS Classes

```css
.rank-gold {
  @apply relative;
  background: linear-gradient(135deg, hsl(45 93% 47%), hsl(38 92% 50%));
  box-shadow: 0 0 15px hsl(45 93% 47% / 0.4);
  color: hsl(var(--rank-gold-foreground));
}

.rank-silver {
  @apply relative;
  background: linear-gradient(135deg, hsl(220 15% 75%), hsl(220 13% 65%));
  box-shadow: 0 0 12px hsl(220 15% 75% / 0.3);
  color: hsl(var(--rank-silver-foreground));
}

.rank-bronze {
  @apply relative;
  background: linear-gradient(135deg, hsl(30 55% 55%), hsl(25 50% 45%));
  box-shadow: 0 0 10px hsl(30 55% 55% / 0.3);
  color: hsl(var(--rank-bronze-foreground));
}
```

---

## 13. SIDEBAR TOKENS

### CSS Variables

```css
:root {
  /* Light Mode Sidebar */
  --sidebar-background: 40 25% 97%;
  --sidebar-foreground: 225 25% 12%;
  --sidebar-primary: 252 87% 64%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 40 30% 92%;
  --sidebar-accent-foreground: 225 25% 15%;
  --sidebar-border: 40 20% 88%;
  --sidebar-ring: 252 87% 64%;
}

.dark {
  /* Dark Mode Sidebar */
  --sidebar-background: 225 30% 10%;
  --sidebar-foreground: 210 40% 96%;
  --sidebar-primary: 252 87% 64%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 225 25% 18%;
  --sidebar-accent-foreground: 210 40% 96%;
  --sidebar-border: 225 20% 18%;
  --sidebar-ring: 252 87% 64%;
}
```

### Tailwind Config

```typescript
sidebar: {
  DEFAULT: "hsl(var(--sidebar-background))",
  foreground: "hsl(var(--sidebar-foreground))",
  primary: "hsl(var(--sidebar-primary))",
  "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
  accent: "hsl(var(--sidebar-accent))",
  "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
  border: "hsl(var(--sidebar-border))",
  ring: "hsl(var(--sidebar-ring))",
}
```

---

## 14. GLASS MORPHISM

### CSS Classes

```css
.glass {
  @apply backdrop-blur-md border transition-all duration-200;
  background: hsl(var(--glass-bg));
  border-color: hsl(var(--glass-border));
}

.glass-strong {
  @apply backdrop-blur-xl border transition-all duration-200;
  background: hsl(var(--glass-bg));
  border-color: hsl(var(--glass-border));
}

.glass-card {
  @apply rounded-xl p-card backdrop-blur-md border transition-all duration-200;
  background: hsl(var(--glass-bg));
  border-color: hsl(var(--glass-border));
}
```

---

## 15. SCROLLBAR STYLING

### CSS

```css
/* Webkit (Chrome, Safari, Edge) */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: hsl(var(--muted) / 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 4px;
  transition: background 0.2s;
}

::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}

/* Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--muted-foreground) / 0.3) hsl(var(--muted) / 0.3);
}
```

---

## 16. ACESSIBILIDADE

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Theme Transition

```css
body {
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

---

## 17. FRAMER MOTION PATTERNS

### Page Transitions

```typescript
// Wrapper para páginas
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const pageTransition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.3
};

// Uso
<motion.div
  initial="initial"
  animate="animate"
  exit="exit"
  variants={pageVariants}
  transition={pageTransition}
>
  {children}
</motion.div>
```

### Staggered Children

```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  }
};

// Uso
<motion.div variants={containerVariants} initial="hidden" animate="visible">
  {items.map((item) => (
    <motion.div key={item.id} variants={itemVariants}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

### Slide Variants

```typescript
const slideVariants = {
  left: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 }
  },
  right: {
    initial: { x: 20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 }
  },
  up: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 }
  },
  down: {
    initial: { y: -20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 20, opacity: 0 }
  }
};
```

### Hover & Tap

```typescript
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
  Click me
</motion.button>
```

---

## 18. SEO E META TAGS

### index.html Template

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    
    <!-- Primary Meta Tags -->
    <title>Task Gifts - Plataforma de Gamificação Corporativa</title>
    <meta name="title" content="Task Gifts - Plataforma de Gamificação Corporativa" />
    <meta name="description" content="Transforme o engajamento da sua equipe com gamificação. Quests, conquistas, rankings e recompensas para treinamento corporativo." />
    
    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    
    <!-- PWA -->
    <meta name="theme-color" content="#7c3aed" />
    <link rel="manifest" href="/manifest.json" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Task Gifts" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://seusite.com/" />
    <meta property="og:title" content="Task Gifts - Plataforma de Gamificação Corporativa" />
    <meta property="og:description" content="Transforme o engajamento da sua equipe com gamificação." />
    <meta property="og:image" content="https://seusite.com/og-image.png" />
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="https://seusite.com/" />
    <meta property="twitter:title" content="Task Gifts" />
    <meta property="twitter:description" content="Transforme o engajamento da sua equipe com gamificação." />
    <meta property="twitter:image" content="https://seusite.com/og-image.png" />
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 19. COMPONENTES UI PADRÃO

### Componentes Base (shadcn/ui customizados)

```
src/components/ui/
├── accordion.tsx
├── alert-dialog.tsx
├── avatar.tsx
├── badge.tsx
├── button.tsx          # Variantes: default, destructive, outline, secondary, ghost, link
├── card.tsx
├── checkbox.tsx
├── dialog.tsx
├── drawer.tsx          # Para mobile
├── dropdown-menu.tsx
├── form.tsx
├── input.tsx
├── label.tsx
├── popover.tsx
├── progress.tsx
├── scroll-area.tsx
├── select.tsx
├── separator.tsx
├── sheet.tsx
├── sidebar.tsx         # Navegação principal
├── skeleton.tsx
├── slider.tsx
├── sonner.tsx          # Toasts
├── switch.tsx
├── table.tsx
├── tabs.tsx
├── textarea.tsx
├── tooltip.tsx
└── use-toast.ts
```

### Componentes de Efeitos

```
src/components/effects/
├── AnimatedCoinsIndicator.tsx
├── AnimatedFireIndicator.tsx
├── AnimatedLevelIndicator.tsx
├── AnimatedTrophyIndicator.tsx
├── AnimatedXPParticles.tsx
├── ComboExplosion.tsx
├── FloatingReward.tsx
├── MiniConfetti.tsx
├── SuccessCelebration.tsx
└── WeeklyChallengeVictory.tsx
```

### Componentes Utilitários

```
src/components/
├── ConfirmDialog.tsx       # Diálogo de confirmação com undo
├── ErrorBoundary.tsx       # Tratamento de erros
├── HelpTooltip.tsx         # Tooltips de ajuda
├── LoadingOverlay.tsx      # Overlay de carregamento
├── FloatingActionButton.tsx # FAB para mobile
├── PageTransition.tsx      # Wrapper de transição de página
├── ProtectedRoute.tsx      # Proteção de rotas
├── StaggeredContainer.tsx  # Container com animação staggered
├── ThemeToggle.tsx         # Toggle light/dark
└── UndoToast.tsx           # Toast com ação de desfazer
```

---

## 20. PADRÕES DE ARQUITETURA

### Estrutura de Pastas

```
src/
├── components/
│   ├── ui/              # Componentes base (shadcn)
│   ├── effects/         # Animações e efeitos visuais
│   ├── admin/           # Componentes administrativos
│   ├── lms/             # Learning Management System
│   ├── manager/         # Dashboard de gestor
│   ├── onboarding/      # Fluxo de onboarding
│   ├── quest-builder/   # Criação de quests
│   └── quiz/            # Sistema de quiz
├── contexts/            # React Contexts
├── hooks/               # Custom hooks (React Query)
├── integrations/        # Integrações externas
│   └── supabase/
├── lib/                 # Utilitários
├── pages/               # Páginas/Rotas
└── services/            # Camada de serviços (Supabase)
```

### Padrão de 3 Camadas

```typescript
// 1. SERVICE LAYER - Comunicação com Supabase
// src/services/exampleService.ts
import { supabase } from "@/integrations/supabase/client";

export const exampleService = {
  async getAll() {
    const { data, error } = await supabase
      .from("examples")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  async create(item: InsertType) {
    const { data, error } = await supabase
      .from("examples")
      .insert(item)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// 2. HOOK LAYER - React Query + Cache
// src/hooks/useExamples.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { exampleService } from "@/services/exampleService";

export function useExamples() {
  return useQuery({
    queryKey: ["examples"],
    queryFn: exampleService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useCreateExample() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: exampleService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["examples"] });
    }
  });
}

// 3. COMPONENT LAYER - UI
// src/components/ExampleList.tsx
import { useExamples, useCreateExample } from "@/hooks/useExamples";

export function ExampleList() {
  const { data, isLoading, error } = useExamples();
  const createMutation = useCreateExample();
  
  if (isLoading) return <LoadingOverlay isLoading />;
  if (error) return <ErrorDisplay error={error} />;
  
  return (
    <div>
      {data?.map(item => <ExampleCard key={item.id} item={item} />)}
    </div>
  );
}
```

### React Query Config

```typescript
// src/main.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 minutos
      gcTime: 30 * 60 * 1000,      // 30 minutos (antigo cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

### Proteção de Rotas

```typescript
// src/components/ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "manager";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { roles, isLoading: rolesLoading } = useUserRoles();
  
  if (authLoading || rolesLoading) {
    return <LoadingOverlay isLoading fullScreen />;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (requiredRole && !roles.includes(requiredRole)) {
    return <AccessDenied />;
  }
  
  return <>{children}</>;
}

// App.tsx - Uso
<Route path="/admin" element={
  <ProtectedRoute requiredRole="admin">
    <AdminPanel />
  </ProtectedRoute>
} />
```

---

## 📋 CHECKLIST PARA NOVO PROJETO

### Setup Inicial
- [ ] Copiar `index.css` com todas as variáveis CSS
- [ ] Copiar `tailwind.config.ts` completo
- [ ] Configurar fontes no `index.html`
- [ ] Instalar dependências: `framer-motion`, `sonner`, `@tanstack/react-query`
- [ ] Configurar React Query Provider
- [ ] Instalar componentes shadcn necessários

### Estrutura
- [ ] Criar estrutura de pastas (components, hooks, services, pages)
- [ ] Configurar `ProtectedRoute` se usar autenticação
- [ ] Configurar `ThemeProvider` para light/dark mode
- [ ] Configurar `ErrorBoundary` global

### Design System
- [ ] Verificar todas as cores usando HSL tokens
- [ ] Testar animações em ambos os temas
- [ ] Verificar acessibilidade (focus states, reduced motion)
- [ ] Testar responsividade mobile

---

## 📚 REFERÊNCIAS

- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Framer Motion](https://www.framer.com/motion/)
- [React Query](https://tanstack.com/query/latest)
- [Supabase](https://supabase.com/docs)

---

> **Nota**: Este documento deve ser atualizado sempre que novos padrões forem estabelecidos no projeto.
