import { defineContract, uuid, z } from "./common.ts";

/** Chamador: src/components/quiz/AIQuestionGenerator.tsx (select magic_cards|millionaire, slider 3..10). */
export const GenerateQuizQuestionsRequestSchema = z.object({
  trailId: uuid,
  quizType: z.enum(["magic_cards", "millionaire"]).default("magic_cards"),
  questionCount: z.number().int().min(1).max(20).default(5),
});

export const GeneratedQuestionSchema = z.object({
  question: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  category: z.string().optional(),
  explanation: z.string().optional(),
  options: z.array(z.object({ text: z.string(), is_correct: z.boolean() })).min(2),
});

export const GenerateQuizQuestionsResponseSchema = z.object({
  trail: z.object({ id: z.string(), title: z.string() }),
  quizType: z.string(),
  questions: z.array(GeneratedQuestionSchema),
});

export const generateQuizQuestionsContract = defineContract({
  name: "generate-quiz-questions",
  methods: ["POST"],
  auth: "user",
  request: GenerateQuizQuestionsRequestSchema,
  response: GenerateQuizQuestionsResponseSchema,
  bodyRequired: true,
});
