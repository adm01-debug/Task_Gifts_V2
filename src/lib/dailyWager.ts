/**
 * Motor puro da "Pergunta do Dia com Aposta".
 *
 * Toda a lógica de premiação real vive no servidor (RPC `submit_daily_wager`).
 * Aqui apenas saneamos o payload e derivamos números para a interface —
 * usando exatamente as mesmas regras de arredondamento do banco para que a
 * prévia mostrada ao usuário nunca divirja do resultado creditado.
 */

export interface WagerOption {
  id: string;
  label: string;
}

export interface DailyWagerQuestion {
  id: string;
  question: string;
  options: WagerOption[];
  difficulty: "easy" | "medium" | "hard";
  multiplier: number;
  maxStake: number;
  scheduledDate: string | null;
  /** Só chega preenchido depois que o usuário aposta. */
  correctOption: string | null;
  explanation: string | null;
}

export interface DailyWagerEntry {
  id: string;
  stakeCoins: number;
  chosenOption: string;
  isCorrect: boolean;
  multiplier: number;
  coinsDelta: number;
  xpAwarded: number;
  createdAt: string | null;
}

export interface DailyWagerState {
  question: DailyWagerQuestion | null;
  entry: DailyWagerEntry | null;
  balance: number;
}

const DIFFICULTIES = new Set(["easy", "medium", "hard"]);

/** Converte qualquer entrada de transporte em inteiro finito. */
function toInt(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

function toPositiveInt(value: unknown, fallback: number): number {
  const n = toInt(value, fallback);
  return n > 0 ? n : fallback;
}

function toMultiplier(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 2;
  // Espelha o CHECK do banco (1.10 .. 5.00).
  return Math.min(5, Math.max(1.1, Math.round(n * 100) / 100));
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Normaliza as alternativas descartando itens inválidos ou duplicados. */
export function parseWagerOptions(raw: unknown): WagerOption[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const options: WagerOption[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const id = toText(record.id);
    const label = toText(record.label) || id;
    if (!id || !label || seen.has(id)) continue;
    seen.add(id);
    options.push({ id, label });
  }
  return options;
}

/** Converte o retorno bruto da RPC `get_daily_wager` em estado tipado. */
export function parseDailyWager(raw: unknown): DailyWagerState {
  const empty: DailyWagerState = { question: null, entry: null, balance: 0 };
  if (!raw || typeof raw !== "object") return empty;

  const payload = raw as Record<string, unknown>;
  const balance = Math.max(0, toInt(payload.balance, 0));

  const rawQuestion = payload.question;
  if (!rawQuestion || typeof rawQuestion !== "object") return { ...empty, balance };

  const q = rawQuestion as Record<string, unknown>;
  const id = toText(q.id);
  const question = toText(q.question);
  const options = parseWagerOptions(q.options);
  // Sem id, enunciado ou pelo menos duas alternativas a rodada é injogável.
  if (!id || !question || options.length < 2) return { ...empty, balance };

  const difficultyRaw = toText(q.difficulty);
  const parsed: DailyWagerQuestion = {
    id,
    question,
    options,
    difficulty: (DIFFICULTIES.has(difficultyRaw) ? difficultyRaw : "medium") as
      | "easy"
      | "medium"
      | "hard",
    multiplier: toMultiplier(q.multiplier),
    maxStake: Math.min(1000, toPositiveInt(q.max_stake, 100)),
    scheduledDate: toText(q.scheduled_date) || null,
    correctOption: toText(q.correct_option) || null,
    explanation: toText(q.explanation) || null,
  };

  const rawEntry = payload.entry;
  let entry: DailyWagerEntry | null = null;
  if (rawEntry && typeof rawEntry === "object") {
    const e = rawEntry as Record<string, unknown>;
    const entryId = toText(e.id);
    const chosen = toText(e.chosen_option);
    if (entryId && chosen) {
      entry = {
        id: entryId,
        stakeCoins: Math.max(0, toInt(e.stake_coins, 0)),
        chosenOption: chosen,
        isCorrect: e.is_correct === true,
        multiplier: toMultiplier(e.multiplier),
        coinsDelta: toInt(e.coins_delta, 0),
        xpAwarded: Math.max(0, toInt(e.xp_awarded, 0)),
        createdAt: toText(e.created_at) || null,
      };
    }
  }

  return { question: parsed, entry, balance };
}

/** Teto real da aposta: limite da pergunta cruzado com o saldo disponível. */
export function maxAllowedStake(question: DailyWagerQuestion | null, balance: number): number {
  if (!question) return 0;
  return Math.max(0, Math.min(question.maxStake, Math.max(0, Math.trunc(balance))));
}

/** Mantém a aposta dentro de [1, teto]; devolve 0 quando não há teto. */
export function clampStake(
  stake: number,
  question: DailyWagerQuestion | null,
  balance: number,
): number {
  const max = maxAllowedStake(question, balance);
  if (max <= 0) return 0;
  const value = toInt(stake, 1);
  return Math.min(max, Math.max(1, value));
}

export interface WagerPreview {
  stake: number;
  /** Moedas ganhas em caso de acerto (idêntico ao cálculo do servidor). */
  gain: number;
  /** Moedas perdidas em caso de erro. */
  loss: number;
  balanceIfCorrect: number;
  balanceIfWrong: number;
}

/** Prévia determinística de ganho/perda, espelhando `FLOOR(stake * (mult - 1))`. */
export function previewWager(
  stake: number,
  question: DailyWagerQuestion | null,
  balance: number,
): WagerPreview {
  const safeStake = clampStake(stake, question, balance);
  const multiplier = question?.multiplier ?? 1;
  const gain = safeStake > 0 ? Math.floor(safeStake * (multiplier - 1)) : 0;
  const safeBalance = Math.max(0, Math.trunc(balance));
  return {
    stake: safeStake,
    gain,
    loss: safeStake,
    balanceIfCorrect: safeBalance + gain,
    balanceIfWrong: Math.max(0, safeBalance - safeStake),
  };
}

/** Sugestões rápidas de aposta (25%, 50%, 100% do teto), sem duplicatas. */
export function stakePresets(question: DailyWagerQuestion | null, balance: number): number[] {
  const max = maxAllowedStake(question, balance);
  if (max <= 0) return [];
  const raw = [Math.floor(max * 0.25), Math.floor(max * 0.5), max];
  return [...new Set(raw.map((v) => Math.max(1, v)))].sort((a, b) => a - b);
}

export const WAGER_REASON_MESSAGES: Record<string, string> = {
  unauthenticated: "Faça login para apostar.",
  not_found: "A pergunta do dia não está mais disponível.",
  invalid_option: "Escolha uma alternativa válida.",
  invalid_stake: "Valor de aposta fora do limite permitido.",
  insufficient_coins: "Saldo de moedas insuficiente para esta aposta.",
  already_answered: "Você já apostou na pergunta de hoje.",
  no_profile: "Perfil não encontrado.",
};

export function wagerReasonMessage(reason?: string | null): string {
  if (!reason) return "Não foi possível registrar sua aposta.";
  return WAGER_REASON_MESSAGES[reason] ?? "Não foi possível registrar sua aposta.";
}