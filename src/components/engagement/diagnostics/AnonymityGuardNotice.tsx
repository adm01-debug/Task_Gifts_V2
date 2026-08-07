import { ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MIN_RESPONDENTS } from "@/services/engagementDiagnosticsService";

/** Exibido quando o recorte não atinge o mínimo de respondentes. */
export function AnonymityGuardNotice({ context }: { context?: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
        <ShieldCheck className="h-8 w-8 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium">Resultados protegidos por anonimato</p>
        <p className="max-w-md text-xs text-muted-foreground">
          {context ? `${context} ` : ""}
          É necessário no mínimo {MIN_RESPONDENTS} respondentes no recorte selecionado para exibir
          qualquer resultado. Amplie o período ou escolha um recorte maior.
        </p>
      </CardContent>
    </Card>
  );
}
