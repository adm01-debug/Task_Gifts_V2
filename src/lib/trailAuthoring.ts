import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";

/**
 * Pure authoring logic for learning trail modules.
 * Kept free of React/Supabase so it can be exhaustively simulated in tests.
 */

export const MODULE_CONTENT_TYPES = [
  "video",
  "text",
  "quiz",
  "flashcard",
  "infographic",
  "simulation",
  "checklist",
] as const;

export type ModuleContentType = (typeof MODULE_CONTENT_TYPES)[number];

export const CONTENT_TYPE_LABELS: Record<ModuleContentType, string> = {
  video: "Vídeo",
  text: "Texto",
  quiz: "Quiz",
  flashcard: "Flashcards",
  infographic: "Infográfico",
  simulation: "Simulação",
  checklist: "Checklist",
};

const nonEmpty = (max: number, field: string) =>
  z.string().trim().min(1, { message: `${field} não pode ficar vazio` }).max(max, {
    message: `${field} deve ter no máximo ${max} caracteres`,
  });

export const quizQuestionSchema = z.object({
  question: nonEmpty(500, "A pergunta"),
  options: z.array(nonEmpty(300, "A alternativa")).min(2, {
    message: "Informe pelo menos 2 alternativas",
  }),
  correct: z.number().int().min(0),
});

export const flashcardSchema = z.object({
  front: nonEmpty(500, "A frente do card"),
  back: nonEmpty(1000, "O verso do card"),
});

export const checklistItemSchema = z.object({
  text: nonEmpty(300, "O item"),
});

export const moduleDraftSchema = z
  .object({
    title: nonEmpty(150, "O título"),
    description: z.string().trim().max(500).nullable().optional(),
    content_type: z.enum(MODULE_CONTENT_TYPES),
    xp_reward: z.number().int().min(0).max(10000),
    duration_minutes: z.number().int().min(0).max(1440),
    video_url: z.string().trim().max(2048).nullable().optional(),
    transcript: z.string().trim().max(20000).nullable().optional(),
    body: z.string().trim().max(50000).nullable().optional(),
    questions: z.array(quizQuestionSchema).optional(),
    cards: z.array(flashcardSchema).optional(),
    items: z.array(checklistItemSchema).optional(),
  })
  .superRefine((draft, ctx) => {
    if (draft.content_type === "video") {
      const url = draft.video_url?.trim() ?? "";
      if (!url) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["video_url"],
          message: "Informe a URL do vídeo",
        });
      } else if (!isSafeMediaUrl(url)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["video_url"],
          message: "Use uma URL http(s) válida",
        });
      }
    }

    if (draft.content_type === "text" || draft.content_type === "infographic") {
      if (!draft.body || draft.body.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["body"],
          message: "O conteúdo não pode ficar vazio",
        });
      }
    }

    if (draft.content_type === "quiz") {
      const questions = draft.questions ?? [];
      if (questions.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["questions"],
          message: "Adicione pelo menos uma pergunta",
        });
      }
      questions.forEach((question, index) => {
        if (question.correct >= question.options.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["questions", index, "correct"],
            message: "A alternativa correta não existe",
          });
        }
      });
    }

    if (draft.content_type === "flashcard" && (draft.cards ?? []).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cards"],
        message: "Adicione pelo menos um card",
      });
    }

    if (
      (draft.content_type === "checklist" || draft.content_type === "simulation") &&
      (draft.items ?? []).length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["items"],
        message: "Adicione pelo menos um item",
      });
    }
  });

export type ModuleDraft = z.infer<typeof moduleDraftSchema>;

/** Only http(s) URLs are accepted for embedded media. */
export function isSafeMediaUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export interface ModuleValidationResult {
  valid: boolean;
  /** Flat map of dot-joined path -> first error message. */
  errors: Record<string, string>;
}

export function validateModuleDraft(draft: unknown): ModuleValidationResult {
  const parsed = moduleDraftSchema.safeParse(draft);
  if (parsed.success) return { valid: true, errors: {} };

  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!errors[key]) errors[key] = issue.message;
  }
  return { valid: false, errors };
}

/**
 * Serializes the typed draft into the `content` JSON column shape that
 * ModuleViewer already understands.
 */
export function draftToContent(draft: ModuleDraft): Json {
  const transcript = draft.transcript?.trim() ? draft.transcript.trim() : undefined;

  switch (draft.content_type) {
    case "video":
      return { transcript: transcript ?? null } as unknown as Json;
    case "text":
    case "infographic":
      return { body: draft.body?.trim() ?? "" } as unknown as Json;
    case "quiz":
      return { questions: draft.questions ?? [] } as unknown as Json;
    case "flashcard":
      return { cards: draft.cards ?? [] } as unknown as Json;
    case "checklist":
    case "simulation":
      return { items: draft.items ?? [] } as unknown as Json;
    default:
      return null;
  }
}

interface RawModuleLike {
  title: string;
  description?: string | null;
  content_type: string;
  content?: Json | null;
  video_url?: string | null;
  xp_reward?: number | null;
  duration_minutes?: number | null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asStringArrayItems<T>(value: unknown, map: (entry: Record<string, unknown>) => T): T[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry) => entry && typeof entry === "object").map((entry) => map(asRecord(entry)));
}

/** Hydrates a persisted module row into an editable draft. */
export function moduleToDraft(module: RawModuleLike): ModuleDraft {
  const content = asRecord(module.content);
  const contentType = (MODULE_CONTENT_TYPES as readonly string[]).includes(module.content_type)
    ? (module.content_type as ModuleContentType)
    : "text";

  return {
    title: module.title ?? "",
    description: module.description ?? "",
    content_type: contentType,
    xp_reward: module.xp_reward ?? 25,
    duration_minutes: module.duration_minutes ?? 5,
    video_url: module.video_url ?? "",
    transcript: typeof content.transcript === "string" ? content.transcript : "",
    body: typeof content.body === "string" ? content.body : "",
    questions: asStringArrayItems(content.questions, (entry) => ({
      question: typeof entry.question === "string" ? entry.question : "",
      options: Array.isArray(entry.options)
        ? entry.options.map((option) => (typeof option === "string" ? option : String(option ?? "")))
        : [],
      correct: typeof entry.correct === "number" ? entry.correct : 0,
    })),
    cards: asStringArrayItems(content.cards, (entry) => ({
      front: typeof entry.front === "string" ? entry.front : "",
      back: typeof entry.back === "string" ? entry.back : "",
    })),
    items: asStringArrayItems(content.items, (entry) => ({
      text: typeof entry.text === "string" ? entry.text : "",
    })),
  };
}

export function emptyDraft(contentType: ModuleContentType = "text"): ModuleDraft {
  return {
    title: "",
    description: "",
    content_type: contentType,
    xp_reward: 25,
    duration_minutes: 5,
    video_url: "",
    transcript: "",
    body: "",
    questions: contentType === "quiz" ? [{ question: "", options: ["", ""], correct: 0 }] : [],
    cards: contentType === "flashcard" ? [{ front: "", back: "" }] : [],
    items: contentType === "checklist" || contentType === "simulation" ? [{ text: "" }] : [],
  };
}

export interface OrderableModule {
  id: string;
  order_index: number;
}

/** Moves an item and returns the full list with contiguous 0..n-1 indexes. */
export function reorderModules<T extends OrderableModule>(
  modules: T[],
  fromIndex: number,
  toIndex: number
): T[] {
  const sorted = [...modules].sort((a, b) => a.order_index - b.order_index);
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= sorted.length ||
    toIndex >= sorted.length ||
    fromIndex === toIndex
  ) {
    return normalizeOrder(sorted);
  }

  const next = [...sorted];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return normalizeOrder(next);
}

/** Rewrites order_index so it is contiguous and gap-free. */
export function normalizeOrder<T extends OrderableModule>(modules: T[]): T[] {
  return modules.map((module, index) => ({ ...module, order_index: index }));
}

/** Returns only the entries whose order_index actually changed. */
export function diffOrder<T extends OrderableModule>(
  original: T[],
  next: T[]
): { id: string; order_index: number }[] {
  const previous = new Map(original.map((module) => [module.id, module.order_index]));
  return next
    .filter((module) => previous.get(module.id) !== module.order_index)
    .map((module) => ({ id: module.id, order_index: module.order_index }));
}

export function duplicateTitle(title: string): string {
  const trimmed = title.trim();
  const match = /^(.*)\s\(cópia(?:\s(\d+))?\)$/.exec(trimmed);
  if (!match) return `${trimmed} (cópia)`;
  const counter = match[2] ? Number(match[2]) + 1 : 2;
  return `${match[1]} (cópia ${counter})`;
}