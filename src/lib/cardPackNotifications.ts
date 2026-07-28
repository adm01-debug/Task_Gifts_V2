/**
 * Copy e idempotência da **notificação de pacote de cartas**.
 *
 * Espelha o gatilho `trg_card_pack_notify` para que a mensagem entregue ao
 * colaborador possa ser simulada e revisada sem depender do banco.
 *
 * Decisões de projeto:
 *
 * 1. **Uma notificação por pacote, nunca por evento.** A chave é o `id` do
 *    pacote — que já é único por (usuário, evento) graças à `dedupe_key` do
 *    `card_packs`. Assim, reprocessar o evento de origem não gera segundo push.
 * 2. **Copy contextual.** "Você ganhou um pacote" sem contexto vira ruído; o
 *    colaborador precisa saber *o que fez* para ganhar, senão o gatilho não
 *    reforça o comportamento desejado.
 * 3. **Texto truncado no motor**, com os mesmos limites do `enqueue_push`
 *    (120 no título, 400 na mensagem), para que a simulação não aprove um
 *    texto que o banco cortaria.
 */

import type { CardPackSource } from "./cardPackTriggers";

export const PUSH_TYPE_CARD_PACK = "card_pack";
export const PUSH_TITLE_MAX = 120;
export const PUSH_MESSAGE_MAX = 400;
export const CARD_PACK_URL = "/album";

export interface CardPackPushPayload {
  type: string;
  title: string;
  message: string;
  url: string;
  dedupeKey: string;
  data: { pack_id: string; source: CardPackSource; size: number };
}

const REASON_BY_SOURCE: Readonly<Record<CardPackSource, string>> = {
  task: "por entregar sua tarefa no prazo",
  training: "por concluir uma trilha de aprendizagem",
  streak: "pela sua sequência de presença pontual",
  quest: "por completar uma missão",
  campaign: "pela sua participação na campanha",
  manual: "como reconhecimento da liderança",
};

function truncate(value: string, max: number): string {
  return value.length <= max ? value : value.slice(0, max);
}

/** Plural correto — detalhe pequeno que separa produto cuidado de produto tosco. */
function cardsLabel(size: number): string {
  const n = Math.max(1, Math.trunc(Number.isFinite(size) ? size : 1));
  return n === 1 ? "1 carta" : `${n} cartas`;
}

export interface CardPackRow {
  id: string;
  userId: string;
  source: CardPackSource;
  size: number;
}

/** Monta o payload do push, ou `null` quando a linha é inutilizável. */
export function buildCardPackPush(pack: CardPackRow): CardPackPushPayload | null {
  const id = (pack.id ?? "").trim();
  const userId = (pack.userId ?? "").trim();
  if (id === "" || userId === "") return null;

  const reason = REASON_BY_SOURCE[pack.source];
  if (!reason) return null;

  const size = Math.max(1, Math.min(Math.trunc(pack.size) || 1, 20));

  return {
    type: PUSH_TYPE_CARD_PACK,
    title: truncate("Novo pacote de cartas!", PUSH_TITLE_MAX),
    message: truncate(
      `Você recebeu um pacote com ${cardsLabel(size)} ${reason}. Abra o álbum para revelar.`,
      PUSH_MESSAGE_MAX,
    ),
    url: CARD_PACK_URL,
    dedupeKey: `card_pack:${id}`,
    data: { pack_id: id, source: pack.source, size },
  };
}
