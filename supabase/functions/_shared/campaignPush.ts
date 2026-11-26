/**
 * Chave de dedupe dos avisos de campanha de vendas.
 *
 * O `campaign_id` sozinho nao identifica o aviso: os marcos de 25/50/75% e a
 * conclusao saem na mesma campanha, com o mesmo tipo, e `push_outbox.dedupe_key`
 * e' unica — o segundo aviso seria descartado em silencio. Por isso a chave usa a
 * identidade do aviso: o marco (`marker`) quando existe, o conteudo quando nao.
 * O sufixo com o id do usuario garante um aviso por pessoa.
 */
export interface CampaignPushDedupeInput {
  campaignId?: string | null;
  type: string;
  title: string;
  message: string;
  url?: string | null;
  /**
   * Identidade semantica do aviso dentro do tipo (ex.: `milestone: 50`). Com ela a
   * chave nao depende do texto, entao reenviar o mesmo marco com outro total nao
   * duplica o aviso.
   */
  marker?: string | number | null;
}

/** Limite da base antes do sufixo: 150 + ':' + uuid (36) = 187 caracteres. */
export const MAX_CAMPAIGN_DEDUPE_BASE = 150;

/**
 * Corta por ponto de codigo, nao por unidade UTF-16: cortar um emoji ao meio
 * produziria um surrogate solto, que o Postgres recusa — e o aviso rejeitado cai
 * para o envio na hora, dentro da janela de silencio. Era o bug do emoji no nome
 * da campanha exatamente na posicao do corte.
 */
export function truncateCodePoints(text: string, max: number): string {
  const pontos = Array.from(text);
  return pontos.length <= max ? text : pontos.slice(0, max).join("");
}

export function campaignPushDedupeKey(input: CampaignPushDedupeInput, userId: string): string {
  const temMarco = input.marker !== null && input.marker !== undefined && input.marker !== "";
  const partes = temMarco
    ? [input.campaignId ?? "sem-campanha", input.type, String(input.marker)]
    : [
        input.campaignId ?? "sem-campanha",
        input.type,
        input.title,
        input.message,
        input.url ?? "",
      ];
  const base = truncateCodePoints(partes.join("|"), MAX_CAMPAIGN_DEDUPE_BASE);
  return `${base}:${userId}`;
}