import { DEFAULT_DAMAGE_RULES, type BossDamageRules } from "./bossBattle";

/**
 * Motor puro de planejamento de batalhas do Chefão.
 *
 * Impede que um gestor publique uma batalha impossível (HP alto demais para a
 * janela e o time) ou trivial demais (derrotada no primeiro dia) — ambos os
 * extremos destroem o engajamento. Tudo é determinístico e testável.
 */

export interface BossPlanInput {
  title: string;
  description?: string | null;
  departmentId?: string | null;
  totalHp: number;
  startsAt: string;
  endsAt: string;
  rules: BossDamageRules;
  perUserCap: number;
  coinsPool: number;
  xpPool: number;
  minShare: number;
  perUserCoinsCap: number;
  /** Quantidade estimada de pessoas elegíveis a causar dano. */
  expectedParticipants: number;
}

/** Premissas de ritmo do time usadas na projeção de capacidade de dano. */
export interface BossPaceAssumptions {
  tasksPerPersonPerDay: number;
  /** Proporção de pessoas que fazem check-in pontual no dia (0..1). */
  attendanceRate: number;
  trailsPerPersonPerWindow: number;
  quizzesPerPersonPerDay: number;
  /** Multiplicador médio de combo efetivamente aplicado. */
  averageMultiplier: number;
}

export const DEFAULT_PACE: BossPaceAssumptions = {
  tasksPerPersonPerDay: 1.2,
  attendanceRate: 0.7,
  trailsPerPersonPerWindow: 0.5,
  quizzesPerPersonPerDay: 0.3,
  averageMultiplier: 1.15,
};

export type PlanLevel = "error" | "warning";

export interface PlanIssue {
  field: string;
  level: PlanLevel;
  message: string;
}

export interface BossPlanProjection {
  windowDays: number;
  /** Dano máximo projetado que o time consegue aplicar na janela. */
  capacity: number;
  /** Dano projetado por pessoa (já limitado pelo teto individual). */
  perPersonCapacity: number;
  /** totalHp / capacity. 1 = exige 100% da capacidade projetada. */
  difficultyRatio: number;
  /** Dia estimado (1-based) em que o chefão cai. null = não cai na janela. */
  estimatedDefeatDay: number | null;
  verdict: "impossivel" | "dificil" | "equilibrado" | "facil" | "trivial";
}

export interface BossPlanReview {
  valid: boolean;
  issues: PlanIssue[];
  projection: BossPlanProjection;
}

const MS_PER_DAY = 86_400_000;

function safeNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseDate(value: string): number | null {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

/** Dias corridos entre início e fim, arredondados para cima, mínimo 0. */
export function windowDays(startsAt: string, endsAt: string): number {
  const start = parseDate(startsAt);
  const end = parseDate(endsAt);
  if (start === null || end === null) return 0;
  const diff = end - start;
  if (diff <= 0) return 0;
  return Math.max(1, Math.ceil(diff / MS_PER_DAY));
}

/**
 * Projeta a capacidade de dano do time. Respeita o teto individual, pois dano
 * descartado por cap nunca chega a reduzir o HP do chefão.
 */
export function projectCapacity(
  input: BossPlanInput,
  pace: BossPaceAssumptions = DEFAULT_PACE,
): BossPlanProjection {
  const days = windowDays(input.startsAt, input.endsAt);
  const people = Math.max(0, Math.floor(safeNumber(input.expectedParticipants)));
  const base = { ...DEFAULT_DAMAGE_RULES.base, ...(input.rules?.base ?? {}) };
  const multiplier = Math.min(
    Math.max(1, safeNumber(pace.averageMultiplier, 1)),
    Math.max(1, safeNumber(input.rules?.maxMultiplier, 1)),
  );

  const dailyPerPerson =
    Math.max(0, safeNumber(base.task_score)) * Math.max(0, pace.tasksPerPersonPerDay) +
    Math.max(0, safeNumber(base.attendance)) * Math.min(1, Math.max(0, pace.attendanceRate)) +
    Math.max(0, safeNumber(base.quiz)) * Math.max(0, pace.quizzesPerPersonPerDay);

  const windowPerPerson =
    Math.max(0, safeNumber(base.trail_completion)) * Math.max(0, pace.trailsPerPersonPerWindow);

  const rawPerPerson = (dailyPerPerson * days + windowPerPerson) * multiplier;
  const cap = Math.max(0, safeNumber(input.perUserCap));
  const perPersonCapacity = Math.floor(cap > 0 ? Math.min(rawPerPerson, cap) : rawPerPerson);
  const capacity = perPersonCapacity * people;

  const totalHp = Math.max(0, Math.floor(safeNumber(input.totalHp)));
  const difficultyRatio = capacity > 0 ? totalHp / capacity : Number.POSITIVE_INFINITY;

  const dailyTeamDamage = days > 0 ? capacity / days : 0;
  const estimatedDefeatDay =
    dailyTeamDamage > 0 && totalHp > 0 && totalHp <= capacity
      ? Math.min(days, Math.max(1, Math.ceil(totalHp / dailyTeamDamage)))
      : null;

  let verdict: BossPlanProjection["verdict"];
  if (!Number.isFinite(difficultyRatio) || difficultyRatio > 1.2) verdict = "impossivel";
  else if (difficultyRatio > 0.85) verdict = "dificil";
  else if (difficultyRatio >= 0.45) verdict = "equilibrado";
  else if (difficultyRatio >= 0.2) verdict = "facil";
  else verdict = "trivial";

  return {
    windowDays: days,
    capacity,
    perPersonCapacity,
    difficultyRatio: Number.isFinite(difficultyRatio)
      ? Math.round(difficultyRatio * 1000) / 1000
      : Number.POSITIVE_INFINITY,
    estimatedDefeatDay,
    verdict,
  };
}

/**
 * Valida um rascunho. Erros bloqueiam a publicação; avisos apenas alertam
 * sobre risco de desengajamento.
 */
export function validateBossPlan(
  input: BossPlanInput,
  pace: BossPaceAssumptions = DEFAULT_PACE,
): BossPlanReview {
  const issues: PlanIssue[] = [];
  const push = (field: string, level: PlanLevel, message: string) =>
    issues.push({ field, level, message });

  const title = (input.title ?? "").trim();
  if (title.length < 3) push("title", "error", "Dê um nome com pelo menos 3 caracteres.");
  if (title.length > 120) push("title", "error", "O nome deve ter no máximo 120 caracteres.");

  const totalHp = safeNumber(input.totalHp);
  if (!Number.isInteger(totalHp) || totalHp <= 0) {
    push("totalHp", "error", "A vida do chefão precisa ser um número inteiro maior que zero.");
  } else if (totalHp > 10_000_000) {
    push("totalHp", "error", "A vida do chefão excede o limite seguro de 10.000.000.");
  }

  const start = parseDate(input.startsAt);
  const end = parseDate(input.endsAt);
  if (start === null) push("startsAt", "error", "Data de início inválida.");
  if (end === null) push("endsAt", "error", "Data de término inválida.");
  if (start !== null && end !== null && end <= start) {
    push("endsAt", "error", "O término precisa ser depois do início.");
  }

  const days = windowDays(input.startsAt, input.endsAt);
  if (days === 1) push("endsAt", "warning", "Janela de apenas 1 dia: o time terá pouco tempo de reagir.");
  if (days > 90) push("endsAt", "warning", "Janelas acima de 90 dias tendem a perder tração.");

  const people = safeNumber(input.expectedParticipants);
  if (!Number.isInteger(people) || people <= 0) {
    push("expectedParticipants", "error", "Informe quantas pessoas participam (mínimo 1).");
  }

  const coins = safeNumber(input.coinsPool);
  const xp = safeNumber(input.xpPool);
  if (coins < 0 || !Number.isInteger(coins)) push("coinsPool", "error", "Prêmio em moedas inválido.");
  if (xp < 0 || !Number.isInteger(xp)) push("xpPool", "error", "Prêmio em XP inválido.");
  if (coins === 0 && xp === 0) {
    push("coinsPool", "warning", "Sem prêmio em moedas nem XP a batalha perde apelo.");
  }

  const minShare = safeNumber(input.minShare);
  if (minShare < 0 || minShare > 1) {
    push("minShare", "error", "A participação mínima deve ficar entre 0 e 1.");
  } else if (people > 0 && minShare * people > 1) {
    push(
      "minShare",
      "error",
      "A participação mínima multiplicada pelo número de pessoas ultrapassa 100% do prêmio.",
    );
  }

  const perUserCoinsCap = safeNumber(input.perUserCoinsCap);
  if (perUserCoinsCap < 0 || !Number.isInteger(perUserCoinsCap)) {
    push("perUserCoinsCap", "error", "Teto de moedas por pessoa inválido.");
  } else if (perUserCoinsCap > 0 && people > 0 && perUserCoinsCap * people < coins) {
    push(
      "perUserCoinsCap",
      "warning",
      "O teto por pessoa impede a distribuição integral do prêmio em moedas.",
    );
  }

  const perUserCap = safeNumber(input.perUserCap);
  if (perUserCap < 0 || !Number.isInteger(perUserCap)) {
    push("perUserCap", "error", "Teto de dano por pessoa inválido.");
  }

  const base = { ...DEFAULT_DAMAGE_RULES.base, ...(input.rules?.base ?? {}) };
  const totalBase = Object.values(base).reduce<number>(
    (sum, value) => sum + Math.max(0, safeNumber(value)),
    0,
  );
  if (totalBase <= 0) {
    push("rules", "error", "Nenhuma fonte de dano está ativa: o chefão seria imbatível.");
  }
  if (safeNumber(input.rules?.maxMultiplier, 1) < 1) {
    push("rules", "error", "O multiplicador máximo não pode ser menor que 1.");
  }

  const projection = projectCapacity(input, pace);

  if (projection.verdict === "impossivel" && totalBase > 0 && totalHp > 0 && people > 0 && days > 0) {
    push(
      "totalHp",
      "error",
      "Com o ritmo projetado o time não derruba esse HP dentro da janela. Reduza a vida ou amplie o prazo.",
    );
  } else if (projection.verdict === "dificil") {
    push("totalHp", "warning", "Batalha apertada: exige quase toda a capacidade projetada do time.");
  } else if (projection.verdict === "trivial" && totalHp > 0) {
    push("totalHp", "warning", "Batalha trivial: o chefão cai cedo demais e o prêmio perde valor.");
  }

  if (perUserCap > 0 && projection.perPersonCapacity >= perUserCap) {
    push(
      "perUserCap",
      "warning",
      "O teto individual será atingido: parte do dano do time será descartada.",
    );
  }

  return {
    valid: issues.every((issue) => issue.level !== "error"),
    issues,
    projection,
  };
}

/** Sugere um HP equilibrado (≈70% da capacidade projetada) para a janela. */
export function suggestTotalHp(
  input: BossPlanInput,
  pace: BossPaceAssumptions = DEFAULT_PACE,
): number {
  const projection = projectCapacity({ ...input, totalHp: 1 }, pace);
  if (projection.capacity <= 0) return 0;
  return Math.max(50, Math.round((projection.capacity * 0.7) / 50) * 50);
}