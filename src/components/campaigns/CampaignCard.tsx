import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, Target, Trophy, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { SalesCampaign } from "@/services/salesCampaignsService";
import { Link } from "react-router-dom";

interface CampaignCardProps {
  campaign: SalesCampaign;
  className?: string;
}

const STATUS_STYLES: Record<SalesCampaign["status"], string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-primary/15 text-primary border border-primary/30",
  paused: "bg-yellow-500/15 text-yellow-600 border border-yellow-500/30",
  completed: "bg-green-500/15 text-green-600 border border-green-500/30",
  cancelled: "bg-destructive/15 text-destructive border border-destructive/30",
};

const STATUS_LABEL: Record<SalesCampaign["status"], string> = {
  draft: "Rascunho",
  active: "Ativa",
  paused: "Pausada",
  completed: "Concluída",
  cancelled: "Cancelada",
};

export function CampaignCard({ campaign, className }: CampaignCardProps) {
  const pct = campaign.target_global > 0
    ? Math.min(100, Math.round((campaign.progress_global / campaign.target_global) * 100))
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <Link to={`/campanhas/${campaign.id}`} className="block">
        <Card className={cn(
          "relative overflow-hidden p-5 border-border/50 hover:border-primary/40 transition-all backdrop-blur-xl bg-card/60",
          className,
        )}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-foreground truncate">{campaign.name}</h3>
                {campaign.product_name && (
                  <p className="text-sm text-muted-foreground truncate">{campaign.product_name}</p>
                )}
              </div>
              <Badge className={cn("shrink-0", STATUS_STYLES[campaign.status])}>
                {STATUS_LABEL[campaign.status]}
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {format(new Date(campaign.start_date), "dd/MM", { locale: ptBR })} –{" "}
                {format(new Date(campaign.end_date), "dd/MM/yy", { locale: ptBR })}
              </div>
              <div className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" />
                Meta: {campaign.target_individual_default.toLocaleString("pt-BR")} {campaign.metric_unit}
              </div>
              <div className="flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5" />
                {campaign.xp_reward} XP · {campaign.coin_reward} moedas
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Global: {campaign.target_global.toLocaleString("pt-BR")}
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Progresso global</span>
                <span className="font-semibold text-foreground">{pct}%</span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}