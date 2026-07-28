/**
 * Motor puro dos **alertas de fase do Chefão Departamental**.
 *
 * O objetivo é comunicar urgência sem virar spam: um chefão que cai de 100%
 * para 5% em um único golpe deve gerar UM alerta (o da fase final atingida),
 * não quatro. E um chefão que oscila em torno de um limiar por causa de
 * reprocessos jamais pode notificar duas vezes o mesmo marco.
 *
 * Decisões de projeto (o "porquê" antes do "como"):
 *
 * 1. **Só travessia descendente notifica.** O alerta existe para chamar o time
 *    à ação enquanto ainda dá tempo; HP subindo (ajuste administrativo) é ruído.
 * 2. **Um alerta por golpe.** Quando várias fases são cruzadas de uma vez,
 *    emitimos apenas a mais grave — é a informação que muda o comportamento.
 * 3. **Idempotência por (batalha, fase).** A `dedupe_key` não depende do HP
 *    exato nem do horário, então retries e reprocessos convergem.
 * 4. **Copy em PT-BR, curta e acionável**, pronta para push (título ≤ 40 chars).
 */

import { bossPhase, type BossPhase } from "./bossBattle";

/** Fases que disparam alerta, da menos para a mais grave. */
export const ALERT_PHASES = ["wounded", "enraged", "critical", "defeated"] as const;
export type BossAlertPhase = (typeof ALERT_PHASES)[number];

const SEVERITY: Record<BossPhase, number> = {
  healthy: 0,
  wounded: 1,
  enraged: 2,
  critical: 3,
  defeated: 4,
};

export interface BossAlert {
  battleId: string;
  phase: BossAlertPhase;
  title: string;
  message: string;
  dedupeKey: string;
  url: string;
  hpPercent: number;
}

export interface BossAlertInput {
  battleId: string;
  battleTitle: string;
  totalHp: number;
  hpBefore: number;
  hpAfter: number;
}

/** Chave de idempotência — idêntica à construída no gatilho SQL. */
export function buildBossAlertDedupeKey(battleId: string, phase: BossAlertPhase): string {
  return `boss_phase:${battleId}:${phase}`;
}

const COPY: Record<BossAlertPhase, (title: string, pct: number) => { title: string; message: string }> = {
  wounded: (t, pct) => ({
    title: "Chefão ferido!",
    message: `${t} está com ${pct}% de vida. O time já tirou o primeiro terço — mantenha o ritmo.`,
  }),
  enraged: (t, pct) => ({
    title: "Chefão enfurecido!",
    message: `${t} caiu para ${pct}% de vida. Cada entrega no prazo agora vale muito.`,
  }),
  critical: (t, pct) => ({
    title: "Chefão em estado crítico!",
    message: `${t} está com apenas ${pct}% de vida. Faltam poucos golpes para derrubar.`,
  }),
  defeated: (t) => ({
    title: "Chefão derrotado!",
    message: `${t} foi derrubado pelo time. As recompensas serão distribuídas por contribuição.`,
  }),
};

const clampHp = (value: number, total: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(Math.floor(value), 0), total);
};

/**
 * Detecta o alerta a ser emitido por um golpe. Retorna `null` quando nenhuma
 * fase foi cruzada para baixo.
 */
export function detectBossAlert(input: BossAlertInput): BossAlert | null {
  const total = Math.max(1, Math.floor(Number.isFinite(input.totalHp) ? input.totalHp : 1));
  const before = clampHp(input.hpBefore, total);
  const after = clampHp(input.hpAfter, total);
  if (after >= before) return null;

  const phaseBefore = bossPhase({ totalHp: total, currentHp: before });
  const phaseAfter = bossPhase({ totalHp: total, currentHp: after });
  if (SEVERITY[phaseAfter] <= SEVERITY[phaseBefore]) return null;
  if (!(ALERT_PHASES as readonly string[]).includes(phaseAfter)) return null;

  const phase = phaseAfter as BossAlertPhase;
  const pct = Math.round((after / total) * 100);
  const battleTitle = (input.battleTitle ?? "").trim() || "O chefão";
  const copy = COPY[phase](battleTitle, pct);

  return {
    battleId: input.battleId,
    phase,
    title: copy.title,
    message: copy.message,
    dedupeKey: buildBossAlertDedupeKey(input.battleId, phase),
    url: "/chefao",
    hpPercent: pct,
  };
}

/**
 * Aplica um alerta sobre um "banco" em memória de chaves já enviadas.
 * Espelha o `ON CONFLICT DO NOTHING` da fila `push_outbox`.
 */
export function applyBossAlert(
  sentKeys: Set<string>,
  alert: BossAlert | null,
): { sent: boolean; duplicate: boolean } {
  if (!alert) return { sent: false, duplicate: false };
  if (sentKeys.has(alert.dedupeKey)) return { sent: false, duplicate: true };
  sentKeys.add(alert.dedupeKey);
  return { sent: true, duplicate: false };
}