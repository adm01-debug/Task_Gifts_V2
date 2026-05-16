import { Trophy, TrendingUp } from "lucide-react";
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

export default function Leagues() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { myLeague, leaderboard, history, isLoading } = useLeagues();

  const pageContent = (
    <>
      <SEOHead
        title="Ligas & Divisões | Gamify"
        description="Participe das ligas semanais e avance nas divisões competindo com outros usuários."
      />
      <main className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-24">
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
                <p className="text-muted-foreground text-center py-8">Nenhum histórico ainda</p>
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
      </main>
    </>
  );

   return (
     <PageShell title="Ligas & Divisões">
       <PageWrapper pageName="Ligas" className="min-h-screen bg-background">
         {isMobile ? (
           <MobilePageLayout title="Ligas & Divisões" icon={Trophy} backPath="/">
             {pageContent}
           </MobilePageLayout>
         ) : (
           <>
             <header className="flex h-16 shrink-0 items-center gap-2 px-4 md:px-6">
               <Trophy className="h-6 w-6 text-primary" />
               <h1 className="text-xl font-bold">Ligas & Divisões</h1>
             </header>
             {pageContent}
           </>
         )}
       </PageWrapper>
     </PageShell>
   );
}