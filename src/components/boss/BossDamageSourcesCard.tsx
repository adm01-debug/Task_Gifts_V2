import { BookCheck, CalendarCheck, ListChecks, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BossDamageRules } from "@/lib/bossBattle";

export interface BossDamageSourcesCardProps {
  rules: BossDamageRules;
  perUserCap: number;
}

const SOURCES = [
  {
    key: "task_score" as const,
    icon: ListChecks,
    title: "Tarefa entregue no prazo",
    hint: "Sem atraso e sem retrabalho. Cada tarefa golpeia uma única vez.",
  },
  {
    key: "trail_completion" as const,
    icon: BookCheck,
    title: "Trilha concluída",
    hint: "O golpe acontece ao finalizar a trilha pela primeira vez.",
  },
  {
    key: "attendance" as const,
    icon: CalendarCheck,
    title: "Presença pontual",
    hint: "Um golpe por dia de check-in dentro do horário.",
  },
  {
    key: "quiz" as const,
    icon: Zap,
    title: "Quiz respondido",
    hint: "Acertos em quizzes também reduzem o HP coletivo.",
  },
];

/**
 * Torna transparente a economia do chefão: o dano é 100% automático e
 * calculado no servidor. Mostrar os valores evita a sensação de "caixa-preta"
 * e direciona o comportamento (entregar no prazo vale mais que entregar).
 */
export function BossDamageSourcesCard({ rules, perUserCap }: BossDamageSourcesCardProps) {
  const active = SOURCES.filter((s) => (rules.base[s.key] ?? 0) > 0);
  if (active.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Como causar dano</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          O dano é automático: assim que a entrega é registrada no sistema, o golpe acontece sozinho.
        </p>
        <ul className="space-y-2">
          {active.map(({ key, icon: Icon, title, hint }) => (
            <li
              key={key}
              className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/60 p-3"
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">{hint}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-destructive">
                -{(rules.base[key] ?? 0).toLocaleString("pt-BR")} HP
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Combo multiplica o golpe em até {Math.max(rules.maxMultiplier, 1)}x
          {perUserCap > 0
            ? ` · limite de ${perUserCap.toLocaleString("pt-BR")} de dano por pessoa nesta batalha.`
            : "."}
        </p>
      </CardContent>
    </Card>
  );
}