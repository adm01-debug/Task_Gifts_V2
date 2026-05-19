import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
 import { Coins, Package, Star, Target, ShoppingBag, History, Sparkles, ShoppingCart, LayoutGrid, List, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CelebrationEffect } from "@/components/CelebrationEffect";
import { FlashSalesBanner } from "@/components/FlashSalesBanner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useShopRewards, usePurchaseReward } from "@/hooks/useShop";
import { useProfile } from "@/hooks/useProfiles";
import { useAuth } from "@/hooks/useAuth";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { shopService, type ShopReward, type RewardCategory } from "@/services/shopService";
import { cn } from "@/lib/utils";
 import { PageShell } from "@/components/navigation";
 import { SEOHead } from "@/components/SEOHead";
 import { useSEO } from "@/hooks/useSEO";
import { RewardCard } from "@/components/shop/RewardCard";
import { PurchaseHistory } from "@/components/shop/PurchaseHistory";
 import { Skeleton } from "@/components/ui/skeleton";
 import { EmptyState } from "@/components/ui/empty-state";

export default function Shop() {
  const seoConfig = useSEO();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id ?? "");
  const { data: rewards, isLoading } = useShopRewards();
  const purchaseMutation = usePurchaseReward();
  const { playEpicCelebrationSound, playLegendaryCelebrationSound } = useSoundEffects();
  const [selectedReward, setSelectedReward] = useState<ShopReward | null>(null);
  const [activeCategory, setActiveCategory] = useState<"all" | RewardCategory>("all");
  const [celebration, setCelebration] = useState<{ active: boolean; type: "epic" | "legendary" } | null>(null);
  const [purchasingRewardId, setPurchasingRewardId] = useState<string | null>(null);
  const isScrolled = useScrollHeader(10);

  const triggerCelebration = useCallback((rarity: string) => {
    if (rarity === "legendary") { setCelebration({ active: true, type: "legendary" }); playLegendaryCelebrationSound(); }
    else if (rarity === "epic") { setCelebration({ active: true, type: "epic" }); playEpicCelebrationSound(); }
  }, [playEpicCelebrationSound, playLegendaryCelebrationSound]);

  const userCoins = profile?.coins ?? 0;
  const filteredRewards = activeCategory === "all" ? rewards : rewards?.filter((r) => r.category === activeCategory);

  const handlePurchase = (reward: ShopReward) => setSelectedReward(reward);

  const confirmPurchase = () => {
    if (!selectedReward) return;
    const rewardRarity = selectedReward.rarity;
    const rewardId = selectedReward.id;
    setPurchasingRewardId(rewardId);
    purchaseMutation.mutate({ rewardId }, {
      onSuccess: () => { setSelectedReward(null); triggerCelebration(rewardRarity); },
      onSettled: () => setPurchasingRewardId(null),
    });
  };

   return (
     <PageShell 
       title="Loja de Recompensas" 
       subtitle="Troque suas moedas por produtos e benefícios exclusivos"
       icon={<Sparkles className="w-6 h-6 text-amber-500" />}
     >
       <SEOHead title={seoConfig.title} description={seoConfig.description} keywords={seoConfig.keywords} />
       {celebration && <CelebrationEffect isActive={celebration.active} type={celebration.type} onComplete={() => setCelebration(null)} />}
 
       <div className="max-w-6xl mx-auto p-4 md:p-6">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#1a1c2c] to-[#0d0e14] p-1 shadow-2xl ring-1 ring-white/10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-transparent to-primary/20 opacity-50" />
            
            <div className="relative bg-[#0d0e14]/90 backdrop-blur-3xl rounded-[2.4rem] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full opacity-20 blur-xl"
                  />
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.3)] ring-1 ring-white/20">
                    <Coins className="w-10 h-10 md:w-12 md:h-12 text-white fill-white animate-pulse" />
                  </div>
                </div>
                
                <div className="text-center md:text-left">
                  <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-amber-500/80 mb-2">Seu Tesouro Acumulado</p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white drop-shadow-2xl">
                      {userCoins.toLocaleString()}
                    </h2>
                    <span className="text-lg md:text-2xl font-black text-amber-500 uppercase tracking-tighter italic">Tokens</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hidden lg:block">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Status da Carteira</p>
                  <p className="text-sm font-black text-green-500 flex items-center gap-2">
                    <Star className="w-3 h-3 fill-green-500" /> NÍVEL ELITE ATIVO
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/estatisticas')}
                  className="w-full sm:w-auto h-14 px-8 rounded-2xl border-white/10 hover:bg-white/5 font-black uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95"
                >
                  Histórico de Ganhos
                </Button>
              </div>
            </div>
          </motion.div>
         <div className="space-y-12">
           <FlashSalesBanner onPurchase={(rewardId) => { const reward = rewards?.find(r => r.id === rewardId); if (reward) handlePurchase(reward); }} />
           
           <Tabs defaultValue="shop" className="space-y-8">
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
               <TabsList className="h-16 p-2 bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-white/5 w-fit">
                 <TabsTrigger value="shop" className="px-8 h-12 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase text-[10px] tracking-widest gap-3 transition-all">
                   <ShoppingBag className="w-4 h-4" /> RECURSOS DISPONÍVEIS
                 </TabsTrigger>
                 <TabsTrigger value="history" className="px-8 h-12 rounded-xl data-[state=active]:bg-zinc-800 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest gap-3 transition-all">
                   <History className="w-4 h-4" /> ARQUIVO DE AQUISIÇÕES
                 </TabsTrigger>
               </TabsList>

               <div className="flex items-center gap-3">
                 <div className="hidden sm:flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-900/50 border border-white/5">
                   <Filter className="w-3.5 h-3.5 text-zinc-500" />
                   <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Filtragem_Ativa</span>
                 </div>
               </div>
             </div>

             <TabsContent value="shop" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex flex-wrap items-center gap-3 p-2 bg-zinc-900/30 rounded-2xl border border-white/5 w-fit">
                 {[
                   { id: "all", label: "TODOS", icon: LayoutGrid },
                   { id: "product", label: "PRODUTOS", icon: Package },
                   { id: "benefit", label: "BENEFÍCIOS", icon: Star },
                   { id: "experience", label: "EXPERIÊNCIAS", icon: Target },
                 ].map((cat) => (
                   <Button 
                     key={cat.id}
                     variant={activeCategory === cat.id ? "default" : "ghost"} 
                     size="sm" 
                     onClick={() => setActiveCategory(cat.id as any)}
                     className={cn(
                       "h-10 px-6 rounded-xl font-black text-[10px] tracking-widest gap-2 transition-all",
                       activeCategory === cat.id ? "shadow-lg shadow-primary/20" : "text-zinc-500 hover:text-white hover:bg-white/5"
                     )}
                   >
                     <cat.icon className="w-3.5 h-3.5" />
                     {cat.label}
                   </Button>
                 ))}
               </div>

               {isLoading ? (
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                     {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} className="h-[400px] rounded-[2.5rem] bg-zinc-900/50" />)}
                   </div>
                ) : filteredRewards && filteredRewards.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   <AnimatePresence mode="popLayout">
                      {filteredRewards.map((reward) => (
                       <RewardCard key={reward.id} reward={reward} userCoins={userCoins} onPurchase={handlePurchase} purchasingRewardId={purchasingRewardId} />
                     ))}
                   </AnimatePresence>
                 </div>
                ) : (
                  <div className="py-20">
                    <EmptyState 
                      icon={ShoppingCart}
                      title="Módulos Indisponíveis"
                      description="O estoque desta categoria está atualmente em manutenção. Nossos agentes estão reabastecendo o sistema."
                      action={{ label: "VOLTAR PARA O INVENTÁRIO COMPLETO", onClick: () => setActiveCategory("all") }}
                    />
                  </div>
                )}
             </TabsContent>
             <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <PurchaseHistory />
             </TabsContent>
           </Tabs>
         </div>
       </div>
 
        <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
          <DialogContent className="max-w-md bg-[#0d0e14] border-white/10 p-0 overflow-hidden rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
            
            <div className="p-8 space-y-8 relative">
              <DialogHeader className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Protocolo_de_Aquisição</span>
                </div>
                <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter text-white">Confirmar Resgate</DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Autorização necessária para transferência de ativos digitais
                </DialogDescription>
              </DialogHeader>

              {selectedReward && (
                <div className="space-y-6">
                  <div className="flex items-center gap-6 p-4 rounded-2xl bg-white/5 border border-white/5 ring-1 ring-white/5">
                    <div className={cn(
                      "w-20 h-20 rounded-2xl flex items-center justify-center text-3xl shadow-2xl relative overflow-hidden",
                      selectedReward.rarity === "legendary" ? "bg-gradient-to-br from-amber-400 to-orange-600" : 
                      selectedReward.rarity === "epic" ? "bg-gradient-to-br from-purple-500 to-pink-600" : 
                      selectedReward.rarity === "rare" ? "bg-gradient-to-br from-blue-500 to-cyan-600" : "bg-zinc-800"
                    )}>
                      <div className="absolute inset-0 bg-white/10 pointer-events-none" />
                      {shopService.getCategoryConfig(selectedReward.category).icon}
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-black uppercase italic tracking-tighter text-xl text-white">{selectedReward.name}</h3>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight line-clamp-2">{selectedReward.description}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/50 border border-white/5">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Custo Operacional</span>
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-amber-500" />
                        <span className="text-xl font-black italic tracking-tighter text-white">{selectedReward.price_coins.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/50 border border-white/5">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Saldo Remanescente</span>
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-zinc-600" />
                        <span className="text-xl font-black italic tracking-tighter text-zinc-400">{(userCoins - selectedReward.price_coins).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedReward(null)}
                  className="h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest text-zinc-500 hover:text-white hover:bg-white/5"
                >
                  Abortar
                </Button>
                <Button 
                  onClick={confirmPurchase} 
                  disabled={purchaseMutation.isPending} 
                  className="h-14 flex-1 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] bg-white text-black hover:bg-zinc-200 transition-all active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                >
                  {purchaseMutation.isPending ? "SINCRONIZANDO..." : "CONFIRMAR AQUISIÇÃO"}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
     </PageShell>
   );
 }
