/**
 * Centralized Zod validation schemas for the entire application
 * All forms should use these schemas for consistent validation
 */

import { z } from "zod";

// ============================================
// Common Validators
// ============================================

const sanitizeString = (value: string) => value.trim().replace(/\s+/g, ' ');

const createStringSchema = (
  fieldName: string,
  minLength: number = 1,
  maxLength: number = 255
) =>
  z
    .string({ required_error: `${fieldName} é obrigatório` })
    .min(minLength, `${fieldName} deve ter pelo menos ${minLength} caractere(s)`)
    .max(maxLength, `${fieldName} deve ter no máximo ${maxLength} caracteres`)
    .transform(sanitizeString);

// ============================================
// Auth Schemas
// ============================================

export const emailSchema = z
  .string({ required_error: "Email é obrigatório" })
  .min(1, "Email é obrigatório")
  .email("Email inválido")
  .max(255, "Email deve ter no máximo 255 caracteres")
  .transform((val) => val.toLowerCase().trim());

export const passwordSchema = z
  .string({ required_error: "Senha é obrigatória" })
  .min(6, "Senha deve ter pelo menos 6 caracteres")
  .max(100, "Senha deve ter no máximo 100 caracteres");

export const strongPasswordSchema = z
  .string({ required_error: "Senha é obrigatória" })
  .min(8, "Senha deve ter pelo menos 8 caracteres")
  .max(100, "Senha deve ter no máximo 100 caracteres")
  .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
  .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
  .regex(/[0-9]/, "Senha deve conter pelo menos um número")
  .regex(/[^A-Za-z0-9]/, "Senha deve conter pelo menos um caractere especial");

export const displayNameSchema = z
  .string()
  .min(2, "Nome deve ter pelo menos 2 caracteres")
  .max(50, "Nome deve ter no máximo 50 caracteres")
  .regex(/^[a-zA-ZÀ-ÿ0-9\s]+$/, "Nome contém caracteres inválidos")
  .transform(sanitizeString)
  .optional();

export const loginFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signupFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// ============================================
// Profile Schemas
// ============================================

export const profileUpdateSchema = z.object({
  display_name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(50, "Nome deve ter no máximo 50 caracteres")
    .transform(sanitizeString)
    .optional(),
  avatar_url: z
    .string()
    .url("URL do avatar inválida")
    .max(500, "URL muito longa")
    .optional()
    .nullable(),
});

// ============================================
// Quest Schemas
// ============================================

export const questTitleSchema = createStringSchema("Título", 3, 100);

export const questDescriptionSchema = createStringSchema("Descrição", 10, 1000);

export const questStepSchema = z.object({
  id: z.string(),
  title: createStringSchema("Título da etapa", 2, 100),
  description: z.string().max(500, "Descrição muito longa").optional(),
  xpReward: z
    .number()
    .min(0, "XP não pode ser negativo")
    .max(10000, "XP máximo é 10.000"),
});

export const questFormSchema = z.object({
  title: questTitleSchema,
  description: questDescriptionSchema,
  icon: z.string().max(10, "Ícone inválido").default("📚"),
  difficulty: z.enum(["easy", "medium", "hard", "expert"], {
    required_error: "Selecione a dificuldade",
  }),
  xpReward: z
    .number()
    .min(0, "XP não pode ser negativo")
    .max(50000, "XP máximo é 50.000"),
  coinReward: z
    .number()
    .min(0, "Moedas não podem ser negativas")
    .max(50000, "Moedas máximas são 50.000"),
  deadlineDays: z
    .number()
    .min(1, "Prazo mínimo é 1 dia")
    .max(365, "Prazo máximo é 365 dias")
    .nullable()
    .optional(),
  maxParticipants: z
    .number()
    .min(1, "Mínimo de 1 participante")
    .max(10000, "Máximo de 10.000 participantes")
    .nullable()
    .optional(),
  tags: z
    .array(z.string().max(30, "Tag muito longa"))
    .max(10, "Máximo de 10 tags")
    .optional(),
  steps: z.array(questStepSchema).max(50, "Máximo de 50 etapas").optional(),
});

// ============================================
// Kudos / Recognition Schemas
// ============================================

export const kudosMessageSchema = z
  .string({ required_error: "Mensagem é obrigatória" })
  .min(5, "Mensagem deve ter pelo menos 5 caracteres")
  .max(500, "Mensagem deve ter no máximo 500 caracteres")
  .transform(sanitizeString);

export const giveKudosSchema = z.object({
  to_user_id: z.string().uuid("Usuário inválido"),
  badge_id: z.string().uuid("Badge inválido").nullable().optional(),
  message: kudosMessageSchema,
  is_public: z.boolean().default(true),
});

// ============================================
// Quiz Schemas
// ============================================

export const quizQuestionSchema = z.object({
  question: createStringSchema("Pergunta", 10, 500),
  explanation: z.string().max(1000, "Explicação muito longa").optional().nullable(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  points: z.number().min(1, "Mínimo 1 ponto").max(1000, "Máximo 1000 pontos"),
  category: z.string().max(50, "Categoria muito longa").optional().nullable(),
  quiz_type: z.enum(["daily", "millionaire", "magic_card"]).default("daily"),
});

export const quizOptionSchema = z.object({
  text: createStringSchema("Opção", 1, 300),
  is_correct: z.boolean(),
});

export const quizQuestionWithOptionsSchema = quizQuestionSchema.extend({
  options: z
    .array(quizOptionSchema)
    .min(2, "Mínimo 2 opções")
    .max(6, "Máximo 6 opções")
    .refine(
      (options) => options.filter((o) => o.is_correct).length >= 1,
      "Deve haver pelo menos uma opção correta"
    ),
});

// ============================================
// AI Coach Schemas
// ============================================

export const aiCoachMessageSchema = z
  .string()
  .min(1, "Mensagem não pode estar vazia")
  .max(2000, "Mensagem muito longa (máximo 2000 caracteres)")
  .transform(sanitizeString);

// ============================================
// Shop Schemas
// ============================================

export const shopRewardSchema = z.object({
  name: createStringSchema("Nome do item", 2, 100),
  description: z.string().max(500, "Descrição muito longa").optional().nullable(),
  price_coins: z
    .number()
    .min(1, "Preço mínimo é 1 moeda")
    .max(1000000, "Preço máximo é 1.000.000 moedas"),
  category: z.enum(["product", "benefit", "experience"]),
  rarity: z.enum(["common", "rare", "epic", "legendary"]),
  stock: z.number().min(0, "Estoque não pode ser negativo").nullable().optional(),
  image_url: z.string().url("URL da imagem inválida").max(500).optional().nullable(),
  is_active: z.boolean().default(true),
});

// ============================================
// Department Schemas
// ============================================

export const departmentSchema = z.object({
  name: createStringSchema("Nome do departamento", 2, 100),
  description: z.string().max(500, "Descrição muito longa").optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida (use formato hexadecimal)")
    .optional()
    .nullable(),
});

// ============================================
// Learning Trail Schemas
// ============================================

export const learningTrailSchema = z.object({
  title: createStringSchema("Título da trilha", 3, 100),
  description: z.string().max(1000, "Descrição muito longa").optional().nullable(),
  icon: z.string().max(10, "Ícone inválido").optional().nullable(),
  estimated_hours: z
    .number()
    .min(0.5, "Mínimo 0.5 horas")
    .max(1000, "Máximo 1000 horas")
    .optional()
    .nullable(),
  xp_reward: z
    .number()
    .min(0, "XP não pode ser negativo")
    .max(100000, "XP máximo é 100.000")
    .optional()
    .nullable(),
  coin_reward: z
    .number()
    .min(0, "Moedas não podem ser negativas")
    .max(100000, "Moedas máximas são 100.000")
    .optional()
    .nullable(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
});

export const trailModuleSchema = z.object({
  title: createStringSchema("Título do módulo", 2, 100),
  description: z.string().max(1000, "Descrição muito longa").optional().nullable(),
  content_type: z.enum([
    "video",
    "text",
    "quiz",
    "flashcard",
    "infographic",
    "simulation",
    "checklist",
  ]),
  video_url: z.string().url("URL do vídeo inválida").max(500).optional().nullable(),
  duration_minutes: z
    .number()
    .min(1, "Mínimo 1 minuto")
    .max(600, "Máximo 600 minutos")
    .optional()
    .nullable(),
  xp_reward: z
    .number()
    .min(0, "XP não pode ser negativo")
    .max(10000, "XP máximo é 10.000")
    .optional()
    .nullable(),
});

// ============================================
// Comment Schemas
// ============================================

export const commentSchema = z
  .string({ required_error: "Comentário é obrigatório" })
  .min(1, "Comentário não pode estar vazio")
  .max(1000, "Comentário muito longo (máximo 1000 caracteres)")
  .transform(sanitizeString);

// ============================================
// Search Schemas
// ============================================

export const searchQuerySchema = z
  .string()
  .max(200, "Busca muito longa")
  .transform(sanitizeString);

// ============================================
// Utility Functions
// ============================================

/**
 * Validate data against a schema and return typed result
 */
export function validateData<T extends z.ZodSchema>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map((e) => e.message);
  return { success: false, errors };
}

/**
 * Get first validation error message
 */
export function getFirstError<T extends z.ZodSchema>(
  schema: T,
  data: unknown
): string | null {
  const result = validateData(schema, data);
  if (result.success) return null;
  return (result as { success: false; errors: string[] }).errors[0] || "Erro de validação";
}

// ============================================
// Type Exports
// ============================================

export type LoginFormData = z.infer<typeof loginFormSchema>;
export type SignupFormData = z.infer<typeof signupFormSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
export type QuestFormData = z.infer<typeof questFormSchema>;
export type GiveKudosData = z.infer<typeof giveKudosSchema>;
export type QuizQuestionData = z.infer<typeof quizQuestionWithOptionsSchema>;
export type ShopRewardData = z.infer<typeof shopRewardSchema>;
export type DepartmentData = z.infer<typeof departmentSchema>;
export type LearningTrailData = z.infer<typeof learningTrailSchema>;
export type TrailModuleData = z.infer<typeof trailModuleSchema>;
