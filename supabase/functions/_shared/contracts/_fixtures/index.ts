import type { ContractFixtures } from "./types.ts";
import { UUID_A, UUID_B } from "./types.ts";

/**
 * Para funções SEM corpo (EmptyBodySchema): aceitam ausência/null/{}/objeto qualquer,
 * rejeitam string, número e array.
 */
export function emptyBodyFixtures(): ContractFixtures {
  return {
    valid: [
      { nome: "sem corpo (undefined)", payload: undefined },
      { nome: "null", payload: null },
      { nome: "objeto vazio", payload: {} },
      { nome: "objeto qualquer (ignorado)", payload: { foo: "bar", n: 1 } },
    ],
    missing: [],
    wrongType: [],
    empty: [],
    notObject: [
      { nome: "string", payload: "abc", field: "(body)", code: "invalid_type" },
      { nome: "número", payload: 42, field: "(body)", code: "invalid_type" },
      { nome: "array", payload: [1, 2], field: "(body)", code: "invalid_type" },
    ],
  };
}

const webhookDispatchFixtures: ContractFixtures = {
  valid: [
    {
      nome: "v1 ping do admin (WebhooksAdmin.tsx)",
      payload: { subscription_id: UUID_A, event_type: "test.ping", payload: { source: "webhooks-admin", message: "Payload de teste" } },
    },
    {
      nome: "v2 envelope completo",
      payload: { version: "v2", subscription_id: UUID_A, event: { type: "order.created", id: "evt_1", occurred_at: "2026-11-22T12:00:00Z" }, payload: { order_id: 10 }, metadata: { source: "erp" } },
    },
    { nome: "v2 mínimo", payload: { version: "v2", subscription_id: UUID_A, event: { type: "test.ping" }, payload: {} } },
    {
      nome: "v1 com version declarada explicitamente",
      payload: { version: "v1", subscription_id: UUID_A, event_type: "order.created", payload: { order_id: 10 } },
    },
  ],
  missing: [
    { nome: "v1 sem event_type", payload: { subscription_id: UUID_A, payload: {} }, field: "event_type", code: "invalid_type" },
    { nome: "v1 sem payload", payload: { subscription_id: UUID_A, event_type: "test.ping" }, field: "payload", code: "invalid_type" },
    { nome: "v2 sem event.type", payload: { version: "v2", subscription_id: UUID_A, event: {}, payload: {} }, field: "event.type", code: "invalid_type" },
    { nome: "v2 sem subscription_id", payload: { version: "v2", event: { type: "a.b" }, payload: {} }, field: "subscription_id", code: "invalid_type" },
  ],
  wrongType: [
    { nome: "v1 subscription_id não-uuid", payload: { subscription_id: "sub-1", event_type: "test.ping", payload: {} }, field: "subscription_id", code: "invalid_string" },
    { nome: "v1 payload como array", payload: { subscription_id: UUID_A, event_type: "test.ping", payload: [1] }, field: "payload", code: "invalid_type" },
    { nome: "v1 event_type fora do padrão", payload: { subscription_id: UUID_A, event_type: "ping test!", payload: {} }, field: "event_type", code: "invalid_string" },
    { nome: "v2 occurred_at inválido", payload: { version: "v2", subscription_id: UUID_A, event: { type: "a.b", occurred_at: "ontem" }, payload: {} }, field: "event.occurred_at", code: "invalid_string" },
    { nome: "v2 campo desconhecido no envelope", payload: { version: "v2", subscription_id: UUID_A, event: { type: "a.b" }, payload: {}, extra: 1 }, field: "(body)", code: "unrecognized_keys" },
  ],
  empty: [
    { nome: "v1 event_type vazio", payload: { subscription_id: UUID_A, event_type: "", payload: {} }, field: "event_type", code: "too_small" },
    { nome: "v2 event.type vazio", payload: { version: "v2", subscription_id: UUID_A, event: { type: "" }, payload: {} }, field: "event.type", code: "too_small" },
  ],
  notObject: [{ nome: "string", payload: "ping", field: "(body)", code: "invalid_type" }],
};

const FIXTURES: Record<string, ContractFixtures> = {
  "admin-alerts": emptyBodyFixtures(),
  "churn-prediction": emptyBodyFixtures(),
  "push-outbox-dispatcher": emptyBodyFixtures(),
  "push-public-key": emptyBodyFixtures(),
  "security-weekly-digest": emptyBodyFixtures(),
  "verify-ip": emptyBodyFixtures(),
  "migrate-helper": emptyBodyFixtures(),

  "ai-coach": {
    valid: [
      {
        nome: "chat com contexto (useAICoach.sendMessage)",
        payload: {
          messages: [{ role: "user", content: "Como ganho XP?" }],
          userContext: {
            displayName: "Ana", level: 3, xp: 1200, coins: 40, questsCompleted: 7, streak: 4,
            competencies: [{ area: "Colaboração", value: 55, maxValue: 100, icon: "🤝" }],
            availableTrails: [{ id: UUID_A, title: "Onboarding", description: null, icon: "📚", estimated_hours: 2, xp_reward: 100, enrolled: true, completed: false, progress: 30 }],
            completedTrailsCount: 1,
          },
        },
      },
      {
        nome: "pedido de sugestões (generateSuggestions)",
        payload: { messages: [{ role: "user", content: "oi" }, { role: "assistant", content: "olá" }], generateSuggestions: true },
      },
      { nome: "sem userContext", payload: { messages: [{ role: "user", content: "x" }] } },
    ],
    missing: [
      { nome: "sem messages", payload: { generateSuggestions: true }, field: "messages", code: "invalid_type" },
      { nome: "mensagem sem content", payload: { messages: [{ role: "user" }] }, field: "messages.0.content", code: "invalid_type" },
      { nome: "mensagem sem role", payload: { messages: [{ content: "x" }] }, field: "messages.0.role", code: "invalid_type" },
    ],
    wrongType: [
      { nome: "messages como string", payload: { messages: "oi" }, field: "messages", code: "invalid_type" },
      { nome: "role inválido", payload: { messages: [{ role: "robot", content: "x" }] }, field: "messages.0.role", code: "invalid_enum_value" },
      { nome: "generateSuggestions como string", payload: { messages: [{ role: "user", content: "x" }], generateSuggestions: "yes" }, field: "generateSuggestions", code: "invalid_type" },
      { nome: "userContext.level como string", payload: { messages: [{ role: "user", content: "x" }], userContext: { level: "3" } }, field: "userContext.level", code: "invalid_type" },
    ],
    empty: [
      { nome: "messages vazio", payload: { messages: [] }, field: "messages", code: "too_small" },
    ],
    notObject: [
      { nome: "array", payload: [{ role: "user", content: "x" }], field: "(body)", code: "invalid_type" },
    ],
  },

  "ai-course-builder": {
    valid: [{ nome: "job_id uuid (aiCourseBuilderService.triggerBuild)", payload: { job_id: UUID_A }, esperado: { job_id: UUID_A } }],
    missing: [{ nome: "sem job_id", payload: {}, field: "job_id", code: "invalid_type" }],
    wrongType: [
      { nome: "job_id número", payload: { job_id: 123 }, field: "job_id", code: "invalid_type" },
      { nome: "job_id não-uuid", payload: { job_id: "abc" }, field: "job_id", code: "invalid_string" },
    ],
    empty: [{ nome: "job_id vazio", payload: { job_id: "" }, field: "job_id", code: "invalid_string" }],
    notObject: [{ nome: "string", payload: UUID_A, field: "(body)", code: "invalid_type" }],
  },

  "competency-alerts": {
    valid: [
      { nome: "próprio usuário (useCompetencyAlerts.triggerAnalysis)", payload: { userId: UUID_A }, esperado: { userId: UUID_A } },
      { nome: "lote admin (triggerBatchAnalysis)", payload: { checkAllUsers: true }, esperado: { checkAllUsers: true } },
      { nome: "corpo vazio = usuário autenticado", payload: {}, esperado: {} },
    ],
    missing: [],
    wrongType: [
      { nome: "userId não-uuid", payload: { userId: "ana" }, field: "userId", code: "invalid_string" },
      { nome: "checkAllUsers string", payload: { checkAllUsers: "true" }, field: "checkAllUsers", code: "invalid_type" },
    ],
    empty: [{ nome: "userId vazio", payload: { userId: "" }, field: "userId", code: "invalid_string" }],
    notObject: [{ nome: "array", payload: [UUID_A], field: "(body)", code: "invalid_type" }],
  },

  "detect-new-device": {
    valid: [
      {
        nome: "registro completo (useDeviceDetection)",
        payload: { userId: UUID_A, fingerprint: "fp_abc123", userAgent: "Mozilla/5.0", browser: "Chrome", os: "Android", deviceType: "mobile" },
      },
      { nome: "mínimo (fingerprint + userAgent)", payload: { fingerprint: "fp", userAgent: "UA" }, esperado: { fingerprint: "fp", userAgent: "UA" } },
    ],
    missing: [
      { nome: "sem fingerprint", payload: { userAgent: "UA" }, field: "fingerprint", code: "invalid_type" },
      { nome: "sem userAgent", payload: { fingerprint: "fp" }, field: "userAgent", code: "invalid_type" },
    ],
    wrongType: [
      { nome: "fingerprint número", payload: { fingerprint: 1, userAgent: "UA" }, field: "fingerprint", code: "invalid_type" },
      { nome: "deviceType fora do enum", payload: { fingerprint: "fp", userAgent: "UA", deviceType: "tv" }, field: "deviceType", code: "invalid_enum_value" },
      { nome: "userId não-uuid", payload: { userId: "x", fingerprint: "fp", userAgent: "UA" }, field: "userId", code: "invalid_string" },
    ],
    empty: [
      { nome: "fingerprint vazio", payload: { fingerprint: "", userAgent: "UA" }, field: "fingerprint", code: "too_small" },
      { nome: "fingerprint só espaços", payload: { fingerprint: "   ", userAgent: "UA" }, field: "fingerprint", code: "too_small" },
    ],
    notObject: [{ nome: "string", payload: "fp", field: "(body)", code: "invalid_type" }],
  },

  "generate-quiz-questions": {
    valid: [
      { nome: "completo (AIQuestionGenerator)", payload: { trailId: UUID_A, quizType: "millionaire", questionCount: 7 }, esperado: { trailId: UUID_A, quizType: "millionaire", questionCount: 7 } },
      { nome: "só trailId (defaults)", payload: { trailId: UUID_A }, esperado: { trailId: UUID_A, quizType: "magic_cards", questionCount: 5 } },
    ],
    missing: [{ nome: "sem trailId", payload: { quizType: "magic_cards" }, field: "trailId", code: "invalid_type" }],
    wrongType: [
      { nome: "questionCount string", payload: { trailId: UUID_A, questionCount: "5" }, field: "questionCount", code: "invalid_type" },
      { nome: "questionCount decimal", payload: { trailId: UUID_A, questionCount: 5.5 }, field: "questionCount", code: "invalid_type" },
      { nome: "questionCount acima do limite", payload: { trailId: UUID_A, questionCount: 50 }, field: "questionCount", code: "too_big" },
      { nome: "quizType desconhecido", payload: { trailId: UUID_A, quizType: "trivia" }, field: "quizType", code: "invalid_enum_value" },
    ],
    empty: [{ nome: "trailId vazio", payload: { trailId: "" }, field: "trailId", code: "invalid_string" }],
    notObject: [{ nome: "número", payload: 5, field: "(body)", code: "invalid_type" }],
  },

  "push-device-revoked": {
    valid: [
      {
        nome: "broadcast de revogação (pushSubscriptionService)",
        payload: { exclude_subscription_id: UUID_A, title: "Dispositivo removido", message: "Um aparelho foi desconectado da sua conta.", url: "/security?tab=devices", data: { device: "iPhone" } },
      },
      { nome: "mínimo", payload: { exclude_subscription_id: UUID_A, title: "t", message: "m" }, esperado: { exclude_subscription_id: UUID_A, title: "t", message: "m" } },
    ],
    missing: [
      { nome: "sem exclude_subscription_id", payload: { title: "t", message: "m" }, field: "exclude_subscription_id", code: "invalid_type" },
      { nome: "sem message", payload: { exclude_subscription_id: UUID_A, title: "t" }, field: "message", code: "invalid_type" },
    ],
    wrongType: [
      { nome: "data como array", payload: { exclude_subscription_id: UUID_A, title: "t", message: "m", data: [1] }, field: "data", code: "invalid_type" },
      { nome: "exclude_subscription_id não-uuid", payload: { exclude_subscription_id: "1", title: "t", message: "m" }, field: "exclude_subscription_id", code: "invalid_string" },
      { nome: "title acima de 120", payload: { exclude_subscription_id: UUID_A, title: "x".repeat(121), message: "m" }, field: "title", code: "too_big" },
      { nome: "url com esquema javascript", payload: { exclude_subscription_id: UUID_A, title: "t", message: "m", url: "javascript:alert(1)" }, field: "url", code: "custom" },
    ],
    empty: [
      { nome: "title vazio", payload: { exclude_subscription_id: UUID_A, title: "", message: "m" }, field: "title", code: "too_small" },
      { nome: "message só espaços", payload: { exclude_subscription_id: UUID_A, title: "t", message: "  " }, field: "message", code: "too_small" },
      { nome: "url de destino só com espaços", payload: { exclude_subscription_id: UUID_A, title: "t", message: "m", url: "   " }, field: "url", code: "too_small" },
    ],
    notObject: [{ nome: "null", payload: null, field: "(body)", code: "invalid_type" }],
  },

  "reward-approval-review": {
    valid: [{ nome: "purchase_id (purchaseGovernanceService.analyzeRisk)", payload: { purchase_id: UUID_B }, esperado: { purchase_id: UUID_B } }],
    missing: [{ nome: "sem purchase_id", payload: {}, field: "purchase_id", code: "invalid_type" }],
    wrongType: [
      { nome: "purchase_id número", payload: { purchase_id: 7 }, field: "purchase_id", code: "invalid_type" },
      { nome: "purchase_id não-uuid", payload: { purchase_id: "pedido-1" }, field: "purchase_id", code: "invalid_string" },
    ],
    empty: [{ nome: "purchase_id vazio", payload: { purchase_id: "" }, field: "purchase_id", code: "invalid_string" }],
    notObject: [{ nome: "array", payload: [UUID_B], field: "(body)", code: "invalid_type" }],
  },

  "send-campaign-push": {
    valid: [
      {
        nome: "campanha completa (salesCampaignsService.ts:449 — url relativa, caso real)",
        payload: { user_ids: [UUID_A, UUID_B], type: "campaign_completed", title: "Meta batida!", message: "Sua equipe atingiu 100%.", url: `/campanhas/${UUID_A}`, data: { campaign_id: UUID_A } },
      },
      {
        nome: "url absoluta https",
        payload: { user_ids: [UUID_A], type: "t", title: "ti", message: "me", url: "https://task-gifts-v2.vercel.app/campanhas" },
      },
      { nome: "mínimo", payload: { user_ids: [UUID_A], type: "t", title: "ti", message: "me" }, esperado: { user_ids: [UUID_A], type: "t", title: "ti", message: "me" } },
    ],
    missing: [
      { nome: "sem user_ids", payload: { type: "t", title: "ti", message: "me" }, field: "user_ids", code: "invalid_type" },
      { nome: "sem title", payload: { user_ids: [UUID_A], type: "t", message: "me" }, field: "title", code: "invalid_type" },
    ],
    wrongType: [
      { nome: "user_ids string", payload: { user_ids: UUID_A, type: "t", title: "ti", message: "me" }, field: "user_ids", code: "invalid_type" },
      { nome: "user_ids com não-uuid", payload: { user_ids: [UUID_A, "x"], type: "t", title: "ti", message: "me" }, field: "user_ids.1", code: "invalid_string" },
      { nome: "url que não é caminho nem http(s)", payload: { user_ids: [UUID_A], type: "t", title: "ti", message: "me", url: "nao-e-url" }, field: "url", code: "custom" },
      { nome: "url com esquema javascript (XSS no clique do push)", payload: { user_ids: [UUID_A], type: "t", title: "ti", message: "me", url: "javascript:alert(1)" }, field: "url", code: "custom" },
      { nome: "url só com esquema, sem host", payload: { user_ids: [UUID_A], type: "t", title: "ti", message: "me", url: "https://" }, field: "url", code: "custom" },
      { nome: "url protocol-relative (sai do app)", payload: { user_ids: [UUID_A], type: "t", title: "ti", message: "me", url: "//evil.example.com/x" }, field: "url", code: "custom" },
      { nome: "mais de 500 destinatários", payload: { user_ids: Array.from({ length: 501 }, () => UUID_A), type: "t", title: "ti", message: "me" }, field: "user_ids", code: "too_big" },
    ],
    empty: [
      { nome: "user_ids vazio", payload: { user_ids: [], type: "t", title: "ti", message: "me" }, field: "user_ids", code: "too_small" },
      { nome: "message vazia", payload: { user_ids: [UUID_A], type: "t", title: "ti", message: "" }, field: "message", code: "too_small" },
    ],
    notObject: [{ nome: "string", payload: "push", field: "(body)", code: "invalid_type" }],
  },

  "trail-recommendations": {
    valid: [
      { nome: "userId (TrailRecommendations / TeamCompetencyDashboard)", payload: { userId: UUID_A }, esperado: { userId: UUID_A } },
      { nome: "corpo vazio = usuário autenticado", payload: {}, esperado: {} },
    ],
    missing: [],
    wrongType: [
      { nome: "userId número", payload: { userId: 1 }, field: "userId", code: "invalid_type" },
      { nome: "userId não-uuid", payload: { userId: "ana" }, field: "userId", code: "invalid_string" },
    ],
    empty: [{ nome: "userId vazio", payload: { userId: "" }, field: "userId", code: "invalid_string" }],
    notObject: [{ nome: "array", payload: [], field: "(body)", code: "invalid_type" }],
  },

  "webhook-dispatcher": webhookDispatchFixtures,
  "webhook-ping": webhookDispatchFixtures,
};

export function fixturesFor(name: string): ContractFixtures | undefined {
  return FIXTURES[name];
}

export const FIXTURE_NAMES = Object.keys(FIXTURES).sort();
