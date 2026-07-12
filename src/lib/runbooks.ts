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
};

export function getRunbook(slug: string): Runbook | undefined {
  return RUNBOOKS[slug];
}