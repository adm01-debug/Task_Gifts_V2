/**
 * Motor puro de vigilancia de lideranca da Guerra de Departamentos.
 *
 * O placar vem do banco (fonte de verdade). Este modulo apenas compara dois
 * snapshots consecutivos e deriva eventos narrativos ("voce perdeu a lideranca",
 * "foi ultrapassado por X", "esta a 12 pts do 2o lugar"). Todas as funcoes sao
 * puras e deterministicas — o que permite simular centenas de cenarios hostis.
 */

export interface WarLeadInput {
  department_id: string;
  name: string;
  score: number;
  position: number;
}

export interface WarLeadSnapshot {
  /** Ordenado por posicao ascendente, ja saneado e deduplicado. */
  rows: WarLeadInput[];
  /** Momento da captura (ISO). Usado apenas para exibicao/debug. */
  capturedAt: string;
}

export type WarLeadEventKind =
  | "lead_taken" // meu departamento assumiu a lideranca
  | "lead_lost" // meu departamento perdeu a lideranca
  | "overtaken" // fui ultrapassado por alguem (sem ser o 1o lugar)
  | "overtook" // ultrapassei alguem
  | "threat" // rival colado atras de mim
  | "leader_changed"; // troca de lider entre terceiros

export type WarLeadSeverity = "critical" | "warning" | "positive" | "info";

export interface WarLeadEvent {
  /** Chave estavel — evita toasts duplicados no mesmo ciclo. */
  id: string;
  kind: WarLeadEventKind;
  severity: WarLeadSeverity;
  title: string;
  description: string;
  /** Departamento envolvido (rival ou novo lider), quando aplicavel. */
  rival: string | null;
  /** Diferenca de pontos relevante para o evento (sempre >= 0). */
  gap: number;
}

/** Rival dentro desta fracao do meu score e considerado ameaca iminente. */
const THREAT_RATIO = 0.05;
/** Ameaca so e anunciada acima deste score absoluto (evita ruido no inicio). */
const THREAT_MIN_SCORE = 1;

function toFiniteNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function toText(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed === "" ? fallback : trimmed;
}

/**
 * Normaliza o placar bruto em um snapshot confiavel.
 * Linhas sem `department_id` sao descartadas: sem identidade nao ha como
 * comparar posicoes entre ciclos, e um falso positivo geraria alerta fantasma.
 */
export function buildLeadSnapshot(raw: unknown, capturedAt = new Date().toISOString()): WarLeadSnapshot {
  const rows: WarLeadInput[] = [];
  if (Array.isArray(raw)) {
    const seen = new Set<string>();
    for (const entry of raw) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
      const row = entry as Record<string, unknown>;
      const id = typeof row.department_id === "string" ? row.department_id.trim() : "";
      if (!id || seen.has(id)) continue;
      seen.add(id);
      rows.push({
        department_id: id,
        name: toText(row.name, "Departamento"),
        score: Math.max(0, toFiniteNumber(row.score)),
        position: Math.max(1, Math.round(toFiniteNumber(row.position, rows.length + 1))),
      });
    }
  }

  // Reindexamos a posicao pelo score para nao confiar cegamente no campo vindo
  // do jsonb (empates e posicoes repetidas quebrariam a comparacao).
  rows.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.department_id < b.department_id ? -1 : 1;
  });
  rows.forEach((row, index) => {
    row.position = index + 1;
  });

  return { rows, capturedAt: typeof capturedAt === "string" ? capturedAt : "" };
}

function indexByDepartment(snapshot: WarLeadSnapshot): Map<string, WarLeadInput> {
  const map = new Map<string, WarLeadInput>();
  for (const row of snapshot.rows) map.set(row.department_id, row);
  return map;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Compara dois snapshots e devolve os eventos relevantes, priorizados.
 * `myDepartmentId` nulo => so eventos globais (troca de lider).
 */
export function detectLeadEvents(
  previous: WarLeadSnapshot | null,
  current: WarLeadSnapshot,
  myDepartmentId: string | null,
): WarLeadEvent[] {
  if (!previous || previous.rows.length === 0 || current.rows.length === 0) return [];

  const events: WarLeadEvent[] = [];
  const prevIndex = indexByDepartment(previous);
  const prevLeader = previous.rows[0];
  const nextLeader = current.rows[0];
  const mine = myDepartmentId ? current.rows.find((r) => r.department_id === myDepartmentId) ?? null : null;
  const minePrev = myDepartmentId ? prevIndex.get(myDepartmentId) ?? null : null;

  const leaderChanged = !!prevLeader && !!nextLeader && prevLeader.department_id !== nextLeader.department_id;

  if (leaderChanged && mine && minePrev) {
    if (nextLeader.department_id === mine.department_id) {
      const runnerUp = current.rows[1];
      events.push({
        id: `lead_taken:${mine.department_id}:${nextLeader.score}`,
        kind: "lead_taken",
        severity: "positive",
        title: "Seu departamento assumiu a liderança!",
        description: runnerUp
          ? `${mine.name} está ${round(mine.score - runnerUp.score)} pts à frente de ${runnerUp.name}.`
          : `${mine.name} lidera a guerra.`,
        rival: runnerUp?.name ?? null,
        gap: runnerUp ? Math.max(0, round(mine.score - runnerUp.score)) : 0,
      });
    } else if (prevLeader.department_id === mine.department_id) {
      events.push({
        id: `lead_lost:${nextLeader.department_id}:${nextLeader.score}`,
        kind: "lead_lost",
        severity: "critical",
        title: "Vocês perderam a liderança",
        description: `${nextLeader.name} assumiu o 1º lugar com ${round(nextLeader.score - mine.score)} pts de vantagem.`,
        rival: nextLeader.name,
        gap: Math.max(0, round(nextLeader.score - mine.score)),
      });
    }
  }

  if (leaderChanged && (!mine || (mine.department_id !== nextLeader.department_id && mine.department_id !== prevLeader.department_id))) {
    events.push({
      id: `leader_changed:${nextLeader.department_id}:${nextLeader.score}`,
      kind: "leader_changed",
      severity: "info",
      title: "Troca de líder na guerra",
      description: `${nextLeader.name} ultrapassou ${prevLeader.name} e assumiu o 1º lugar.`,
      rival: nextLeader.name,
      gap: Math.max(0, round(nextLeader.score - (prevIndex.get(prevLeader.department_id)?.score ?? 0))),
    });
  }

  // Ultrapassagens diretas (nao envolvendo o 1o lugar, ja narrado acima).
  if (mine && minePrev && mine.position !== minePrev.position) {
    const dropped = mine.position > minePrev.position;
    const rival = current.rows.find((row) => {
      if (row.department_id === mine.department_id) return false;
      const before = prevIndex.get(row.department_id);
      if (!before) return false;
      return dropped
        ? before.position > minePrev.position && row.position < mine.position
        : before.position < minePrev.position && row.position > mine.position;
    });

    if (rival && !events.some((e) => e.kind === "lead_lost" || e.kind === "lead_taken")) {
      events.push({
        id: `${dropped ? "overtaken" : "overtook"}:${rival.department_id}:${mine.position}`,
        kind: dropped ? "overtaken" : "overtook",
        severity: dropped ? "warning" : "positive",
        title: dropped ? `${rival.name} ultrapassou vocês` : `Vocês ultrapassaram ${rival.name}`,
        description: `Seu departamento agora está em ${mine.position}º lugar (antes ${minePrev.position}º).`,
        rival: rival.name,
        gap: Math.max(0, round(Math.abs(mine.score - rival.score))),
      });
    }
  }

  // Ameaca iminente: rival logo atras, colado no placar.
  if (mine && mine.score >= THREAT_MIN_SCORE) {
    const chaser = current.rows[mine.position]; // proxima posicao (0-based)
    if (chaser) {
      const gap = mine.score - chaser.score;
      if (gap >= 0 && gap <= mine.score * THREAT_RATIO && !events.some((e) => e.kind === "lead_lost")) {
        events.push({
          id: `threat:${chaser.department_id}:${round(gap)}`,
          kind: "threat",
          severity: "warning",
          title: "Rival colado no retrovisor",
          description: `${chaser.name} está a apenas ${round(gap)} pts de vocês.`,
          rival: chaser.name,
          gap: round(gap),
        });
      }
    }
  }

  return prioritizeLeadEvents(events);
}

const SEVERITY_ORDER: Record<WarLeadSeverity, number> = {
  critical: 0,
  warning: 1,
  positive: 2,
  info: 3,
};

/** Ordena por severidade e remove duplicatas por id. */
export function prioritizeLeadEvents(events: WarLeadEvent[]): WarLeadEvent[] {
  const seen = new Set<string>();
  const unique: WarLeadEvent[] = [];
  for (const event of events) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    unique.push(event);
  }
  return unique.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

/** Distancia para a posicao imediatamente acima — alimenta o card "falta pouco". */
export function pointsToNextPosition(
  snapshot: WarLeadSnapshot,
  myDepartmentId: string | null,
): { target: string; gap: number } | null {
  if (!myDepartmentId) return null;
  const index = snapshot.rows.findIndex((row) => row.department_id === myDepartmentId);
  if (index <= 0) return null;
  const above = snapshot.rows[index - 1];
  return { target: above.name, gap: Math.max(0, round(above.score - snapshot.rows[index].score)) };
}
