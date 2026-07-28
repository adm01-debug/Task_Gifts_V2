/**
 * Validação pura da autoria de baralhos do Jogo da Memória.
 *
 * Regra de negócio: um baralho só é jogável com pares suficientes e sem
 * ambiguidade — dois pares com o mesmo texto tornariam o pareamento
 * indeterminado (duas cartas "corretas" para a mesma face).
 */

export const MEMORY_MIN_PAIRS = 4;
export const MEMORY_MAX_PAIRS_PER_DECK = 40;
export const MEMORY_TITLE_MAX = 80;
export const MEMORY_DESCRIPTION_MAX = 240;
export const MEMORY_CARD_TEXT_MAX = 60;

export interface DeckDraft {
  title: string;
  description?: string | null;
  departmentId?: string | null;
  isActive: boolean;
}

export interface PairDraft {
  /** Ausente em pares ainda não persistidos. */
  id?: string;
  term: string;
  match: string;
}

export interface ValidationIssue {
  /** `deck` para o cabeçalho, ou o índice do par (`pair:0`). */
  scope: string;
  message: string;
}

export interface DeckValidation {
  valid: boolean;
  issues: ValidationIssue[];
  /** Pares normalizados (trim + colapso de espaços), prontos para persistir. */
  normalizedPairs: PairDraft[];
  /** Quantos pares utilizáveis restam após descartar linhas vazias. */
  usablePairs: number;
}

/** Normaliza texto de carta: remove espaços redundantes nas pontas e no meio. */
export function normalizeCardText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Chave de comparação para detectar duplicidade (case/acento-insensível). */
export function comparisonKey(value: string): string {
  return normalizeCardText(value)
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isBlank(value: string): boolean {
  return normalizeCardText(value).length === 0;
}

/**
 * Valida o rascunho completo. Linhas totalmente em branco são ignoradas
 * (o autor costuma deixar a última linha vazia); linhas pela metade são erro.
 */
export function validateDeckDraft(
  deck: DeckDraft,
  pairs: ReadonlyArray<PairDraft>,
): DeckValidation {
  const issues: ValidationIssue[] = [];
  const title = normalizeCardText(deck.title);
  const description = normalizeCardText(deck.description ?? "");

  if (title.length === 0) {
    issues.push({ scope: "deck", message: "Informe um título para o baralho." });
  } else if (title.length > MEMORY_TITLE_MAX) {
    issues.push({
      scope: "deck",
      message: `O título deve ter no máximo ${MEMORY_TITLE_MAX} caracteres.`,
    });
  }

  if (description.length > MEMORY_DESCRIPTION_MAX) {
    issues.push({
      scope: "deck",
      message: `A descrição deve ter no máximo ${MEMORY_DESCRIPTION_MAX} caracteres.`,
    });
  }

  const normalizedPairs: PairDraft[] = [];
  const seenTerms = new Map<string, number>();
  const seenMatches = new Map<string, number>();

  pairs.forEach((pair, index) => {
    const term = normalizeCardText(pair.term ?? "");
    const match = normalizeCardText(pair.match ?? "");
    const scope = `pair:${index}`;

    // Linha completamente vazia: descartada em silêncio.
    if (term.length === 0 && match.length === 0) return;

    if (term.length === 0 || match.length === 0) {
      issues.push({ scope, message: "Preencha os dois lados do par." });
      return;
    }
    if (term.length > MEMORY_CARD_TEXT_MAX || match.length > MEMORY_CARD_TEXT_MAX) {
      issues.push({
        scope,
        message: `Cada carta deve ter no máximo ${MEMORY_CARD_TEXT_MAX} caracteres.`,
      });
      return;
    }

    const termKey = comparisonKey(term);
    const matchKey = comparisonKey(match);

    if (termKey === matchKey) {
      issues.push({ scope, message: "Os dois lados do par não podem ser iguais." });
      return;
    }
    if (seenTerms.has(termKey)) {
      issues.push({
        scope,
        message: `Termo repetido (igual ao par ${(seenTerms.get(termKey) ?? 0) + 1}).`,
      });
      return;
    }
    if (seenMatches.has(matchKey)) {
      issues.push({
        scope,
        message: `Correspondência repetida (igual ao par ${(seenMatches.get(matchKey) ?? 0) + 1}).`,
      });
      return;
    }

    seenTerms.set(termKey, index);
    seenMatches.set(matchKey, index);
    normalizedPairs.push({ ...(pair.id ? { id: pair.id } : {}), term, match });
  });

  if (normalizedPairs.length < MEMORY_MIN_PAIRS) {
    issues.push({
      scope: "deck",
      message: `Cadastre pelo menos ${MEMORY_MIN_PAIRS} pares válidos (atualmente ${normalizedPairs.length}).`,
    });
  }
  if (normalizedPairs.length > MEMORY_MAX_PAIRS_PER_DECK) {
    issues.push({
      scope: "deck",
      message: `Um baralho aceita no máximo ${MEMORY_MAX_PAIRS_PER_DECK} pares.`,
    });
  }

  return {
    valid: issues.length === 0,
    issues,
    normalizedPairs,
    usablePairs: normalizedPairs.length,
  };
}

export interface PairDiff {
  toInsert: PairDraft[];
  toUpdate: Array<Required<Pick<PairDraft, "id">> & PairDraft>;
  toDeleteIds: string[];
  unchanged: number;
}

/**
 * Diff mínimo entre o estado persistido e o rascunho — evita reescrever a
 * tabela inteira a cada salvamento e preserva os ids (e a auditoria) dos
 * pares que não mudaram.
 */
export function diffPairs(
  existing: ReadonlyArray<Required<Pick<PairDraft, "id">> & PairDraft>,
  draft: ReadonlyArray<PairDraft>,
): PairDiff {
  const existingById = new Map(existing.map((p) => [p.id, p]));
  const keptIds = new Set<string>();
  const diff: PairDiff = { toInsert: [], toUpdate: [], toDeleteIds: [], unchanged: 0 };

  for (const pair of draft) {
    const term = normalizeCardText(pair.term ?? "");
    const match = normalizeCardText(pair.match ?? "");
    if (term.length === 0 || match.length === 0) continue;

    const current = pair.id ? existingById.get(pair.id) : undefined;
    if (!current) {
      diff.toInsert.push({ term, match });
      continue;
    }
    keptIds.add(current.id);
    if (normalizeCardText(current.term) === term && normalizeCardText(current.match) === match) {
      diff.unchanged += 1;
    } else {
      diff.toUpdate.push({ id: current.id, term, match });
    }
  }

  for (const pair of existing) {
    if (!keptIds.has(pair.id)) diff.toDeleteIds.push(pair.id);
  }
  return diff;
}