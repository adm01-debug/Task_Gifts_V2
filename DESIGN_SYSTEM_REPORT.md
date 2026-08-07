# 📊 Task Gifts - Relatório Completo do Design System

## 🎨 PROMPT PARA REPLICAR ESTE DESIGN SYSTEM

```
Crie um design system para uma plataforma de gamificação corporativa com as seguintes características:

**FONTE:**
- Fonte principal: Plus Jakarta Sans (Google Fonts)
- Pesos: 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold)
- Import: @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

**PALETA DE CORES (HSL):**

Light Mode:
- Background: hsl(0 0% 100%) - Branco puro
- Foreground: hsl(225 25% 10%) - Azul escuro profundo
- Primary: hsl(24 95% 50%) - Laranja vibrante/coral energético
- Secondary: hsl(210 100% 55%) - Azul elétrico
- Success: hsl(142 70% 45%) - Verde esmeralda
- Warning: hsl(45 100% 50%) - Amarelo dourado
- Accent: hsl(280 80% 55%) - Roxo/violeta
- Destructive: hsl(0 80% 50%) - Vermelho
- Muted: hsl(220 15% 95%) - Cinza claro
- Border: hsl(220 15% 90%) - Cinza borda

Dark Mode (Gaming Theme):
- Background: hsl(225 25% 6%) - Azul muito escuro
- Foreground: hsl(0 0% 98%) - Branco suave
- Card: hsl(225 25% 9%) - Azul escuro elevado
- Primary: hsl(24 95% 55%) - Laranja vibrante (mais claro)
- Secondary: hsl(210 100% 60%) - Azul elétrico (mais claro)
- Success: hsl(142 70% 50%) - Verde esmeralda
- Warning: hsl(45 100% 55%) - Amarelo dourado
- Accent: hsl(280 80% 60%) - Roxo/violeta
- Muted: hsl(225 20% 14%) - Cinza escuro
- Border: hsl(225 20% 15%) - Borda escura

**CORES ESPECIAIS GAMIFICAÇÃO:**
- XP: hsl(142 70% 50%) - Verde (mesma do success)
- Coins: hsl(45 100% 55%) - Amarelo dourado
- Streak: hsl(24 95% 55%) - Laranja (mesma do primary)
- Gold Rank: hsl(45 100% 55%) - Dourado
- Silver Rank: hsl(220 10% 70%) - Prateado
- Bronze Rank: hsl(25 60% 50%) - Bronze

**GRADIENTES:**
- Primary: linear-gradient(135deg, hsl(24 95% 55%), hsl(340 80% 55%)) - Laranja para rosa
- Secondary: linear-gradient(135deg, hsl(210 100% 60%), hsl(280 80% 60%)) - Azul para roxo
- Success: linear-gradient(135deg, hsl(142 70% 50%), hsl(170 70% 45%)) - Verde para ciano
- XP Bar: linear-gradient(90deg, hsl(142 70% 50%), hsl(180 70% 50%)) - Verde para teal

**EFEITOS:**
- Glass: backdrop-filter: blur(20px) com fundo semi-transparente
- Glow Primary: box-shadow: 0 0 40px hsl(24 95% 55% / 0.3)
- Glow Secondary: box-shadow: 0 0 40px hsl(210 100% 60% / 0.3)
- Glow Success: box-shadow: 0 0 40px hsl(142 70% 50% / 0.3)

**BORDER RADIUS:** 0.75rem (12px) como padrão

**ANIMAÇÕES GAMIFICAÇÃO:**
- XP Bar: shimmer horizontal 2s infinite
- Streak Fire: pulse com glow 1.5s infinite
- Coin Shine: glow pulsante 3s infinite
- Level Up: scale + ring expansion 0.6s

**SIDEBAR:**
- Background claro: hsl(220 15% 97%)
- Background escuro: hsl(225 25% 7%)
- Primary mantém o laranja do tema

Use Tailwind CSS com variáveis CSS HSL para todas as cores. Implemente dark mode com classe .dark no HTML root.
```

---

## 📝 DETALHAMENTO TÉCNICO COMPLETO

### 1. TIPOGRAFIA

| Propriedade | Valor |
|-------------|-------|
| **Família** | Plus Jakarta Sans |
| **Fallback** | system-ui, sans-serif |
| **Pesos disponíveis** | 400, 500, 600, 700, 800 |
| **Import Google Fonts** | `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap')` |

---

### 2. CORES - LIGHT MODE

#### Cores Base
| Token | HSL | Hex Aproximado | Uso |
|-------|-----|----------------|-----|
| `--background` | 0 0% 100% | #FFFFFF | Fundo principal |
| `--foreground` | 225 25% 10% | #131A26 | Texto principal |
| `--card` | 0 0% 99% | #FCFCFC | Cards e containers |
| `--card-foreground` | 225 25% 10% | #131A26 | Texto em cards |

#### Cores de Ação
| Token | HSL | Hex Aproximado | Uso |
|-------|-----|----------------|-----|
| `--primary` | 24 95% 50% | #F97316 | Ações principais, CTAs |
| `--primary-foreground` | 0 0% 100% | #FFFFFF | Texto em primary |
| `--secondary` | 210 100% 55% | #3B82F6 | Ações secundárias |
| `--secondary-foreground` | 0 0% 100% | #FFFFFF | Texto em secondary |

#### Cores de Feedback
| Token | HSL | Hex Aproximado | Uso |
|-------|-----|----------------|-----|
| `--success` | 142 70% 45% | #22C55E | Sucesso, XP |
| `--success-foreground` | 0 0% 100% | #FFFFFF | Texto em success |
| `--warning` | 45 100% 50% | #EAB308 | Alertas, coins |
| `--warning-foreground` | 225 25% 10% | #131A26 | Texto em warning |
| `--destructive` | 0 80% 50% | #DC2626 | Erros, exclusões |
| `--destructive-foreground` | 0 0% 100% | #FFFFFF | Texto em destructive |

#### Cores Neutras
| Token | HSL | Hex Aproximado | Uso |
|-------|-----|----------------|-----|
| `--muted` | 220 15% 95% | #F1F3F5 | Fundos sutis |
| `--muted-foreground` | 220 10% 45% | #6B7280 | Texto secundário |
| `--accent` | 280 80% 55% | #A855F7 | Destaques especiais |
| `--accent-foreground` | 0 0% 100% | #FFFFFF | Texto em accent |
| `--border` | 220 15% 90% | #E5E7EB | Bordas |
| `--input` | 220 15% 90% | #E5E7EB | Inputs |
| `--ring` | 24 95% 50% | #F97316 | Focus rings |

---

### 3. CORES - DARK MODE

#### Cores Base
| Token | HSL | Hex Aproximado | Uso |
|-------|-----|----------------|-----|
| `--background` | 225 25% 6% | #0D1117 | Fundo principal |
| `--foreground` | 0 0% 98% | #FAFAFA | Texto principal |
| `--card` | 225 25% 9% | #161B22 | Cards e containers |
| `--card-foreground` | 0 0% 98% | #FAFAFA | Texto em cards |

#### Cores de Ação (mais claras para contraste)
| Token | HSL | Hex Aproximado | Uso |
|-------|-----|----------------|-----|
| `--primary` | 24 95% 55% | #FB923C | Ações principais |
| `--secondary` | 210 100% 60% | #60A5FA | Ações secundárias |
| `--success` | 142 70% 50% | #4ADE80 | Sucesso, XP |
| `--warning` | 45 100% 55% | #FACC15 | Alertas, coins |
| `--accent` | 280 80% 60% | #C084FC | Destaques especiais |
| `--destructive` | 0 80% 55% | #EF4444 | Erros |

#### Cores Neutras
| Token | HSL | Hex Aproximado | Uso |
|-------|-----|----------------|-----|
| `--muted` | 225 20% 14% | #1F2937 | Fundos sutis |
| `--muted-foreground` | 225 10% 55% | #9CA3AF | Texto secundário |
| `--border` | 225 20% 15% | #21262D | Bordas |
| `--input` | 225 20% 15% | #21262D | Inputs |

---

### 4. CORES ESPECIAIS - GAMIFICAÇÃO

| Token | HSL Light | HSL Dark | Uso |
|-------|-----------|----------|-----|
| `--xp` | 142 70% 45% | 142 70% 50% | Barras de XP |
| `--coins` | 45 100% 50% | 45 100% 55% | Moedas/rewards |
| `--streak` | 24 95% 50% | 24 95% 55% | Streaks/sequências |
| `--gold` | 45 100% 50% | 45 100% 55% | Rank #1 |
| `--silver` | 220 10% 65% | 220 10% 70% | Rank #2-3 |
| `--bronze` | 25 60% 45% | 25 60% 50% | Rank #4-10 |

---

### 5. GRADIENTES

```css
/* Primary - Laranja para Rosa */
--gradient-primary: linear-gradient(135deg, hsl(24 95% 55%), hsl(340 80% 55%));

/* Secondary - Azul para Roxo */
--gradient-secondary: linear-gradient(135deg, hsl(210 100% 60%), hsl(280 80% 60%));

/* Success - Verde para Ciano */
--gradient-success: linear-gradient(135deg, hsl(142 70% 50%), hsl(170 70% 45%));

/* XP Bar - Verde horizontal */
--gradient-xp: linear-gradient(90deg, hsl(142 70% 50%), hsl(180 70% 50%));

/* Rank Gradients */
.rank-gold: linear-gradient(135deg, hsl(45 100% 60%), hsl(35 100% 45%));
.rank-silver: linear-gradient(135deg, hsl(220 15% 75%), hsl(220 10% 55%));
.rank-bronze: linear-gradient(135deg, hsl(25 70% 55%), hsl(15 60% 40%));
```

---

### 6. EFEITOS VISUAIS

#### Glassmorphism
```css
.glass {
  background: hsl(var(--glass-bg)); /* 225 25% 10% / 0.7 no dark */
  backdrop-filter: blur(20px);
  border: 1px solid hsl(var(--glass-border)); /* 0 0% 100% / 0.08 no dark */
}
```

#### Glow Effects
```css
--shadow-glow-primary: 0 0 40px hsl(24 95% 55% / 0.3);
--shadow-glow-secondary: 0 0 40px hsl(210 100% 60% / 0.3);
--shadow-glow-success: 0 0 40px hsl(142 70% 50% / 0.3);
```

#### Gradient Text
```css
.gradient-text {
  background-image: var(--gradient-primary);
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

### 7. ANIMAÇÕES

#### XP Bar Shimmer
```css
@keyframes xp-shimmer {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
.xp-bar { animation: xp-shimmer 2s ease-in-out infinite; }
```

#### Streak Fire Pulse
```css
@keyframes fire-pulse {
  0%, 100% { 
    filter: drop-shadow(0 0 8px hsl(24 95% 55% / 0.6));
    transform: scale(1);
  }
  50% { 
    filter: drop-shadow(0 0 16px hsl(24 95% 55% / 0.9));
    transform: scale(1.1);
  }
}
.streak-fire { animation: fire-pulse 1.5s ease-in-out infinite; }
```

#### Coin Shine
```css
@keyframes coin-rotate {
  0% { filter: drop-shadow(0 0 4px hsl(45 100% 55% / 0.5)); }
  50% { filter: drop-shadow(0 0 12px hsl(45 100% 55% / 0.9)); }
  100% { filter: drop-shadow(0 0 4px hsl(45 100% 55% / 0.5)); }
}
.coin-shine { animation: coin-rotate 3s linear infinite; }
```

#### Level Up Flash
```css
@keyframes level-up {
  0% { transform: scale(1); box-shadow: 0 0 0 0 hsl(var(--primary) / 0.7); }
  50% { transform: scale(1.05); box-shadow: 0 0 0 20px hsl(var(--primary) / 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 hsl(var(--primary) / 0); }
}
.animate-level-up { animation: level-up 0.6s ease-out; }
```

---

### 8. SIDEBAR

| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| `--sidebar-background` | 220 15% 97% | 225 25% 7% |
| `--sidebar-foreground` | 225 25% 15% | 0 0% 90% |
| `--sidebar-primary` | 24 95% 50% | 24 95% 55% |
| `--sidebar-accent` | 220 15% 93% | 225 20% 12% |
| `--sidebar-border` | 220 15% 90% | 225 20% 12% |

---

### 9. BORDER RADIUS

```css
--radius: 0.75rem; /* 12px */

/* Tailwind classes */
rounded-lg: var(--radius)
rounded-md: calc(var(--radius) - 2px)
rounded-sm: calc(var(--radius) - 4px)
```

---

### 10. TAILWIND CONFIG ESSENCIAL

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
  },
  secondary: {
    DEFAULT: "hsl(var(--secondary))",
    foreground: "hsl(var(--secondary-foreground))",
  },
  success: {
    DEFAULT: "hsl(var(--success))",
    foreground: "hsl(var(--success-foreground))",
  },
  warning: {
    DEFAULT: "hsl(var(--warning))",
    foreground: "hsl(var(--warning-foreground))",
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
  xp: "hsl(var(--xp))",
  coins: "hsl(var(--coins))",
  streak: "hsl(var(--streak))",
  gold: "hsl(var(--gold))",
  silver: "hsl(var(--silver))",
  bronze: "hsl(var(--bronze))",
}
```

---

## 🎯 IDENTIDADE VISUAL RESUMIDA

| Aspecto | Descrição |
|---------|-----------|
| **Estilo** | Gaming/Gamificação Corporativa |
| **Mood** | Energético, profissional, recompensador |
| **Cores dominantes** | Laranja vibrante + Azul elétrico |
| **Contraste** | Alto contraste para acessibilidade |
| **Efeitos** | Glassmorphism, glows, gradientes |
| **Animações** | Fluidas, celebratórias, engajantes |
| **Dark Mode** | Tema gaming com azuis profundos |
| **Light Mode** | Clean profissional com toques vibrantes |
