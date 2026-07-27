/**
 * Motor puro do feed ao vivo da Guerra de Departamentos.
 *
 * O banco e a fonte de verdade dos dados; este modulo apenas normaliza a
 * resposta (que vem de um `jsonb`, portanto sem garantia de tipo) e deriva
 * apresentacao. Nenhuma funcao aqui faz IO — sao todas puras e deterministicas,
 * o que permite simular centenas de cenarios hostis em teste.
 */

export interface WarFeedItem {
  id: string;
  created_at: string;
  metric_key: string;
  metric_label: string;
  amount: number;
  points: number;
  department_id: string;
  department_name: string;
  actor: string;
  is_me: boolean;
}

export interface WarFeedPulse {
  /** Quantidade de eventos na janela analisada. */
  events: number;
  /** Pontos somados na janela analisada. */
  points: number;
  /** Departamentos distintos que pontuaram na janela. */
  departments: number;
  /** Departamento que mais pontuou na janela (nome), se houver. */
  leader: string | null;
}

const MAX_ITEMS = 100;

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

function toTimestamp(value: unknown): string {
  if (typeof value !== "string") return "";
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? value : "";
}

/**
 * Converte um item bruto do `jsonb` em um item tipado e seguro.
 * Retorna `null` quando o registro nao tem identidade utilizavel — descartar
 * e melhor que renderizar uma linha fantasma sem `key` estavel.
 */
export function normalizeFeedItem(raw: unknown): WarFeedItem | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const id = typeof row.id === "string" ? row.id.trim() : "";
  if (!id) return null;

  return {
    id,
    created_at: toTimestamp(row.created_at),
    metric_key: toText(row.metric_key, "desconhecida"),
    metric_label: toText(row.metric_label, toText(row.metric_key, "Pontuação")),
    amount: Math.max(0, toFiniteNumber(row.amount)),
    points: Math.max(0, toFiniteNumber(row.points)),
    department_id: typeof row.department_id === "string" ? row.department_id : "",
    department_name: toText(row.department_name, "Departamento"),
    actor: toText(row.actor, "Colaborador"),
    is_me: row.is_me === true,
  };
}

/** Normaliza a lista inteira: descarta lixo, deduplica por id e ordena do mais recente. */
export function normalizeFeed(raw: unknown): WarFeedItem[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const items: WarFeedItem[] = [];

  for (const entry of raw) {
    const item = normalizeFeedItem(entry);
    if (!item || seen.has(item.id)) continue;
    seen.add(item.id);
    items.push(item);
    if (items.length >= MAX_ITEMS) break;
  }

  return items.sort((a, b) => {
    const diff = Date.parse(b.created_at || "") - Date.parse(a.created_at || "");
    if (Number.isFinite(diff) && diff !== 0) return diff;
    // Empate (ou datas invalidas): ordem estavel por id evita "pulos" na UI.
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

/** Resumo da janela recente — alimenta o cabecalho do feed. */
export function summarizeFeed(items: WarFeedItem[]): WarFeedPulse {
  const byDepartment = new Map<string, { name: string; points: number }>();
  let points = 0;

  for (const item of items) {
    points += item.points;
    const key = item.department_id || item.department_name;
    const current = byDepartment.get(key);
    if (current) {
      current.points += item.points;
    } else {
      byDepartment.set(key, { name: item.department_name, points: item.points });
    }
  }

  let leader: string | null = null;
  let best = -1;
  for (const entry of byDepartment.values()) {
    if (entry.points > best) {
      best = entry.points;
      leader = entry.name;
    }
  }

  return {
    events: items.length,
    points: Math.round(points * 100) / 100,
    departments: byDepartment.size,
    leader: items.length > 0 ? leader : null,
  };
}

/** Tempo relativo curto em pt-BR, tolerante a datas invalidas ou no futuro. */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const parsed = Date.parse(iso || "");
  if (!Number.isFinite(parsed)) return "agora";
  const seconds = Math.floor((now - parsed) / 1000);
  if (seconds < 45) return "agora";
  if (seconds < 90) return "1 min";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} d`;
  return new Date(parsed).toLocaleDateString("pt-BR");
}