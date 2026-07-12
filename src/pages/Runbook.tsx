import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, ShieldAlert, Wrench, LifeBuoy, ClipboardList, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRunbook, type RunbookStep } from "@/lib/runbooks";

const SEV_STYLE: Record<string, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  high: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  warning: "bg-amber-500/15 text-amber-600 border-amber-500/30",
};

function StepList({ steps, icon, title }: { steps: RunbookStep[]; icon: React.ReactNode; title: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">{icon} {title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={i} className="border-l-2 border-primary/40 pl-3">
              <div className="text-sm font-medium">{i + 1}. {s.title}</div>
              <div className="text-sm text-muted-foreground">{s.detail}</div>
              {s.cmd && (
                <code className="mt-1 inline-block text-xs bg-muted rounded px-2 py-0.5 font-mono">{s.cmd}</code>
              )}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export default function Runbook() {
  const { type = "" } = useParams();
  const rb = getRunbook(type);

  if (!rb) {
    return (
      <div className="container mx-auto p-6 max-w-3xl">
        <Link to="/admin/security-runbook" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Security Runbook
        </Link>
        <Card className="mt-4">
          <CardContent className="p-8 text-center space-y-3">
            <BookOpen className="w-10 h-10 mx-auto text-muted-foreground" />
            <div className="text-lg font-semibold">Runbook não encontrado</div>
            <div className="text-sm text-muted-foreground">Tipo <code>{type}</code> não possui playbook cadastrado ainda.</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin/security-runbook" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <h1 className="text-3xl font-bold mt-1 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary" /> {rb.title}
          </h1>
          <p className="text-muted-foreground text-sm max-w-3xl mt-1">{rb.summary}</p>
        </div>
        <Badge variant="outline" className={SEV_STYLE[rb.severity]}>{rb.severity.toUpperCase()}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Responsável</div>
          <div className="text-sm font-semibold">{rb.owner}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Impacto no SLO</div>
          <div className="text-sm font-semibold">{rb.sloImpact}</div>
        </CardContent></Card>
      </div>

      <StepList steps={rb.diagnose} icon={<ShieldAlert className="w-4 h-4 text-primary" />} title="1. Diagnosticar" />
      <StepList steps={rb.mitigate} icon={<Wrench className="w-4 h-4 text-orange-500" />} title="2. Mitigar" />
      <StepList steps={rb.recover} icon={<LifeBuoy className="w-4 h-4 text-emerald-500" />} title="3. Recuperar" />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><ClipboardList className="w-4 h-4" /> 4. Post-mortem</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            {rb.postmortem.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Links relacionados</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {rb.relatedLinks.map((l) => (
            <Link key={l.href} to={l.href}>
              <Button variant="outline" size="sm">
                <ExternalLink className="w-3.5 h-3.5 mr-1" /> {l.label}
              </Button>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}