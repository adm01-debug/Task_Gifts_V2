import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { BadgeCheck, ShieldAlert, ShieldCheck, Search, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { certificationsService, type CertificateVerification } from "@/services/certificationsService";
import { logger } from "@/services/loggingService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type VerifyState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "found"; data: CertificateVerification }
  | { kind: "not-found" }
  | { kind: "error"; message: string };

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : format(date, "dd/MM/yyyy", { locale: ptBR });
}

export default function CertificateVerify() {
  const { code: routeCode } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [code, setCode] = useState(routeCode ?? "");
  const [state, setState] = useState<VerifyState>({ kind: "idle" });

  const runVerification = useCallback(async (value: string) => {
    const normalized = value.trim().toUpperCase();
    if (normalized.length < 6) {
      setState({ kind: "not-found" });
      return;
    }
    setState({ kind: "loading" });
    try {
      const result = await certificationsService.verifyCertificate(normalized);
      setState(result ? { kind: "found", data: result } : { kind: "not-found" });
    } catch (err: unknown) {
      logger.error("Falha ao verificar certificado", err);
      setState({ kind: "error", message: "Não foi possível consultar o certificado agora. Tente novamente." });
    }
  }, []);

  useEffect(() => {
    if (routeCode) void runVerification(routeCode);
  }, [routeCode, runVerification]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    navigate(`/verificar/${encodeURIComponent(normalized)}`, { replace: true });
    void runVerification(normalized);
  };

  return (
    <main className="min-h-dvh bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <header className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BadgeCheck className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Verificação de certificado</h1>
          <p className="text-sm text-muted-foreground">
            Informe o código impresso no certificado para confirmar sua autenticidade.
          </p>
        </header>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Consultar código</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
              <label htmlFor="certificate-code" className="sr-only">
                Código do certificado
              </label>
              <Input
                id="certificate-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX"
                autoComplete="off"
                spellCheck={false}
                maxLength={20}
                className="font-mono tracking-wider"
              />
              <Button type="submit" className="min-h-11 sm:w-40" disabled={state.kind === "loading"}>
                {state.kind === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Search className="h-4 w-4" aria-hidden="true" />
                )}
                <span>Verificar</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        <div aria-live="polite">
          {state.kind === "found" && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={state.data.is_valid ? "border-primary/40" : "border-destructive/40"}>
                <CardHeader className="flex flex-row items-center gap-3 pb-3">
                  {state.data.is_valid ? (
                    <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" />
                  ) : (
                    <ShieldAlert className="h-6 w-6 text-destructive" aria-hidden="true" />
                  )}
                  <CardTitle className="text-base">
                    {state.data.is_valid ? "Certificado autêntico e válido" : "Certificado encontrado, porém não vigente"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-muted-foreground">Profissional</dt>
                      <dd className="font-medium text-foreground">{state.data.holder_name}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Certificação</dt>
                      <dd className="font-medium text-foreground">{state.data.certification_name}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Emitido em</dt>
                      <dd className="font-medium text-foreground">{formatDate(state.data.issued_at)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Validade</dt>
                      <dd className="font-medium text-foreground">
                        {state.data.expires_at ? formatDate(state.data.expires_at) : "Sem expiração"}
                      </dd>
                    </div>
                  </dl>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge variant="outline" className="font-mono">{state.data.certificate_code}</Badge>
                    <Badge variant={state.data.is_valid ? "default" : "destructive"}>
                      {state.data.is_valid ? "Vigente" : "Não vigente"}
                    </Badge>
                    {state.data.certification_category && (
                      <Badge variant="secondary">{state.data.certification_category}</Badge>
                    )}
                  </div>
                  {state.data.verification_hash && (
                    <p className="break-all pt-1 font-mono text-[11px] text-muted-foreground">
                      Assinatura: {state.data.verification_hash}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {state.kind === "not-found" && (
            <Card className="border-destructive/40">
              <CardContent className="flex items-center gap-3 py-5 text-sm">
                <ShieldAlert className="h-5 w-5 text-destructive" aria-hidden="true" />
                <span className="text-foreground">
                  Nenhum certificado encontrado para este código. Confira os caracteres e tente novamente.
                </span>
              </CardContent>
            </Card>
          )}

          {state.kind === "error" && (
            <Card className="border-destructive/40">
              <CardContent className="py-5 text-sm text-foreground">{state.message}</CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
