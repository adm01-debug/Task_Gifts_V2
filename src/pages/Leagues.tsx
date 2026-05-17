 import { Trophy, TrendingUp, Shield, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLeagues } from "@/hooks/useLeagues";
import { useNavigate } from "react-router-dom";
import { LeagueCard } from "@/components/LeagueCard";
import type { LeagueHistory } from "@/services/leaguesService";
 import { PageWrapper } from "@/components/PageWrapper";
 import { SEOHead } from "@/components/SEOHead";
 import { useIsMobile } from "@/hooks/use-mobile";
  import { MobilePageLayout } from "@/components/mobile";
  import { PageShell } from "@/components/navigation";
  import { EmptyState } from "@/components/ui/empty-state";
  import { Skeleton } from "@/components/ui/skeleton";

export default function Leagues() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { myLeague, leaderboard, history, isLoading } = useLeagues();

  const pageContent = (
     <PageWrapper pageName="Ligas">
       <SEOHead
         title="Ligas & Divisões | Gamify"
         description="Participe das ligas semanais e avance nas divisões competindo com outros usuários."
       />
       <header className="px-4 py-6 border-b border-border/50 mb-6 flex items-center gap-3">
         <div className="p-3 rounded-xl bg-primary/10">
           <Shield className="w-8 h-8 text-primary" />
         </div>
         <div>
           <h1 className="text-3xl font-bold">Ligas & Divisões</h1>
           <p className="text-muted-foreground text-sm">Suba nas divisões e prove sua maestria</p>
         </div>
       </header>

        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-24">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-[400px] w-full rounded-xl" />
              <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LeagueCard />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Histórico de Ligas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {history.length === 0 ? (
                    <EmptyState 
                      icon={History}
                      title="Nenhum histórico"
                      description="Suas participações em ligas aparecerão aqui ao final de cada semana."
                      compact
                    />
                  ) : (
                    <div className="space-y-2">
                      {history.map((entry: LeagueHistory) => (
                        <div key={entry.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <span>{entry.change_type === "promotion" ? "⬆️ Promovido" : entry.change_type === "demotion" ? "⬇️ Rebaixado" : "➡️ Mantido"}</span>
                          <span className="text-sm text-muted-foreground">{entry.weekly_xp} XP</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
     </PageWrapper>
   );
 
   return (
     <PageShell title="Ligas">
       {pageContent}
     </PageShell>
   );
}