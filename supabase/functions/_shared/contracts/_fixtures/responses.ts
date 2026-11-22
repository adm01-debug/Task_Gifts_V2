// Amostras do CORPO de resposta de cada função, copiadas do `return` real do handler. Servem para o
// `registry.contract.spec.ts` provar que o `response` do contrato descreve o que a função devolve
// (o teste anterior só checava que uma string não passa no schema — não provava nada).
//
// O schema de resposta descreve o corpo, não o status: o `webhook-dispatcher` usa o MESMO corpo em
// 200 e em 502 (`success: false` quando a entrega falhou), então as duas amostras são válidas aqui.
// Nenhum destes testes executa o handler nem verifica status HTTP.
import { UUID_A, UUID_B } from "./types.ts";

export interface ResponseFixtures {
  /** Corpos que o handler realmente devolve em resposta de sucesso da função (devem passar). */
  valid: Array<{ nome: string; payload: unknown }>;
  /** Corpos fora do contrato (devem falhar). */
  invalid: Array<{ nome: string; payload: unknown }>;
}

const RESPONSES: Record<string, ResponseFixtures> = {
  // admin-alerts/index.ts:200 → new Response(JSON.stringify({ alerts }))
  "admin-alerts": {
    valid: [
      { nome: "alertas ordenados por severidade", payload: { alerts: [
        { type: "inactive_users", severity: "high", title: "Usuários Inativos", message: "12 usuário(s) não acessam há mais de 7 dias", affectedUsers: 12, data: { users: [] } },
        { type: "low_attendance", severity: "medium", title: "Taxa de Check-in Baixa", message: "Apenas 41.0% fizeram check-in hoje", data: { rate: 41, checkins: 9, total: 22 } },
      ] } },
      { nome: "sem alertas", payload: { alerts: [] } },
    ],
    invalid: [
      { nome: "severidade fora do enum", payload: { alerts: [{ type: "x", severity: "urgente", title: "t", message: "m" }] } },
      { nome: "sem a chave alerts", payload: {} },
    ],
  },

  // ai-coach/index.ts:116 → { suggestions }
  "ai-coach": {
    valid: [
      { nome: "3 sugestões de follow-up", payload: { suggestions: ["Como ganho XP?", "Quais trilhas fazer?", "Como subir de liga?"] } },
      { nome: "falha do provedor devolve lista vazia", payload: { suggestions: [] } },
    ],
    invalid: [{ nome: "suggestions como string", payload: { suggestions: "Como ganho XP?" } }],
  },

  // ai-course-builder/index.ts:300 → { success: true, trail_id, modules, questions }
  "ai-course-builder": {
    valid: [{ nome: "trilha gerada", payload: { success: true, trail_id: UUID_A, modules: 5, questions: 10 } }],
    invalid: [
      { nome: "success false (o handler devolve erro, não 2xx)", payload: { success: false, trail_id: UUID_A, modules: 0, questions: 0 } },
      { nome: "contadores negativos", payload: { success: true, trail_id: UUID_A, modules: -1, questions: 3 } },
    ],
  },

  // churn-prediction/index.ts:290 → JSON do tool call (predictions + summary)
  "churn-prediction": {
    valid: [{ nome: "predições com resumo", payload: {
      predictions: [{ userId: UUID_A, displayName: "Ana", riskLevel: "high", riskScore: 82, riskIndicators: ["7 dias inativa"], interventionSuggestions: ["Convidar para trilha"], metrics: { daysInactive: 7, streak: 0 } }],
      summary: { totalAnalyzed: 22, highRiskCount: 1, mediumRiskCount: 3, overallHealthScore: 71 },
    } }],
    invalid: [
      { nome: "riskLevel low não é reportado", payload: { predictions: [{ userId: UUID_A, displayName: "Ana", riskLevel: "low", riskScore: 10, riskIndicators: [], interventionSuggestions: [] }], summary: {} } },
      { nome: "riskScore acima de 100", payload: { predictions: [{ userId: UUID_A, displayName: "Ana", riskLevel: "high", riskScore: 120, riskIndicators: [], interventionSuggestions: [] }], summary: {} } },
    ],
  },

  // competency-alerts/index.ts:345 → { success: true, analyzed, results }
  "competency-alerts": {
    valid: [{ nome: "análise de um usuário", payload: { success: true, analyzed: 1, results: [{ userId: UUID_A, gaps: ["Colaboração"], notificationsCreated: 1 }] } }],
    invalid: [{ nome: "results como objeto", payload: { success: true, analyzed: 1, results: { userId: UUID_A } } }],
  },

  // detect-new-device/index.ts:185 → { is_new_device, device_id, is_trusted }
  "detect-new-device": {
    valid: [
      { nome: "dispositivo novo", payload: { is_new_device: true, device_id: UUID_B, is_trusted: false } },
      { nome: "dispositivo conhecido sem id", payload: { is_new_device: false, device_id: null, is_trusted: true } },
    ],
    invalid: [{ nome: "is_new_device como string", payload: { is_new_device: "yes", is_trusted: false } }],
  },

  // generate-quiz-questions/index.ts:214 → { trail, quizType, questions }
  "generate-quiz-questions": {
    valid: [{ nome: "perguntas geradas", payload: {
      trail: { id: UUID_A, title: "Atendimento ao cliente" },
      quizType: "magic_cards",
      questions: [{ question: "Qual o primeiro passo?", difficulty: "easy", category: "Processos", explanation: "Porque…", options: [{ text: "A", is_correct: true }, { text: "B", is_correct: false }] }],
    } }],
    invalid: [
      { nome: "dificuldade fora do enum", payload: { trail: { id: UUID_A, title: "t" }, quizType: "magic_cards", questions: [{ question: "q", difficulty: "insana", options: [{ text: "A", is_correct: true }, { text: "B", is_correct: false }] }] } },
      { nome: "pergunta com uma só opção", payload: { trail: { id: UUID_A, title: "t" }, quizType: "magic_cards", questions: [{ question: "q", difficulty: "easy", options: [{ text: "A", is_correct: true }] }] } },
    ],
  },

  // push-device-revoked/index.ts:112 → { sent, targets, invalidated }
  "push-device-revoked": {
    valid: [{ nome: "enviado para os outros aparelhos", payload: { sent: 2, targets: 3, invalidated: 1 } }, { nome: "nenhum aparelho ativo", payload: { sent: 0, targets: 0 } }],
    invalid: [{ nome: "sent negativo", payload: { sent: -1, targets: 2 } }],
  },

  // push-outbox-dispatcher/index.ts:132 → { processed, sent, failed, skipped }
  "push-outbox-dispatcher": {
    valid: [{ nome: "lote processado", payload: { processed: 7, sent: 5, failed: 1, skipped: 1 } }, { nome: "fila vazia", payload: { processed: 0 } }],
    invalid: [{ nome: "processed ausente", payload: { sent: 5 } }],
  },

  // push-public-key/index.ts:6 → { publicKey }
  "push-public-key": {
    valid: [{ nome: "chave configurada", payload: { publicKey: "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U" } }, { nome: "VAPID não configurada", payload: { publicKey: null } }],
    invalid: [{ nome: "sem a chave publicKey", payload: {} }],
  },

  // reward-approval-review/index.ts:225 → score/level/factors/summary/recommendation/…
  "reward-approval-review": {
    valid: [{ nome: "parecer de risco", payload: { score: 42, level: "medium", factors: [{ label: "Saldo recente", points: 10, detail: "ganhou 500 moedas em 2 dias" }], summary: "Risco moderado…", recommendation: "review", requires_dual_approval: false, ai_available: true } }],
    invalid: [
      { nome: "recomendação fora do enum", payload: { score: 10, level: "low", factors: [], summary: "s", recommendation: "talvez", requires_dual_approval: false, ai_available: false } },
      { nome: "score fora da faixa", payload: { score: 180, level: "high", factors: [], summary: "s", recommendation: "reject", requires_dual_approval: true, ai_available: false } },
    ],
  },

  // send-campaign-push/index.ts:124 e :63 (dois formatos de 2xx)
  "send-campaign-push": {
    valid: [
      { nome: "envio com invalidações", payload: { sent: 4, invalidated: 1, failed: 0 } },
      { nome: "todos filtrados por preferência", payload: { sent: 0, skipped: 6, reason: "prefs" } },
    ],
    invalid: [{ nome: "formato misturado", payload: { sent: 4, reason: "prefs" } }],
  },

  // trail-recommendations/index.ts:300 → JSON da IA (recommendations + analysis)
  "trail-recommendations": {
    valid: [{ nome: "recomendações com análise", payload: {
      recommendations: [{ trailId: UUID_A, title: "Liderança na prática", reason: "É gestor e não concluiu trilhas de liderança", priority: "alta", skillGap: "Liderança" }],
      analysis: { strengths: ["Pontualidade"], gaps: ["Liderança"], nextSteps: "Começar pela trilha de liderança." },
    } }],
    invalid: [
      { nome: "prioridade em inglês", payload: { recommendations: [{ trailId: UUID_A, title: "t", reason: "r", priority: "high" }] } },
      { nome: "recommendations ausente", payload: { analysis: { strengths: [], gaps: [], nextSteps: "x" } } },
    ],
  },

  // verify-ip/index.ts (todos os returns usam allowed/ip/reason/message)
  "verify-ip": {
    valid: [
      { nome: "IP liberado", payload: { allowed: true, ip: "203.0.113.10", reason: "whitelisted", message: "Acesso permitido - Escritório" } },
      { nome: "whitelist vazia libera tudo", payload: { allowed: true, ip: "203.0.113.10", reason: "whitelist_empty", message: "Whitelist vazia, todos os IPs permitidos" } },
      { nome: "origem não confiável (fail closed)", payload: { allowed: false, ip: "unknown", reason: "untrusted_source_ip", message: "Não foi possível validar a origem da sua conexão" } },
    ],
    invalid: [{ nome: "motivo inventado", payload: { allowed: false, ip: "1.2.3.4", reason: "porque_sim", message: "m" } }],
  },

  // webhook-dispatcher/index.ts:245 → success/attempts/duration_ms/status/error
  "webhook-dispatcher": {
    valid: [
      { nome: "entrega no primeiro envio", payload: { success: true, attempts: 1, duration_ms: 412, status: 200, error: null } },
      { nome: "falhou após as tentativas (mesmo corpo, devolvido com status 502)", payload: { success: false, attempts: 3, duration_ms: 31000, status: null, error: "Request timeout" } },
    ],
    invalid: [{ nome: "attempts como string", payload: { success: true, attempts: "1", duration_ms: 10, status: 200, error: null } }],
  },

  // webhook-ping delega ao webhook-dispatcher: mesmo corpo de resposta
  "webhook-ping": {
    valid: [
      { nome: "entrega no primeiro envio", payload: { success: true, attempts: 1, duration_ms: 412, status: 200, error: null } },
      { nome: "falha apos as tentativas (mesmo corpo, devolvido com status 502)", payload: { success: false, attempts: 3, duration_ms: 31000, status: null, error: "Request timeout" } },
    ],
    invalid: [{ nome: "attempts como string", payload: { success: true, attempts: "1", duration_ms: 10, status: 200, error: null } }],
  },
};

export function responsesFor(name: string): ResponseFixtures | undefined {
  return RESPONSES[name];
}
