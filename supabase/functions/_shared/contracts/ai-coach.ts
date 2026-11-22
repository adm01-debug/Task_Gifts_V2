import { defineContract, texto, z } from "./common.ts";

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  // O histórico vem de `ai_coach_messages.content` (TEXT, sem limite): uma resposta longa do
  // modelo passaria do limite e derrubaria o chat inteiro com 422 na mensagem seguinte.
  content: z.string().max(32000),
});

export const CompetencySchema = z.object({
  area: z.string(),
  value: z.number(),
  maxValue: z.number().positive(),
  icon: z.string().optional(),
}).passthrough();

export const AvailableTrailSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  estimated_hours: z.number().nullable().optional(),
  xp_reward: z.number().nullable().optional(),
  enrolled: z.boolean().optional(),
  completed: z.boolean().optional(),
  progress: z.number().optional(),
}).passthrough();

/** Contexto do usuário enviado por src/hooks/useAICoach.ts (todos opcionais; o prompt usa fallbacks). */
export const UserContextSchema = z.object({
  displayName: z.string().nullable().optional(),
  level: z.number().nullable().optional(),
  xp: z.number().nullable().optional(),
  coins: z.number().nullable().optional(),
  questsCompleted: z.number().nullable().optional(),
  streak: z.number().nullable().optional(),
  department: z.string().nullable().optional(),
  competencies: z.array(CompetencySchema).optional(),
  availableTrails: z.array(AvailableTrailSchema).optional(),
  completedTrailsCount: z.number().optional(),
}).passthrough();

/**
 * Corpo do chat do AI Coach. `messages` é obrigatório (o handler faz `messages.slice(-4)`);
 * `generateSuggestions: true` pede só as 3 sugestões de follow-up.
 */
export const AiCoachRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(200),
  userContext: UserContextSchema.optional(),
  generateSuggestions: z.boolean().optional(),
});

export const AiCoachSuggestionsResponseSchema = z.object({ suggestions: z.array(texto(80, 0)) });

export const aiCoachContract = defineContract({
  name: "ai-coach",
  methods: ["POST"],
  auth: "user",
  request: AiCoachRequestSchema,
  response: AiCoachSuggestionsResponseSchema,
  bodyRequired: true,
});
