/**
 * Chave de dedupe dos avisos de campanha de vendas.
 *
 * O `campaign_id` sozinho nao identifica o aviso: os marcos de 25/50/75% e a
 * conclusao saem na mesma campanha, com o mesmo tipo, e `push_outbox.dedupe_key`
 * e' unica — o segundo aviso seria descartado em silencio. Por isso o conteudo
 * entra na chave. O sufixo com o id do usuario garante um aviso por pessoa.
 */
export interface CampaignPushDedupeInput {
  campaignId?: string | null;
  type: string;
  title: string;
  message: string;
  url?: string | null;
}

/** Limite da base antes do sufixo: 150 + ':' + uuid (36) = 187 caracteres. */
export const MAX_CAMPAIGN_DEDUPE_BASE = 150;

export function campaignPushDedupeKey(input: CampaignPushDedupeInput, userId: string): string {
  const base = [
    input.campaignId ?? "sem-campanha",
    input.type,
    input.title,
    input.message,
    input.url ?? "",
  ]
    .join("|")
    .slice(0, MAX_CAMPAIGN_DEDUPE_BASE);
  return `${base}:${userId}`;
}