/**
 * Destino de navegacao de uma notificacao.
 *
 * A fonte da rota e' `data.url` (ou `data.deep_link`, o nome antigo que a
 * RPC do relatorio executivo usa). Varios tipos antigos gravaram apenas o
 * payload de negocio, entao o clique no painel nao fazia nada; o mapa abaixo
 * cobre esses tipos com a pagina que exibe o assunto.
 */
export const ROTA_POR_TIPO: Record<string, string> = {
  // O cartao do desafio semanal e a posicao no ranking global vivem no painel
  // inicial (DashboardRightColumn / DashboardHeader); nao ha pagina propria.
  challenge: "/",
  leaderboard: "/",
  rank_up: "/",
  rank_down: "/",
  // O radar de competencias esta no perfil; o PDI guarda o plano de acao.
  competency_gap: "/profile",
  development_tip: "/profile",
  competency_celebration: "/profile",
  achievement: "/conquistas",
  level_up: "/estatisticas",
  xp: "/estatisticas",
  quest: "/estatisticas",
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

function texto(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() !== "" ? valor : null;
}

export function resolveNotificationUrl(
  type: string,
  data?: Record<string, unknown> | null,
): string | null {
  const explicita = texto(data?.url);
  if (explicita) return explicita;

  // Resgate da loja chega como `achievement`: o historico de compras explica o
  // aviso melhor que a lista de emblemas.
  if (type === "achievement" && texto(data?.purchase_id)) return "/loja";

  // A tela do relatorio executivo le ?report=<id>; sem o parametro ela abre o
  // mes mais recente, que nao e' o mes do aviso.
  if (type === "executive_report") {
    const reportId = texto(data?.report_id);
    if (reportId) return `/admin/executive-report?report=${encodeURIComponent(reportId)}`;
  }

  return texto(data?.deep_link) ?? ROTA_POR_TIPO[type] ?? null;
}