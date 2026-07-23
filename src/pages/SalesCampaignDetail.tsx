import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSalesCampaign } from "@/hooks/useSalesCampaigns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Check, X, Target, Trophy, TrendingUp, Users, Sparkles } from "lucide-react";
import { UserPlus } from "lucide-react";
import { useRBAC } from "@/hooks/useRBAC";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function SalesCampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const {
    campaign,
    participants,
    myParticipation,
    isLoading,
    accept,
    decline,
    logProgress,
    isLoggingProgress,
    bulkEnroll,
    isBulkEnrolling,
  } = useSalesCampaign(id);
  const { isAdmin } = useRBAC();
  const [delta, setDelta] = useState("");

  useEffect(() => {
    document.title = campaign ? `${campaign.name} | Campanhas` : "Campanha";
  }, [campaign]);

  if (isLoading || !campaign) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const globalPct = campaign.target_global > 0
    ? Math.min(100, Math.round((campaign.progress_global / campaign.target_global) * 100))
    : 0;
  const myPct = myParticipation?.progress_percent ?? 0;

  const handleLogProgress = () => {
    const n = Number(delta);
    if (!n || Number.isNaN(n)) return;
    logProgress({ delta: n });
    setDelta("");
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 pb-24 space-y-6">
      <Link to="/campanhas" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      {/* Hero */}
      <Card className="p-6 relative overflow-hidden bg-gradient-to-br from-primary/10 via-card to-accent/10 border-primary/20">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-primary text-xs font-semibold mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              CAMPANHA · {campaign.metric_key.replace("_", " ").toUpperCase()}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">{campaign.name}</h1>
            {campaign.product_name && (
              <p className="text-muted-foreground mt-1">{campaign.product_name} {campaign.sku ? `· ${campaign.sku}` : ""}</p>
            )}
            {campaign.description && (
              <p className="mt-3 text-sm leading-relaxed max-w-2xl">{campaign.description}</p>
            )}
          </div>
          <Badge variant="outline" className="text-sm">
            {format(new Date(campaign.start_date), "dd MMM", { locale: ptBR })} –{" "}
            {format(new Date(campaign.end_date), "dd MMM yyyy", { locale: ptBR })}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div>
            <div className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />Meta global</div>
            <div className="text-lg font-bold mt-1">{campaign.target_global.toLocaleString("pt-BR")}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground flex items-center gap-1"><Target className="h-3 w-3" />Meta individual</div>
            <div className="text-lg font-bold mt-1">{campaign.target_individual_default.toLocaleString("pt-BR")}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground flex items-center gap-1"><Trophy className="h-3 w-3" />Prêmio</div>
            <div className="text-lg font-bold mt-1">{campaign.xp_reward} XP · {campaign.coin_reward} 🪙</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" />Progresso global</div>
            <div className="text-lg font-bold mt-1">{globalPct}%</div>
          </div>
        </div>

        <div className="mt-4">
          <Progress value={globalPct} className="h-3" />
        </div>
      </Card>

      {/* My participation */}
      <Card className="p-6">
        <h2 className="text-lg font-bold mb-4">Sua meta</h2>

        {!myParticipation || (!myParticipation.accepted_at && !myParticipation.declined_at) ? (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Aceite sua meta de <strong>{campaign.target_individual_default.toLocaleString("pt-BR")} {campaign.metric_unit}</strong> e comece a competir.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => accept(undefined)} className="gap-2">
                <Check className="h-4 w-4" /> Aceitar meta
              </Button>
              <Button variant="outline" onClick={() => decline()} className="gap-2">
                <X className="h-4 w-4" /> Recusar
              </Button>
            </div>
          </div>
        ) : myParticipation.declined_at ? (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-muted-foreground">
              Você recusou esta meta. Mudou de ideia?
            </p>
            <Button onClick={() => accept(undefined)} className="gap-2">
              <Check className="h-4 w-4" /> Aceitar agora
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {myParticipation.progress.toLocaleString("pt-BR")}
                  <span className="text-muted-foreground text-base font-normal"> / {myParticipation.target_adjusted.toLocaleString("pt-BR")} {campaign.metric_unit}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {myParticipation.rank_position ? `Posição #${myParticipation.rank_position}` : "Sem ranking ainda"}
                </div>
              </div>
              <div className={cn(
                "text-3xl font-black",
                myPct >= 100 ? "text-green-500" : "text-primary",
              )}>
                {myPct}%
              </div>
            </div>
            <Progress value={myPct} className="h-3" />

            <div className="flex gap-2 pt-2 border-t">
              <Input
                type="number"
                placeholder="Registrar novo progresso (delta)"
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
              />
              <Button onClick={handleLogProgress} disabled={isLoggingProgress || !delta}>
                Registrar
              </Button>
            </div>

            {myParticipation.completed_at && (
              <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-4 text-sm">
                🏆 <strong>Meta concluída!</strong> Você recebeu {myParticipation.xp_earned} XP e {myParticipation.coins_earned} moedas.
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Ranking */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="text-lg font-bold">Ranking</h2>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (
                  window.confirm(
                    campaign.department_id
                      ? "Enrollar em massa todos os membros do departamento nesta campanha?"
                      : "Enrollar em massa TODOS os usuários da organização nesta campanha?",
                  )
                ) {
                  bulkEnroll();
                }
              }}
              disabled={isBulkEnrolling}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {isBulkEnrolling ? "Enrollando..." : "Enrollar em massa"}
            </Button>
          )}
        </div>
        {participants.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Ninguém aceitou a meta ainda. Seja o primeiro!
          </p>
        ) : (
          <div className="space-y-2">
            {participants
              .filter((p) => p.accepted_at)
              .map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors",
                    p.user_id === myParticipation?.user_id ? "bg-primary/5 border-primary/30" : "border-border/50",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                      p.rank_position === 1 ? "bg-yellow-400 text-yellow-950" :
                      p.rank_position === 2 ? "bg-gray-300 text-gray-800" :
                      p.rank_position === 3 ? "bg-orange-400 text-orange-950" :
                      "bg-muted text-muted-foreground",
                    )}>
                      {p.rank_position ?? "-"}
                    </div>
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={p.profile?.avatar_url ?? undefined} alt={p.profile?.display_name ?? "Participante"} />
                      <AvatarFallback>
                        {(p.profile?.display_name ?? "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">
                        {p.user_id === myParticipation?.user_id
                          ? "Você"
                          : p.profile?.display_name ?? "Participante"}
                        {p.profile?.level != null && (
                          <span className="ml-2 text-xs text-muted-foreground">Nv. {p.profile.level}</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.progress.toLocaleString("pt-BR")} / {p.target_adjusted.toLocaleString("pt-BR")}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-bold">{p.progress_percent}%</div>
                </div>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}