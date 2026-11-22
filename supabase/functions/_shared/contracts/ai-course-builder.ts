import { defineContract, uuid, z } from "./common.ts";

export const AiCourseBuilderRequestSchema = z.object({
  job_id: uuid,
});

export const AiCourseBuilderResponseSchema = z.object({
  success: z.literal(true),
  trail_id: z.string(),
  modules: z.number().int().nonnegative(),
  questions: z.number().int().nonnegative(),
});

export const aiCourseBuilderContract = defineContract({
  name: "ai-course-builder",
  methods: ["POST"],
  auth: "user",
  request: AiCourseBuilderRequestSchema,
  response: AiCourseBuilderResponseSchema,
  bodyRequired: true,
});
