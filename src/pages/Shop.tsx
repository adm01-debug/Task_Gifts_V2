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
         <Tabs defaultValue="shop" className="space-y-6">
           <TabsList className="grid w-full max-w-md grid-cols-2">
             <TabsTrigger value="shop" className="flex items-center gap-2"><ShoppingBag className="w-4 h-4" />Loja</TabsTrigger>
             <TabsTrigger value="history" className="flex items-center gap-2"><History className="w-4 h-4" />Meus Resgates</TabsTrigger>
           </TabsList>
           <TabsContent value="shop" className="space-y-6">
             <FlashSalesBanner onPurchase={(rewardId) => { const reward = rewards?.find(r => r.id === rewardId); if (reward) handlePurchase(reward); }} />
             <div className="flex flex-wrap gap-2">
               <Button variant={activeCategory === "all" ? "default" : "outline"} size="sm" onClick={() => setActiveCategory("all")}>Todos</Button>
               <Button variant={activeCategory === "product" ? "default" : "outline"} size="sm" onClick={() => setActiveCategory("product")}><Package className="w-4 h-4 mr-1" />Produtos</Button>
               <Button variant={activeCategory === "benefit" ? "default" : "outline"} size="sm" onClick={() => setActiveCategory("benefit")}><Star className="w-4 h-4 mr-1" />Benefícios</Button>
               <Button variant={activeCategory === "experience" ? "default" : "outline"} size="sm" onClick={() => setActiveCategory("experience")}><Target className="w-4 h-4 mr-1" />Experiências</Button>
             </div>
             {isLoading ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                   {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
                 </div>
              ) : filteredRewards && filteredRewards.length > 0 ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                 <AnimatePresence mode="popLayout">
                    {filteredRewards.map((reward) => (
                     <RewardCard key={reward.id} reward={reward} userCoins={userCoins} onPurchase={handlePurchase} purchasingRewardId={purchasingRewardId} />
                   ))}
                 </AnimatePresence>
               </div>
              ) : (
                <EmptyState 
                  icon={ShoppingCart}
                  title="Nenhuma recompensa encontrada"
                  description="Não há itens disponíveis nesta categoria no momento. Volte em breve!"
                  action={{ label: "Ver todos", onClick: () => setActiveCategory("all") }}
                />
              )}
           </TabsContent>
           <TabsContent value="history"><PurchaseHistory /></TabsContent>
         </Tabs>
       </div>
 
       <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Confirmar Resgate</DialogTitle>
             <DialogDescription>Você está prestes a resgatar esta recompensa</DialogDescription>
           </DialogHeader>
           {selectedReward && (
             <div className="py-4">
               <div className="flex items-center gap-4">
                 <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${selectedReward.rarity === "legendary" ? "bg-gradient-to-br from-amber-400 to-orange-500" : selectedReward.rarity === "epic" ? "bg-gradient-to-br from-purple-400 to-pink-500" : selectedReward.rarity === "rare" ? "bg-gradient-to-br from-blue-400 to-cyan-500" : "bg-muted"}`}>
                   {shopService.getCategoryConfig(selectedReward.category).icon}
                 </div>
                 <div>
                   <h3 className="font-bold text-lg">{selectedReward.name}</h3>
                   <p className="text-sm text-muted-foreground">{selectedReward.description}</p>
                 </div>
               </div>
               <div className="mt-4 p-4 bg-muted rounded-lg">
                 <div className="flex justify-between items-center">
                   <span className="text-muted-foreground">Custo:</span>
                   <div className="flex items-center gap-1"><Coins className="w-5 h-5 text-amber-500" /><span className="font-bold text-lg">{selectedReward.price_coins}</span></div>
                 </div>
                 <div className="flex justify-between items-center mt-2">
                   <span className="text-muted-foreground">Seu saldo após:</span>
                   <div className="flex items-center gap-1"><Coins className="w-5 h-5 text-amber-500" /><span className="font-bold">{userCoins - selectedReward.price_coins}</span></div>
                 </div>
               </div>
             </div>
           )}
           <DialogFooter>
             <Button variant="outline" onClick={() => setSelectedReward(null)}>Cancelar</Button>
             <Button onClick={confirmPurchase} disabled={purchaseMutation.isPending} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
               {purchaseMutation.isPending ? "Resgatando..." : "Confirmar Resgate"}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </PageShell>
   );
 }
