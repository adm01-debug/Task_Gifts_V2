import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "https://esm.sh/zod@3.23.8";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const BodySchema = z.object({
  job_id: z.string().uuid(),
});

interface AICourseSchema {
  trail_title: string;
  trail_description: string;
  trail_icon: string;
  estimated_hours: number;
  modules: Array<{
    title: string;
    description: string;
    content_markdown: string;
    duration_minutes: number;
  }>;
  quiz_questions: Array<{
    question: string;
    explanation: string;
    difficulty: "easy" | "medium" | "hard";
    options: Array<{ text: string; is_correct: boolean }>;
  }>;
}

const AI_TOOL_SCHEMA = {
  type: "function",
  function: {
    name: "build_course",
    description: "Estruturar uma trilha de aprendizagem gamificada a partir do texto fornecido.",
    parameters: {
      type: "object",
      properties: {
        trail_title: { type: "string", maxLength: 120 },
        trail_description: { type: "string", maxLength: 500 },
        trail_icon: { type: "string", description: "Emoji único que represente o tema" },
        estimated_hours: { type: "number", minimum: 0.5, maximum: 40 },
        modules: {
          type: "array",
          minItems: 3,
          maxItems: 8,
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              content_markdown: { type: "string", description: "Conteúdo didático em markdown, 300-800 palavras" },
              duration_minutes: { type: "integer", minimum: 5, maximum: 60 },
            },
            required: ["title", "description", "content_markdown", "duration_minutes"],
            additionalProperties: false,
          },
        },
        quiz_questions: {
          type: "array",
          minItems: 5,
          maxItems: 15,
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              explanation: { type: "string" },
              difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
              options: {
                type: "array",
                minItems: 3,
                maxItems: 5,
                items: {
                  type: "object",
                  properties: {
                    text: { type: "string" },
                    is_correct: { type: "boolean" },
                  },
                  required: ["text", "is_correct"],
                  additionalProperties: false,
                },
              },
            },
            required: ["question", "explanation", "difficulty", "options"],
            additionalProperties: false,
          },
        },
      },
      required: ["trail_title", "trail_description", "trail_icon", "estimated_hours", "modules", "quiz_questions"],
      additionalProperties: false,
    },
  },
};

async function extractText(buf: ArrayBuffer, fileName: string): Promise<string> {
  const lower = fileName.toLowerCase();
  const bytes = new Uint8Array(buf);
  // Plain text / markdown
  if (lower.endsWith(".txt") || lower.endsWith(".md")) {
    return new TextDecoder().decode(bytes);
  }
  // Basic PDF text extraction (strings between BT/ET). Not perfect but works for text-based PDFs.
  if (lower.endsWith(".pdf")) {
    const raw = new TextDecoder("latin1").decode(bytes);
    const matches = raw.match(/\(([^)]{2,})\)/g) ?? [];
    const text = matches
      .map((m) => m.slice(1, -1).replace(/\\(\d{3})/g, (_, o) => String.fromCharCode(parseInt(o, 8))))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text.length < 100) {
      throw new Error("Não foi possível extrair texto suficiente do PDF (pode ser um PDF escaneado).");
    }
    return text.slice(0, 60000);
  }
  throw new Error(`Formato não suportado: ${fileName}. Use .txt, .md ou .pdf com texto.`);
}

async function callAI(sourceText: string, promptHint: string | null): Promise<AICourseSchema> {
  const systemMsg =
    "Você é um instructional designer especialista em criar trilhas de aprendizagem corporativas gamificadas em português (PT-BR). Baseie-se EXCLUSIVAMENTE no conteúdo fornecido.";
  const userMsg = `Crie uma trilha gamificada a partir do conteúdo abaixo.
${promptHint ? `\nContexto adicional: ${promptHint}\n` : ""}
CONTEÚDO:
"""
${sourceText}
"""`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemMsg },
        { role: "user", content: userMsg },
      ],
      tools: [AI_TOOL_SCHEMA],
      tool_choice: { type: "function", function: { name: "build_course" } },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429) throw new Error("Limite de uso da IA atingido, tente em instantes.");
    if (res.status === 402) throw new Error("Créditos da Lovable AI esgotados. Adicione créditos no workspace.");
    throw new Error(`Falha da IA [${res.status}]: ${body}`);
  }
  const data = await res.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) throw new Error("IA não retornou estrutura válida.");
  return JSON.parse(toolCall.function.arguments) as AICourseSchema;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  let jobId: string | null = null;

  try {
    // JWT validation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const anon = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await anon.auth.getUser();
    if (userErr || !userRes.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userRes.user.id;

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    jobId = parsed.data.job_id;

    // Load job (must belong to user)
    const { data: job, error: jobErr } = await admin
      .from("ai_course_jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", userId)
      .maybeSingle();
    if (jobErr || !job) throw new Error("Job não encontrado.");
    if (job.status !== "pending") throw new Error(`Job já está no estado ${job.status}.`);

    await admin
      .from("ai_course_jobs")
      .update({ status: "processing", started_at: new Date().toISOString() })
      .eq("id", jobId);

    // Download file
    const { data: file, error: dlErr } = await admin.storage
      .from("course-uploads")
      .download(job.source_file_path);
    if (dlErr || !file) throw new Error(`Falha ao baixar arquivo: ${dlErr?.message}`);

    const text = await extractText(await file.arrayBuffer(), job.source_file_name);
    const course = await callAI(text, job.prompt_hint);

    // Insert trail
    const { data: trail, error: trailErr } = await admin
      .from("learning_trails")
      .insert({
        title: course.trail_title,
        description: course.trail_description,
        icon: course.trail_icon,
        estimated_hours: course.estimated_hours,
        status: "draft",
        created_by: userId,
      })
      .select("id")
      .single();
    if (trailErr || !trail) throw new Error(`Falha ao criar trilha: ${trailErr?.message}`);

    // Insert modules
    const moduleRows = course.modules.map((m, idx) => ({
      trail_id: trail.id,
      title: m.title,
      description: m.description,
      content_type: "text",
      content: { markdown: m.content_markdown },
      duration_minutes: m.duration_minutes,
      order_index: idx,
    }));
    const { error: modErr } = await admin.from("trail_modules").insert(moduleRows);
    if (modErr) throw new Error(`Falha ao criar módulos: ${modErr.message}`);

    // Insert quiz questions + options
    let questionsCreated = 0;
    for (const q of course.quiz_questions) {
      const { data: qRow, error: qErr } = await admin
        .from("quiz_questions")
        .insert({
          question: q.question,
          explanation: q.explanation,
          difficulty: q.difficulty,
          quiz_type: "magic_cards",
          category: course.trail_title,
          created_by: userId,
        })
        .select("id")
        .single();
      if (qErr || !qRow) continue;
      const optRows = q.options.map((o, i) => ({
        question_id: qRow.id,
        text: o.text,
        is_correct: o.is_correct,
        order_index: i,
      }));
      await admin.from("quiz_options").insert(optRows);
      questionsCreated++;
    }

    await admin
      .from("ai_course_jobs")
      .update({
        status: "succeeded",
        generated_trail_id: trail.id,
        modules_created: course.modules.length,
        questions_created: questionsCreated,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    return new Response(
      JSON.stringify({
        success: true,
        trail_id: trail.id,
        modules: course.modules.length,
        questions: questionsCreated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (jobId) {
      await admin
        .from("ai_course_jobs")
        .update({
          status: "failed",
          error_message: message,
          completed_at: new Date().toISOString(),
        })
        .eq("id", jobId);
    }
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});