import { cn } from "@/lib/utils";
import { PILLAR_LABELS } from "@/services/climateSurveyService";
import {
  scoreZone,
  ZONE_CLASS,
  type PillarScore,
} from "@/services/engagementDiagnosticsService";

export interface PillarHeatmapProps {
  pillars: PillarScore[];
  favorabilityMode?: boolean;
}

/** Heatmap de pilares — alterna entre nota média e % de favorabilidade. */
export function PillarHeatmap({ pillars, favorabilityMode = false }: PillarHeatmapProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {pillars.map((item) => {
        const zone = scoreZone(item.score);
        const label = PILLAR_LABELS[item.pillar]?.pt ?? item.pillar;
        const value = favorabilityMode
          ? item.favorability !== null
            ? `${item.favorability.toFixed(0)}%`
            : "—"
          : item.score !== null
            ? item.score.toFixed(1)
            : "—";

        return (
          <div
            key={item.pillar}
            className={cn(
              "rounded-xl border p-4 transition-colors",
              ZONE_CLASS[zone],
            )}
          >
            <p className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
            <p className="mt-1 text-[11px] opacity-75">
              {item.respondents} respondentes · {item.answer_count} respostas
            </p>
          </div>
        );
      })}
    </div>
  );
}
