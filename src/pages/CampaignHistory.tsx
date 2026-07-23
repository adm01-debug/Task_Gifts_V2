import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Coins, Sparkles, Calendar, ArrowLeft, Medal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { logger } from "@/services/loggingService";

interface CompletedCampaignRow {
  id: string;
  campaign_id: string;
  completed_at: string | null;
  progress: number;
  target_adjusted: number;
  xp_earned: number;
  coins_earned: number;
  rank_position: number | null;
  campaign: {
    name: string;
    product_name: string | null;
    metric_unit: string;
    end_date: string;
    cover_image_url: string | null;
  } | null;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function rankMedal(position: number | null): string | null {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";
  return null;
}

export default function CampaignHistory() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Histórico de Campanhas | Gamificação";
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["campaign-history", user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async (): Promise<CompletedCampaignRow[]> => {
      const { data, error } = await supabase
        .from("campaign_participants")
        .select(
          "id, campaign_id, completed_at, progress, target_adjusted, xp_earned, coins_earned, rank_position, campaign:sales_campaigns(name, product_name, metric_unit, end_date, cover_image_url)"
        )
        .eq("user_id", user!.id)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false });

      if (error) {
        logger.error("CampaignHistory: falha ao carregar histórico", "CampaignHistory", error);
        throw error;
      }
      return (data as unknown as CompletedCampaignRow[]) || [];
    },
  });

  const totals = useMemo(() => {
    const rows = data || [];
    return {
      count: rows.length,
      xp: rows.reduce((sum, r) => sum + (r.xp_earned || 0), 0),
      coins: rows.reduce((sum, r) => sum + (r.coins_earned || 0), 0),
      podium: rows.filter((r) => (r.rank_position || 99) <= 3).length,
    };
  }, [data]);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 pb-24">
      <header className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
          <Link to="/campanhas">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar para campanhas
          </Link>
        </Button>
        <div className="flex items-center gap-2 text-primary text-sm font-semibold mb-1">
          <Sparkles className="h-4 w-4" />
          Suas conquistas
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Histórico de Campanhas</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Todas as metas que você concluiu, com recompensas, posições e datas de conclusão.
        </p>
      </header>

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <SummaryCard icon={<Trophy className="h-5 w-5" />} label="Metas batidas" value={totals.count} />
        <SummaryCard icon={<Sparkles className="h-5 w-5" />} label="XP conquistado" value={totals.xp.toLocaleString("pt-BR")} />
        <SummaryCard icon={<Coins className="h-5 w-5" />} label="Moedas" value={totals.coins.toLocaleString("pt-BR")} />
        <SummaryCard icon={<Medal className="h-5 w-5" />} label="Pódios (Top 3)" value={totals.podium} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center border-destructive/40">
          <p className="text-destructive font-medium">Não foi possível carregar o histórico.</p>
          <p className="text-sm text-muted-foreground mt-1">Tente novamente em alguns instantes.</p>
        </Card>
      ) : !data || data.length === 0 ? (
        <Card className="p-10 text-center border-dashed">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-semibold">Ainda sem metas concluídas</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Participe de uma campanha ativa e registre seu progresso — quando bater a meta ela aparecerá aqui.
          </p>
          <Button asChild className="mt-4">
            <Link to="/campanhas">Ver campanhas ativas</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.map((row, idx) => {
            const medal = rankMedal(row.rank_position);
            const name = row.campaign?.name || "Campanha";
            return (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Link to={`/campanhas/${row.campaign_id}`} className="block group">
                  <Card className="p-4 md:p-5 hover:border-primary/40 hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center text-2xl">
                        {medal || <Trophy className="h-5 w-5 text-amber-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="min-w-0">
                            <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                              {name}
                            </h3>
                            {row.campaign?.product_name && (
                              <p className="text-xs text-muted-foreground truncate">
                                {row.campaign.product_name}
                              </p>
                            )}
                          </div>
                          {row.rank_position && (
                            <Badge variant="secondary" className="shrink-0">
                              {medal ? `${medal} ` : "#"}{row.rank_position}º lugar
                            </Badge>
                          )}
                        </div>
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <Stat label="Progresso" value={`${row.progress}${row.campaign?.metric_unit ? ` ${row.campaign.metric_unit}` : ""}`} />
                          <Stat label="Meta" value={`${row.target_adjusted}${row.campaign?.metric_unit ? ` ${row.campaign.metric_unit}` : ""}`} />
                          <Stat label="XP" value={`+${row.xp_earned}`} accent="text-primary" />
                          <Stat label="Moedas" value={`+${row.coins_earned}`} accent="text-amber-500" />
                        </div>
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Concluída em {formatDate(row.completed_at)}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
    </Card>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className={`font-semibold ${accent || ""}`}>{value}</div>
    </div>
  );
}