import { cn } from "@/lib/utils";
import { scoreZone, ZONE_CLASS, ZONE_LABEL } from "@/services/engagementDiagnosticsService";

export interface ScoreBadgeProps extends React.ComponentProps<"span"> {
  score: number | null | undefined;
  showLabel?: boolean;
}

/** Badge de nota 0..10 com cor derivada da zona (tokens semânticos). */
export function ScoreBadge({ score, showLabel = true, className, ...props }: ScoreBadgeProps) {
  const zone = scoreZone(score);
  const value = typeof score === "number" && Number.isFinite(score) ? score.toFixed(1) : "—";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        ZONE_CLASS[zone],
        className,
      )}
      {...props}
    >
      {value}
      {showLabel && <span className="font-normal opacity-80">{ZONE_LABEL[zone]}</span>}
    </span>
  );
}
