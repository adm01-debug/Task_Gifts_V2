import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RISK_LEVEL_CLASS, RISK_LEVEL_LABEL, type Nr1RiskLevel } from "@/services/nr1RiskService";

export interface RiskLevelBadgeProps {
  level: Nr1RiskLevel;
  className?: string;
}

export function RiskLevelBadge({ level, className }: RiskLevelBadgeProps) {
  return (
    <Badge variant="outline" className={cn("border", RISK_LEVEL_CLASS[level], className)}>
      Risco {RISK_LEVEL_LABEL[level]}
    </Badge>
  );
}
