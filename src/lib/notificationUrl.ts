/**
 * Destino de navegacao de uma notificacao.
 *
 * A fonte da rota e' sempre `data.url`, que a funcao que cria o aviso grava
 * (ex.: '/engajamento', '/clima'). Varios tipos antigos gravaram apenas o
 * payload de negocio (sem `url`), entao o clique no painel nao fazia nada;
 * o mapa abaixo cobre esses tipos com a pagina que exibe o assunto, e nao
 * substitui `data.url` quando ele existe.
 */
export const ROTA_POR_TIPO: Record<string, string> = {
  achievement: "/conquistas",
  competency_celebration: "/conquistas",
  level_up: "/estatisticas",
  xp: "/estatisticas",
  quest: "/estatisticas",
  leaderboard: "/leagues",
  rank_down: "/leagues",
  challenge: "/duelos",
  competency_gap: "/pdi",
  development_tip: "/pdi",
  auction: "/leilao",
  campaign_enrolled: "/campanhas",
  campaign_progress: "/campanhas",
  campaign_milestone: "/campanhas",
  campaign_completed: "/campanhas",
  campaign_closed: "/campanhas",
  climate_survey_reminder: "/clima",
  engagement_survey_reminder: "/engajamento",
  push_optin_aviso: "/profile",
  executive_report: "/admin/executive-report",
  security: "/security-dashboard",
  security_weekly_digest: "/admin/security-digests",
  security_digest: "/admin/security-digests",
};

export function resolveNotificationUrl(
  type: string,
  data?: Record<string, unknown> | null,
): string | null {
  const explicita = data?.url;
  if (typeof explicita === "string" && explicita.trim() !== "") return explicita;
  return ROTA_POR_TIPO[type] ?? null;
}