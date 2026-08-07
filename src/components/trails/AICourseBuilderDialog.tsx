import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { aiCourseBuilderService, type AICourseJob } from "@/services/aiCourseBuilderService";

const ACCEPT = ".pdf,.txt,.md";
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export function AICourseBuilderDialog() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [hint, setHint] = useState("");
  const [job, setJob] = useState<AICourseJob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  const reset = () => {
    setFile(null);
    setHint("");
    setJob(null);
    setSubmitting(false);
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = null;
  };

  const startPolling = (jobId: string) => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      try {
        const fresh = await aiCourseBuilderService.getJob(jobId);
        if (!fresh) return;
        setJob(fresh);
        if (fresh.status === "succeeded" || fresh.status === "failed") {
          if (pollRef.current) window.clearInterval(pollRef.current);
          pollRef.current = null;
          queryClient.invalidateQueries({ queryKey: ["trails"] });
          if (fresh.status === "succeeded") {
            toast.success("Trilha gerada com IA!", {
              description: `${fresh.modules_created} módulos e ${fresh.questions_created} perguntas criados.`,
            });
          } else {
            toast.error("Falha na geração", { description: fresh.error_message ?? "Erro desconhecido" });
          }
        }
      } catch (e) {
        // Silently continue polling
      }
    }, 2500);
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Selecione um arquivo (.pdf, .txt ou .md).");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Arquivo muito grande. Máximo 10 MB.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await aiCourseBuilderService.uploadAndCreateJob(file, hint.trim() || null);
      setJob(created);
      startPolling(created.id);
      // Fire-and-forget: the edge function processes asynchronously; polling picks up the result.
      aiCourseBuilderService.triggerBuild(created.id).catch((err) => {
        toast.error("Falha ao iniciar processamento", {
          description: err instanceof Error ? err.message : String(err),
        });
      });
      toast.info("Upload concluído — processando com IA…");
    } catch (err) {
      toast.error("Falha ao enviar", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const goToTrail = () => {
    if (job?.generated_trail_id) {
      setOpen(false);
      reset();
      navigate(`/trails/${job.generated_trail_id}`);
    }
  };

  const progressValue =
    job?.status === "succeeded" ? 100 : job?.status === "processing" ? 60 : job ? 25 : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Gerar trilha com IA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Nova trilha a partir de um arquivo
          </DialogTitle>
          <DialogDescription>
            Envie um PDF, TXT ou Markdown com o conteúdo. A IA cria módulos didáticos e um quiz automaticamente.
          </DialogDescription>
        </DialogHeader>

        {!job && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Arquivo de origem</Label>
              <Input
                id="file"
                type="file"
                accept={ACCEPT}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                Até 10 MB. Formatos: PDF (texto), TXT, MD.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hint">Contexto opcional</Label>
              <Textarea
                id="hint"
                placeholder="Ex.: foco em vendas B2B, público de estagiários…"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                rows={3}
                maxLength={500}
                disabled={submitting}
              />
            </div>
          </div>
        )}

        {job && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              {job.status === "succeeded" ? (
                <CheckCircle2 className="h-6 w-6 text-primary" />
              ) : job.status === "failed" ? (
                <AlertCircle className="h-6 w-6 text-destructive" />
              ) : (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              )}
              <div>
                <p className="font-semibold">
                  {job.status === "pending" && "Aguardando processamento…"}
                  {job.status === "processing" && "IA construindo sua trilha…"}
                  {job.status === "succeeded" && "Trilha criada!"}
                  {job.status === "failed" && "Falhou"}
                </p>
                <p className="text-xs text-muted-foreground">{job.source_file_name}</p>
              </div>
            </div>
            <Progress value={progressValue} />
            {job.status === "succeeded" && (
              <p className="text-sm text-muted-foreground">
                {job.modules_created} módulos • {job.questions_created} perguntas de quiz.
              </p>
            )}
            {job.status === "failed" && job.error_message && (
              <p className="text-sm text-destructive">{job.error_message}</p>
            )}
          </div>
        )}

        <DialogFooter>
          {!job && (
            <Button onClick={handleSubmit} disabled={!file || submitting} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Enviar e gerar
            </Button>
          )}
          {job?.status === "succeeded" && (
            <Button onClick={goToTrail} className="gap-2">
              Abrir trilha
            </Button>
          )}
          {job?.status === "failed" && (
            <Button variant="outline" onClick={reset}>
              Tentar novamente
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}