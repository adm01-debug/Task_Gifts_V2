/**
 * Motor puro de validacao e projecao economica da configuracao de uma
 * "Guerra de Departamentos".
 *
 * Por que existe: a criacao de uma guerra e um ato economico. Uma configuracao
 * errada (pool alto + teto por membro alto + muitos departamentos premiados)
 * pode emitir dezenas de milhares de moedas de uma vez e quebrar a economia do
 * sistema. O banco garante integridade estrutural (CHECKs, trigger), mas o
 * gestor precisa ver ANTES de salvar quanto aquilo custa no pior caso.
 *
 * Este modulo nao escreve nada: valida, normaliza e projeta. A fonte de verdade
 * do credito continua sendo `settle_department_war` no banco.
 */

import { distributeWarRewards, type WarStanding } from "./departmentWar";

export interface WarMetricDraft {
  metric_key: string;
  label: string;
  weight: number;
}

export interface WarDepartmentDraft {
  department_id: string;
  name: string;
  headcount: number;
}

export interface WarConfigDraft {
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  fairness_alpha: number;
  per_user_cap: number;
  participation_bonus: number;
  coins_pool: number;
  xp_pool: number;
  placement_shares: number[];
  per_member_coins_cap: number;
  metrics: WarMetricDraft[];
  departments: WarDepartmentDraft[];
}

export type WarConfigIssueLevel = "error" | "warning";

export interface WarConfigIssue {
  field: string;
  level: WarConfigIssueLevel;
  message: string;
}

export interface WarCostProjection {
  /** Pior caso de moedas efetivamente creditadas. */
  coins_worst_case: number;
  xp_worst_case: number;
  /** Moedas que voltam ao caixa por arredondamento/teto no pior caso. */
  coins_returned: number;
  xp_returned: number;
  /** Numero de departamentos que recebem premio. */
  awarded_departments: number;
  /** Colaboradores alcancados pelo premio. */
  reached_members: number;
  /** Maior valor que um unico colaborador pode receber. */
  max_coins_per_member: number;
}

export interface WarConfigReview {
  valid: boolean;
  issues: WarConfigIssue[];
  normalized: WarConfigDraft;
  projection: WarCostProjection;
}

/** Limites de sanidade — evitam configuracoes catastroficas por engano. */
export const WAR_LIMITS = {
  TITLE_MIN: 3,
  TITLE_MAX: 120,
  DESCRIPTION_MAX: 1000,
  MIN_DURATION_MS: 60 * 60 * 1000, // 1 hora
  MAX_DURATION_MS: 365 * 24 * 60 * 60 * 1000, // 1 ano
  MAX_COINS_POOL: 1_000_000,
  MAX_XP_POOL: 1_000_000,
  MAX_METRICS: 20,
  MAX_DEPARTMENTS: 60,
  MAX_PLACEMENTS: 10,
  /** Acima disso o custo merece um aviso explicito ao gestor. */
  COINS_WARN_THRESHOLD: 50_000,
  COINS_PER_MEMBER_WARN: 2_000,
} as const;

const METRIC_KEY_RE = /^[a-z][a-z0-9_]{1,48}$/;

function toInt(value: unknown, fallback = 0): number {
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toFloat(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseDate(value: unknown): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function emptyWarDraft(now = new Date()): WarConfigDraft {
  const start = new Date(now.getTime());
  const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  return {
    title: "",
    description: "",
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
    fairness_alpha: 0.5,
    per_user_cap: 0,
    participation_bonus: 0.2,
    coins_pool: 0,
    xp_pool: 0,
    placement_shares: [0.5, 0.3, 0.2],
    per_member_coins_cap: 0,
    metrics: [],
    departments: [],
  };
}

/**
 * Normaliza um rascunho para valores sempre seguros de persistir.
 * Nunca lanca: entradas absurdas viram os limites mais proximos.
 */
export function normalizeWarDraft(
  draft: Partial<WarConfigDraft> | null | undefined,
): WarConfigDraft {
  const source = draft ?? {};
  const startMs = parseDate(source.starts_at);
  const endMs = parseDate(source.ends_at);

  const metricsSource = Array.isArray(source.metrics) ? source.metrics : [];
  const seenMetric = new Set<string>();
  const metrics: WarMetricDraft[] = [];
  for (const metric of metricsSource) {
    if (!metric || typeof metric.metric_key !== "string") continue;
    const key = metric.metric_key.trim().toLowerCase();
    if (key === "" || seenMetric.has(key)) continue;
    seenMetric.add(key);
    metrics.push({
      metric_key: key,
      label: String(metric.label ?? key).trim().slice(0, 120) || key,
      weight: clamp(toFloat(metric.weight, 1), 0, 1000),
    });
    if (metrics.length >= WAR_LIMITS.MAX_METRICS) break;
  }

  const deptsSource = Array.isArray(source.departments) ? source.departments : [];
  const seenDept = new Set<string>();
  const departments: WarDepartmentDraft[] = [];
  for (const dept of deptsSource) {
    if (!dept || typeof dept.department_id !== "string") continue;
    const id = dept.department_id.trim();
    if (id === "" || seenDept.has(id)) continue;
    seenDept.add(id);
    departments.push({
      department_id: id,
      name: String(dept.name ?? "").trim().slice(0, 120),
      headcount: clamp(toInt(dept.headcount, 0), 0, 100_000),
    });
    if (departments.length >= WAR_LIMITS.MAX_DEPARTMENTS) break;
  }

  const sharesSource = Array.isArray(source.placement_shares) ? source.placement_shares : [];
  const placement_shares = sharesSource
    .slice(0, WAR_LIMITS.MAX_PLACEMENTS)
    .map((share) => clamp(toFloat(share, 0), 0, 1));

  return {
    title: String(source.title ?? "").trim().slice(0, WAR_LIMITS.TITLE_MAX),
    description: String(source.description ?? "").trim().slice(0, WAR_LIMITS.DESCRIPTION_MAX),
    starts_at: startMs === null ? "" : new Date(startMs).toISOString(),
    ends_at: endMs === null ? "" : new Date(endMs).toISOString(),
    fairness_alpha: clamp(toFloat(source.fairness_alpha, 0.5), 0, 1),
    per_user_cap: clamp(toInt(source.per_user_cap, 0), 0, 1_000_000),
    participation_bonus: clamp(toFloat(source.participation_bonus, 0.2), 0, 1),
    coins_pool: clamp(toInt(source.coins_pool, 0), 0, WAR_LIMITS.MAX_COINS_POOL),
    xp_pool: clamp(toInt(source.xp_pool, 0), 0, WAR_LIMITS.MAX_XP_POOL),
    placement_shares:
      placement_shares.length > 0 ? placement_shares : [0.5, 0.3, 0.2],
    per_member_coins_cap: clamp(toInt(source.per_member_coins_cap, 0), 0, 1_000_000),
    metrics,
    departments,
  };
}

/**
 * Projeta o custo maximo da guerra.
 *
 * Pior caso = todos os departamentos premiaveis recebem seu quinhao integral.
 * Reaproveita `distributeWarRewards` (o mesmo motor do encerramento real) para
 * que a previsao nunca divirja do pagamento efetivo.
 */
export function projectWarCost(draft: WarConfigDraft): WarCostProjection {
  const ordered = [...draft.departments].sort((a, b) => b.headcount - a.headcount);
  const standings: WarStanding[] = ordered.map((dept, index) => ({
    department_id: dept.department_id,
    name: dept.name,
    headcount: dept.headcount,
    raw_score: 0,
    capped_out: 0,
    contributors: 0,
    participation_rate: 0,
    score: 0,
    position: index + 1,
  }));

  const rewards = distributeWarRewards(standings, {
    coins_pool: draft.coins_pool,
    xp_pool: draft.xp_pool,
    placement_shares: draft.placement_shares,
    per_member_coins_cap: draft.per_member_coins_cap,
  });

  let coins = 0;
  let xp = 0;
  let coinsReturned = 0;
  let xpReturned = 0;
  let members = 0;
  let maxPerMember = 0;

  rewards.forEach((reward, index) => {
    coins += reward.coins_total;
    xp += reward.xp_total;
    coinsReturned += reward.coins_returned;
    xpReturned += reward.xp_returned;
    members += standings[index]?.headcount ?? 0;
    maxPerMember = Math.max(maxPerMember, reward.coins_per_member);
  });

  return {
    coins_worst_case: coins,
    xp_worst_case: xp,
    coins_returned: coinsReturned,
    xp_returned: xpReturned,
    awarded_departments: rewards.length,
    reached_members: members,
    max_coins_per_member: maxPerMember,
  };
}

/**
 * Revisa o rascunho: erros bloqueiam o salvamento, avisos apenas alertam.
 * A UI so habilita "Salvar" quando `valid === true`.
 */
export function reviewWarDraft(
  draft: Partial<WarConfigDraft> | null | undefined,
): WarConfigReview {
  const normalized = normalizeWarDraft(draft);
  const issues: WarConfigIssue[] = [];
  const raw = draft ?? {};

  if (normalized.title.length < WAR_LIMITS.TITLE_MIN) {
    issues.push({
      field: "title",
      level: "error",
      message: `Informe um título com pelo menos ${WAR_LIMITS.TITLE_MIN} caracteres.`,
    });
  }

  const startMs = parseDate(normalized.starts_at);
  const endMs = parseDate(normalized.ends_at);
  if (startMs === null) {
    issues.push({ field: "starts_at", level: "error", message: "Data de início inválida." });
  }
  if (endMs === null) {
    issues.push({ field: "ends_at", level: "error", message: "Data de término inválida." });
  }
  if (startMs !== null && endMs !== null) {
    const duration = endMs - startMs;
    if (duration <= 0) {
      issues.push({
        field: "ends_at",
        level: "error",
        message: "O término precisa ser posterior ao início.",
      });
    } else if (duration < WAR_LIMITS.MIN_DURATION_MS) {
      issues.push({
        field: "ends_at",
        level: "error",
        message: "A guerra precisa durar pelo menos 1 hora.",
      });
    } else if (duration > WAR_LIMITS.MAX_DURATION_MS) {
      issues.push({
        field: "ends_at",
        level: "error",
        message: "A guerra não pode durar mais de 1 ano.",
      });
    }
  }

  if (normalized.departments.length < 2) {
    issues.push({
      field: "departments",
      level: "error",
      message: "Selecione ao menos 2 departamentos — sem adversário não há guerra.",
    });
  }

  const zeroHeadcount = normalized.departments.filter((dept) => dept.headcount <= 0);
  if (zeroHeadcount.length > 0) {
    issues.push({
      field: "departments",
      level: "warning",
      message: `${zeroHeadcount.length} departamento(s) sem efetivo cadastrado — sincronize o efetivo antes de iniciar.`,
    });
  }

  if (normalized.metrics.length === 0) {
    issues.push({
      field: "metrics",
      level: "warning",
      message: "Sem métricas configuradas toda contribuição valerá peso 1.",
    });
  }

  const badKeys = normalized.metrics.filter((m) => !METRIC_KEY_RE.test(m.metric_key));
  if (badKeys.length > 0) {
    issues.push({
      field: "metrics",
      level: "error",
      message: `Chave de métrica inválida: ${badKeys.map((m) => m.metric_key).join(", ")}. Use letras minúsculas, números e "_".`,
    });
  }

  if (normalized.metrics.length > 0 && normalized.metrics.every((m) => m.weight <= 0)) {
    issues.push({
      field: "metrics",
      level: "error",
      message: "Ao menos uma métrica precisa ter peso maior que zero.",
    });
  }

  const rawMetrics = Array.isArray(raw.metrics) ? raw.metrics : [];
  if (rawMetrics.length > normalized.metrics.length) {
    issues.push({
      field: "metrics",
      level: "warning",
      message: "Métricas duplicadas ou inválidas foram descartadas.",
    });
  }

  const rawDepts = Array.isArray(raw.departments) ? raw.departments : [];
  if (rawDepts.length > normalized.departments.length) {
    issues.push({
      field: "departments",
      level: "warning",
      message: "Departamentos duplicados ou excedentes foram descartados.",
    });
  }

  if (normalized.placement_shares.every((share) => share <= 0)) {
    issues.push({
      field: "placement_shares",
      level: "error",
      message: "Defina ao menos uma colocação premiada com fatia maior que zero.",
    });
  }

  if (normalized.placement_shares.length > normalized.departments.length) {
    issues.push({
      field: "placement_shares",
      level: "warning",
      message: "Há mais colocações premiadas do que departamentos na disputa.",
    });
  }

  if (normalized.coins_pool === 0 && normalized.xp_pool === 0) {
    issues.push({
      field: "coins_pool",
      level: "warning",
      message: "Guerra sem premiação — só valerá pelo ranking simbólico.",
    });
  }

  const projection = projectWarCost(normalized);

  if (projection.coins_worst_case > WAR_LIMITS.COINS_WARN_THRESHOLD) {
    issues.push({
      field: "coins_pool",
      level: "warning",
      message: `Custo projetado alto: até ${projection.coins_worst_case.toLocaleString("pt-BR")} moedas creditadas de uma vez.`,
    });
  }

  if (projection.max_coins_per_member > WAR_LIMITS.COINS_PER_MEMBER_WARN) {
    issues.push({
      field: "per_member_coins_cap",
      level: "warning",
      message: `Um único colaborador pode receber até ${projection.max_coins_per_member.toLocaleString("pt-BR")} moedas. Considere um teto por membro.`,
    });
  }

  if (normalized.coins_pool > 0 && projection.coins_worst_case === 0) {
    issues.push({
      field: "coins_pool",
      level: "warning",
      message: "O pool configurado não gera crédito algum (efetivo alto demais ou teto zerado por arredondamento).",
    });
  }

  return {
    valid: !issues.some((issue) => issue.level === "error"),
    issues,
    normalized,
    projection,
  };
}
