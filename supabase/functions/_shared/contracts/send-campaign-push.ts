import { defineContract, destinoUrl, texto, uuid, z } from "./common.ts";

/**
 * `data` continua livre (o chamador manda `campaign_id`, `url` e outros metadados: `passthrough`
 * preserva tudo), mas o `milestone` tem formato declarado porque vira parte da chave de
 * deduplicacao da fila: objeto, array ou fracao aqui gerariam chave lixo ("[object Object]").
 */
const campaignPushData = z
  .object({ milestone: z.union([z.number().int(), texto(32)]).optional() })
  .passthrough();

/** Chamador: src/services/salesCampaignsService.ts. */
export const SendCampaignPushRequestSchema = z.object({
  user_ids: z.array(uuid).min(1).max(500),
  type: texto(64),
  title: texto(120),
  message: texto(400),
  // Caminho relativo é o caso real (salesCampaignsService.ts envia "/campanhas/<id>"):
  // com z.string().url() a função devolvia 422 e o push de campanha era descartado em silêncio.
  url: destinoUrl().optional(),
  data: campaignPushData.optional(),
});

export const SendCampaignPushResponseSchema = z.union([
  z.object({
    sent: z.number().int().nonnegative(),
    invalidated: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
  }),
  z.object({
    sent: z.literal(0),
    skipped: z.number().int().nonnegative(),
    reason: z.literal("prefs"),
  }),
]);

export const sendCampaignPushContract = defineContract({
  name: "send-campaign-push",
  methods: ["POST"],
  auth: "user",
  request: SendCampaignPushRequestSchema,
  response: SendCampaignPushResponseSchema,
  bodyRequired: true,
});
