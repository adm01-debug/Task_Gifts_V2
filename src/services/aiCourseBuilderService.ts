import { supabase } from "@/integrations/supabase/client";

export type AICourseJobStatus = "pending" | "processing" | "succeeded" | "failed";

export interface AICourseJob {
  id: string;
  user_id: string;
  status: AICourseJobStatus;
  source_file_path: string;
  source_file_name: string;
  source_file_size: number | null;
  prompt_hint: string | null;
  generated_trail_id: string | null;
  modules_created: number;
  questions_created: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

const BUCKET = "course-uploads";

export const aiCourseBuilderService = {
  async uploadAndCreateJob(file: File, promptHint: string | null): Promise<AICourseJob> {
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes.user) throw new Error("Sessão expirada, faça login novamente.");
    const userId = userRes.user.id;

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userId}/${Date.now()}-${safeName}`;

    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });
    if (upErr) throw new Error(`Falha no upload: ${upErr.message}`);

    const { data, error } = await supabase
      .from("ai_course_jobs")
      .insert({
        user_id: userId,
        source_file_path: path,
        source_file_name: file.name,
        source_file_size: file.size,
        prompt_hint: promptHint,
      })
      .select("*")
      .maybeSingle();
    if (error || !data) throw new Error(error?.message || "Falha ao criar job.");
    return data as AICourseJob;
  },

  async triggerBuild(jobId: string): Promise<void> {
    const { error } = await supabase.functions.invoke("ai-course-builder", {
      body: { job_id: jobId },
    });
    if (error) throw error;
  },

  async getJob(jobId: string): Promise<AICourseJob | null> {
    const { data, error } = await supabase
      .from("ai_course_jobs")
      .select("*")
      .eq("id", jobId)
      .maybeSingle();
    if (error) throw error;
    return (data as AICourseJob) ?? null;
  },

  async listMyJobs(limit = 10): Promise<AICourseJob[]> {
    const { data, error } = await supabase
      .from("ai_course_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as AICourseJob[]) || [];
  },
};