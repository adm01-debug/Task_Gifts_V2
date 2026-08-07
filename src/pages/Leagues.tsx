 import { Trophy, TrendingUp, Shield, History, Star, Zap, Crown, Award, ChevronRight } from "lucide-react";
 import { motion } from "framer-motion";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
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
   import { Progress } from "@/components/ui/progress";
 
 export default function Leagues() {
   const navigate = useNavigate();
   const isMobile = useIsMobile();
   const { myLeague, leaderboard, history, isLoading, error } = useLeagues();
 
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
         
            <div className="container max-w-7xl mx-auto p-4 md:p-10 space-y-12 pb-32 relative">
              {/* Ambient background elements */}
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 blur-[150px] pointer-events-none" />
              <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-primary/5 blur-[120px] pointer-events-none" />

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
             ) : error ? (
               <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8">
                 <h3 className="text-lg font-black uppercase tracking-wider text-destructive">
                   Não foi possível carregar as ligas
                 </h3>
                 <p className="mt-2 text-sm text-muted-foreground">
                   {(error as Error)?.message ?? "Erro desconhecido."}
                 </p>
               </div>
             ) : (
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                 {/* Main Content: League Card & Leaderboard */}
                 <div className="lg:col-span-8 space-y-8">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                    >
                      <LeagueCard />
                    </motion.div>
                    
                    {/* Benefits Section */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 px-2">
                        <Shield className="w-5 h-5 text-primary" />
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-foreground">Divisional Perks</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                          { icon: Zap, title: "XP Multiplier", desc: "Protocolo de aceleração de crescimento. Ganhe até 20% mais XP em todas as atividades.", color: "primary" },
                          { icon: Crown, title: "Elite Badges", desc: "Reconhecimento visual de alto escalão. Insígnias holográficas exclusivas no perfil.", color: "amber-500" },
                          { icon: Award, title: "Store Discounts", desc: "Mercado negro corporativo. Receba descontos em itens raros na Loja.", color: "purple-500" }
                        ].map((benefit, i) => (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + i * 0.1 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="p-8 rounded-[2rem] bg-white/5 backdrop-blur-2xl border border-white/5 flex flex-col items-center text-center space-y-5 hover:border-primary/40 hover:bg-white/[0.08] transition-all shadow-2xl group relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                              <benefit.icon className="w-16 h-16" />
                            </div>
                            <div className={`w-16 h-16 rounded-2xl bg-${benefit.color}/20 flex items-center justify-center shadow-glow-sm transform group-hover:rotate-6 transition-transform border border-${benefit.color}/30`}>
                              <benefit.icon className={`w-8 h-8 text-${benefit.color}`} />
                            </div>
                            <h4 className="font-black uppercase text-xs tracking-[0.25em] text-foreground group-hover:text-primary transition-colors">{benefit.title}</h4>
                            <p className="text-[11px] text-muted-foreground leading-relaxed font-medium uppercase tracking-wider">{benefit.desc}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                 </div>
                 
                 {/* Sidebar: History & Rewards */}
                 <div className="lg:col-span-4 space-y-8">
                    <Card className="border-none bg-white/5 backdrop-blur-3xl ring-1 ring-white/10 overflow-hidden rounded-[2.5rem] shadow-2xl">
                      <CardHeader className="bg-white/5 py-6 px-8 border-b border-white/5">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3 text-primary">
                            <History className="h-4 w-4" />
                            Field Reports
                          </CardTitle>
                          <Badge variant="outline" className="border-primary/20 text-[8px] font-black uppercase tracking-widest text-primary/60">Archive v2.0</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-8">
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
                              <div key={entry.id} className="relative pl-8 pb-8 border-l border-primary/20 last:border-0 last:pb-0">
                                <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-background ring-2 ring-primary flex items-center justify-center">
                                  <div className="w-1 h-1 rounded-full bg-primary animate-pulse shadow-glow" />
                               </div>
                                <div className="flex flex-col gap-3">
                                 <div className="flex items-center justify-between">
                                    <span className={`text-[11px] font-black uppercase tracking-[0.15em] italic ${entry.change_type === 'promotion' ? 'text-emerald-500' : 'text-red-500'}`}>
                                      {entry.change_type === "promotion" ? "PROMOTION" : entry.change_type === "demotion" ? "REASSIGNED" : "MAINTAINED"}
                                   </span>
                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">PREVIOUS CYCLE</span>
                                 </div>
                                  <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                      <Badge variant="secondary" className="text-[10px] font-black bg-primary/20 text-primary border-primary/30 py-1 px-3 italic">{entry.weekly_xp} INTEL</Badge>
                                      <span className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter">Elite Performance</span>
                                   </div>
                                    <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                      <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, (entry.weekly_xp / 1000) * 100)}%` }}
                                        className="h-full bg-primary shadow-glow-sm"
                                      />
                                    </div>
                                 </div>
                               </div>
                             </div>
                           ))}
                         </div>
                       )}
                     </CardContent>
                   </Card>
 
                    <Card className="border-none bg-gradient-to-br from-primary/30 to-primary/5 ring-1 ring-primary/40 overflow-hidden rounded-[2.5rem] shadow-[0_0_50px_rgba(var(--primary-rgb),0.1)]">
                      <CardContent className="p-8 space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-glow">
                            <Star className="w-6 h-6 text-white fill-white" />
                         </div>
                          <div className="space-y-1">
                            <h4 className="font-black uppercase text-sm tracking-[0.2em] text-foreground">Premium Status</h4>
                            <p className="text-[10px] text-primary/70 font-black uppercase tracking-widest">Active Protocols</p>
                         </div>
                       </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/10 backdrop-blur-md">
                            <span className="text-[11px] font-black uppercase tracking-widest">Daily XP Yield</span>
                           <Badge className="bg-green-500 font-black">+10%</Badge>
                         </div>
                          <div className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/10 backdrop-blur-md">
                            <span className="text-[11px] font-black uppercase tracking-widest">Tournament Fee</span>
                           <Badge className="bg-primary font-black">GRÁTIS</Badge>
                         </div>
                       </div>
                        <motion.button 
                          whileHover={{ scale: 1.02, boxShadow: "0 0 28px rgba(var(--primary-rgb), 0.7)" }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full py-4 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-[0.3em] shadow-glow flex items-center justify-center gap-2 transition-all"
                        >
                          Analyze All Divisions <ChevronRight className="w-4 h-4" />
                        </motion.button>
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