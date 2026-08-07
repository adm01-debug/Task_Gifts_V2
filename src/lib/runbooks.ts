// Automated runbooks per alert type. Linked from /admin/burn-rate and /admin/error-budget.

export interface RunbookStep {
  title: string;
  detail: string;
  cmd?: string;
}

export interface Runbook {
  slug: string;
  title: string;
  severity: "critical" | "high" | "warning";
  summary: string;
  owner: string;
  sloImpact: string;
  diagnose: RunbookStep[];
  mitigate: RunbookStep[];
  recover: RunbookStep[];
  postmortem: string[];
  relatedLinks: { label: string; href: string }[];
}

const commonWebhookLinks = [
  { label: "Burn Rate (multi-window)", href: "/admin/burn-rate" },
  { label: "Error Budget 30d", href: "/admin/error-budget" },
  { label: "Reliability SLO", href: "/admin/reliability" },
];

const predictionLinks = [
  { label: "Admin de Previsões", href: "/previsoes/admin" },
  { label: "Central de Segurança", href: "/admin/security" },
];

/**
 * Converte o `alert_type` gravado em `security_alerts` no slug da rota
 * `/admin/runbook/:type`. A convenção do projeto é underscore → hífen.
 */
export function alertTypeToRunbookSlug(alertType: string): string {
  return alertType.replace(/_/g, "-");
}

export const RUNBOOKS: Record<string, Runbook> = {
  "burn-rate-fast": {
    slug: "burn-rate-fast",
    title: "Burn Rate Rápido (1h ∧ 5min ≥ 14.4x)",
    severity: "critical",
    summary:
      "Ambas as janelas do par rápido cruzaram o threshold. O SLO 99% será totalmente queimado em ~2h se nada for feito.",
    owner: "SRE on-call · Backend lead",
    sloImpact: "Consome ~2% do budget mensal a cada 1h — page imediatamente o on-call.",
    diagnose: [
      { title: "Confirmar a superfície", detail: "Ver qual serviço (webhooks vs API externa) está acima do threshold no dashboard.", cmd: "/admin/burn-rate" },
      { title: "Isolar tipo de erro", detail: "Agrupar falhas por status HTTP e endpoint nos últimos 15 min." },
      { title: "Correlacionar deploy/mudanças", detail: "Verificar se houve deploy, rotação de secret ou mudança de infra recente." },
    ],
    mitigate: [
      { title: "Rollback imediato", detail: "Se houve deploy nas últimas 2h, reverter para a última tag estável." },
      { title: "Feature flag off", detail: "Desativar flags recentes que tocam o serviço afetado." },
      { title: "Circuit breaker", detail: "Se o problema é em provedor externo, habilitar fallback/degradação graciosa." },
    ],
    recover: [
      { title: "Reprocessar fila", detail: "Após estabilização, reprocessar webhooks que falharam via retry manual." },
      { title: "Validar burn rate < threshold", detail: "Aguardar 15 min e confirmar que ambas as janelas voltaram ao verde." },
    ],
    postmortem: [
      "Registrar timeline (detecção, mitigação, recuperação).",
      "Classificar causa raiz (deploy, provider, capacidade, configuração).",
      "Definir ações corretivas com dono e prazo.",
    ],
    relatedLinks: commonWebhookLinks,
  },
  "burn-rate-slow": {
    slug: "burn-rate-slow",
    title: "Burn Rate Lento (6h ∧ 30min ≥ 6x)",
    severity: "high",
    summary:
      "Degradação sustentada. O par lento indica erro crônico — ainda há orçamento, mas se ignorado consome o mês.",
    owner: "Backend lead · Squad dona do serviço",
    sloImpact: "Consome ~30% do budget mensal em 6h. Investigar dentro de 1 turno.",
    diagnose: [
      { title: "Identificar padrão", detail: "Erros são constantes ou em picos? Um endpoint específico ou todos?" },
      { title: "Comparar com baseline", detail: "Ver taxa de erro dos últimos 7 dias no dashboard de Reliability.", cmd: "/admin/reliability" },
      { title: "Verificar dependências", detail: "Latência/erros nos provedores externos (Bitrix, gateways) via logs." },
    ],
    mitigate: [
      { title: "Aumentar retries com backoff", detail: "Se falhas são transientes, ajustar política de retry no worker." },
      { title: "Escalar recursos", detail: "Se saturação, aumentar pool/timeouts no serviço." },
    ],
    recover: [
      { title: "Monitorar 6h", detail: "Confirmar que o burn rate lento cai sustentadamente abaixo de 6x." },
    ],
    postmortem: [
      "Documentar a causa e criar issue de melhoria.",
      "Avaliar se o SLO 99% ainda é apropriado para o serviço.",
    ],
    relatedLinks: commonWebhookLinks,
  },
  "error-budget-critical": {
    slug: "error-budget-critical",
    title: "Error Budget Crítico (≥ 90% consumido)",
    severity: "critical",
    summary:
      "Mais de 90% do orçamento mensal foi queimado. Política: congelar releases não-essenciais até estabilizar.",
    owner: "Eng Manager · SRE on-call",
    sloImpact: "Risco alto de missar o SLO mensal. Cada nova falha impacta contratos.",
    diagnose: [
      { title: "Ver queima diária", detail: "Analisar gráfico de falhas dos últimos 30d para identificar o dia inflexão.", cmd: "/admin/error-budget" },
      { title: "Top ofensores", detail: "Listar top 5 endpoints/eventos que geraram mais falhas no período." },
    ],
    mitigate: [
      { title: "Change freeze", detail: "Congelar deploys não críticos. Apenas correções de estabilidade." },
      { title: "Priorizar correções", detail: "Mover trabalhos de estabilização para o topo do backlog." },
    ],
    recover: [
      { title: "Reduzir burn diário", detail: "Meta: manter falhas diárias abaixo do budget diário até o reset mensal." },
    ],
    postmortem: [
      "Retrospectiva com todo o time.",
      "Reavaliar SLO e prioridades do quarter.",
    ],
    relatedLinks: commonWebhookLinks,
  },
  "error-budget-high": {
    slug: "error-budget-high",
    title: "Error Budget Alto (≥ 75% consumido)",
    severity: "high",
    summary: "Sinal amarelo forte. Reduzir mudanças arriscadas e investigar as maiores fontes de falha.",
    owner: "Tech Lead",
    sloImpact: "Ainda há folga, mas trajetória atual leva ao crítico em <7d.",
    diagnose: [
      { title: "Ver tendência", detail: "Comparar queima da última semana com as anteriores." },
    ],
    mitigate: [
      { title: "Revisar deploys pendentes", detail: "Adiar mudanças estruturais até a queima cair." },
    ],
    recover: [
      { title: "Monitorar diário", detail: "Reavaliar em 48h." },
    ],
    postmortem: ["Se voltou ao normal, documentar o que ajudou."],
    relatedLinks: commonWebhookLinks,
  },
  "prediction-lock-overdue": {
    slug: "prediction-lock-overdue",
    title: "Mercado de previsão vencido continua aberto",
    severity: "critical",
    summary:
      "O mercado passou do horário de travamento e ainda aceita aportes. Enquanto isso, qualquer pessoa que já conheça o resultado pode apostar com risco zero e drenar o pote dos demais.",
    owner: "Admin de Gamificação · Backend on-call",
    sloImpact:
      "Risco econômico direto: cada minuto extra permite aportes informados. Trave manualmente antes de qualquer investigação.",
    diagnose: [
      {
        title: "Conferir o mercado no painel",
        detail:
          "Abrir o admin de previsões e localizar o mercado sinalizado. Confirmar o horário de travamento e o pote acumulado.",
        cmd: "/previsoes/admin",
      },
      {
        title: "Verificar se o agendamento está vivo",
        detail:
          "A rotina auto_lock_prediction_markets roda a cada 5 minutos. Se vários mercados estão atrasados ao mesmo tempo, o problema é o agendador, não o mercado.",
      },
      {
        title: "Identificar aportes suspeitos",
        detail:
          "Listar os aportes registrados após o horário de travamento — eles são o material da eventual reversão.",
      },
    ],
    mitigate: [
      {
        title: "Travar manualmente",
        detail:
          'Acionar a ação "Travar" no painel. Isso interrompe imediatamente novos aportes e é seguro mesmo com o cron degradado.',
        cmd: "/previsoes/admin",
      },
      {
        title: "Se o agendador caiu, travar todos os vencidos",
        detail:
          "Repetir a ação para cada mercado sinalizado antes de investigar a causa raiz do agendamento.",
      },
    ],
    recover: [
      {
        title: "Decidir sobre os aportes tardios",
        detail:
          "Sem indício de informação privilegiada, manter os aportes. Havendo indício, anular o mercado — a anulação reembolsa 100% dos participantes sem reter taxa.",
      },
      {
        title: "Confirmar o silêncio do alerta",
        detail:
          "A vigilância roda a cada 15 minutos. Após o travamento, nenhum novo alerta deste tipo deve surgir para o mercado.",
      },
    ],
    postmortem: [
      "Registrar por quanto tempo o mercado ficou aberto além do previsto e quantas moedas estavam em risco.",
      "Se o agendador falhou, tratar a causa raiz — o travamento manual é contenção, não correção.",
      "Avaliar se a tolerância de 15 minutos é adequada para o volume atual.",
    ],
    relatedLinks: predictionLinks,
  },
  "prediction-settlement-overdue": {
    slug: "prediction-settlement-overdue",
    title: "Mercado de previsão travado sem apuração",
    severity: "high",
    summary:
      "O mercado está travado há mais de 24h sem resultado definido. As moedas dos participantes seguem imobilizadas e a confiança no formato cai a cada hora.",
    owner: "Admin de Gamificação",
    sloImpact:
      "Não afeta disponibilidade, mas imobiliza saldo real dos usuários. Resolver dentro de um turno.",
    diagnose: [
      {
        title: "Verificar se o resultado já é conhecido",
        detail:
          "A causa mais comum é operacional: o resultado existe no mundo real, mas ninguém apurou no sistema.",
        cmd: "/previsoes/admin",
      },
      {
        title: "Checar ambiguidade do enunciado",
        detail:
          "Se o resultado é disputável ou o evento não ocorreu, o caminho correto é a anulação, não uma apuração forçada.",
      },
      {
        title: "Medir o impacto",
        detail:
          "O alerta traz as moedas imobilizadas e as horas de atraso — use esses números para priorizar entre mercados.",
      },
    ],
    mitigate: [
      {
        title: "Apurar com o resultado real",
        detail:
          "Selecionar a opção vencedora no painel. O rateio distribui o pote proporcionalmente aos acertadores, já descontada a taxa configurada.",
      },
      {
        title: "Anular quando não houver resultado claro",
        detail:
          "A anulação devolve o valor integral a cada participante, sem retenção de taxa. Prefira anular a apurar com dúvida.",
      },
    ],
    recover: [
      {
        title: "Conferir a trilha auditável",
        detail:
          "Toda apuração ou anulação grava automaticamente autor, opção vencedora, pote e taxa. Confirme o registro no painel.",
      },
      {
        title: "Validar os saldos",
        detail:
          "Amostrar dois ou três participantes e confirmar que o crédito bateu com o rateio esperado.",
      },
    ],
    postmortem: [
      "Se o atraso foi por enunciado ambíguo, corrigir o modelo de criação para exigir critério objetivo de resolução.",
      "Se foi esquecimento, definir dono nomeado para apuração no momento da criação do mercado.",
    ],
    relatedLinks: predictionLinks,
  },
};

export function getRunbook(slug: string): Runbook | undefined {
  return RUNBOOKS[slug];
}