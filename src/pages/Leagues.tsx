 import { Trophy, TrendingUp, Shield, History, Star, Zap, Crown, Award, ChevronRight } from "lucide-react";
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
 
   return (
     <PageShell 
       title="Ligas & Divisões" 
       subtitle="Suba nas divisões e prove sua maestria competindo com outros usuários"
       icon={<Shield className="w-6 h-6 text-primary" />}
     >
       <PageWrapper pageName="Ligas">
         <SEOHead
           title="Ligas & Divisões | Gamify"
           description="Participe das ligas semanais e avance nas divisões competindo com outros usuários."
         />
         
           <div className="container max-w-7xl mx-auto p-4 md:p-8 space-y-8 pb-32">
             {isLoading ? (
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                 <div className="lg:col-span-8 space-y-6">
                   <Skeleton className="h-[600px] w-full rounded-3xl" />
                 </div>
                 <div className="lg:col-span-4 space-y-6">
                   <Skeleton className="h-[300px] w-full rounded-3xl" />
                   <Skeleton className="h-[300px] w-full rounded-3xl" />
                 </div>
               </div>
             ) : (
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                 {/* Main Content: League Card & Leaderboard */}
                 <div className="lg:col-span-8 space-y-8">
                   <LeagueCard />
                   
                   {/* Benefits Section */}
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 flex flex-col items-center text-center space-y-3">
                       <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                         <Zap className="w-6 h-6 text-primary" />
                       </div>
                       <h4 className="font-black uppercase text-xs tracking-widest">XP Multiplier</h4>
                       <p className="text-xs text-muted-foreground">Ganhe até 20% mais XP em todas as atividades nas ligas superiores.</p>
                     </div>
                     <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 flex flex-col items-center text-center space-y-3">
                       <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                         <Crown className="w-6 h-6 text-amber-500" />
                       </div>
                       <h4 className="font-black uppercase text-xs tracking-widest">Elite Badges</h4>
                       <p className="text-xs text-muted-foreground">Desbloqueie insígnias exclusivas que aparecem no seu perfil global.</p>
                     </div>
                     <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 flex flex-col items-center text-center space-y-3">
                       <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                         <Award className="w-6 h-6 text-purple-500" />
                       </div>
                       <h4 className="font-black uppercase text-xs tracking-widest">Store Discounts</h4>
                       <p className="text-xs text-muted-foreground">Receba descontos progressivos na Loja de Recompensas.</p>
                     </div>
                   </div>
                 </div>
                 
                 {/* Sidebar: History & Rewards */}
                 <div className="lg:col-span-4 space-y-8">
                   <Card className="border-none bg-card/40 backdrop-blur-xl ring-1 ring-white/10 overflow-hidden">
                     <CardHeader className="bg-white/5 pb-4">
                       <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                         <History className="h-4 w-4 text-primary" />
                         Jornada Competitiva
                       </CardTitle>
                     </CardHeader>
                     <CardContent className="pt-6">
                       {history.length === 0 ? (
                         <EmptyState 
                           icon={History}
                           title="Início da Carreira"
                           description="Suas conquistas e promoções semanais serão eternizadas aqui."
                           compact
                         />
                       ) : (
                         <div className="space-y-4">
                           {history.map((entry: LeagueHistory) => (
                             <div key={entry.id} className="relative pl-6 pb-2 border-l-2 border-primary/20 last:border-0 last:pb-0">
                               <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-card ring-2 ring-primary flex items-center justify-center">
                                 <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                               </div>
                               <div className="flex flex-col">
                                 <div className="flex items-center justify-between">
                                   <span className="text-sm font-black uppercase tracking-tight italic">
                                     {entry.change_type === "promotion" ? "⬆️ Promoção" : entry.change_type === "demotion" ? "⬇️ Rebaixado" : "➡️ Permanência"}
                                   </span>
                                   <span className="text-[10px] font-bold text-muted-foreground opacity-70">SEMANA PASSADA</span>
                                 </div>
                                 <div className="flex items-center gap-2 mt-1">
                                   <Badge variant="secondary" className="text-[10px] font-black">{entry.weekly_xp} XP</Badge>
                                   <span className="text-[10px] text-muted-foreground font-medium">Performance de Elite</span>
                                 </div>
                               </div>
                             </div>
                           ))}
                         </div>
                       )}
                     </CardContent>
                   </Card>
 
                   <Card className="border-none bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/30 overflow-hidden">
                     <CardContent className="p-6 space-y-4">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow-sm">
                           <Star className="w-5 h-5 text-white fill-white" />
                         </div>
                         <div>
                           <h4 className="font-black uppercase text-sm tracking-tight">Status Pro</h4>
                           <p className="text-[10px] text-primary/80 font-bold uppercase tracking-widest">Benefícios Ativos</p>
                         </div>
                       </div>
                       <div className="space-y-2">
                         <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                           <span className="text-xs font-bold">XP Diário Boost</span>
                           <Badge className="bg-green-500 font-black">+10%</Badge>
                         </div>
                         <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                           <span className="text-xs font-bold">Inscrição em Torneios</span>
                           <Badge className="bg-primary font-black">GRÁTIS</Badge>
                         </div>
                       </div>
                       <button className="w-full py-3 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-glow hover:scale-[1.02] transition-transform">
                         Ver Todas as Divisões <ChevronRight className="w-4 h-4 inline-block ml-1" />
                       </button>
                     </CardContent>
                   </Card>
                 </div>
               </div>
             )}
           </div>
       </PageWrapper>
     </PageShell>
   );
 }