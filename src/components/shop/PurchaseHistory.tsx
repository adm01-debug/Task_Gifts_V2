 import { motion, AnimatePresence } from "framer-motion";
 import { Coins, ShoppingBag, Calendar, CheckCircle2, Clock, Package, AlertCircle, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
 import { Input } from "@/components/ui/input";
 import { useState, useMemo } from "react";
import { useUserPurchases } from "@/hooks/useShop";
import { shopService } from "@/services/shopService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
 import { cn } from "@/lib/utils";

const statusConfig = {
   pending: { label: "PENDENTE", color: "bg-amber-500/20 text-amber-500 border-amber-500/20", icon: Clock },
   approved: { label: "APROVADO", color: "bg-blue-500/20 text-blue-500 border-blue-500/20", icon: CheckCircle2 },
   delivered: { label: "ENTREGUE", color: "bg-emerald-500/20 text-emerald-500 border-emerald-500/20", icon: Package },
   cancelled: { label: "CANCELADO", color: "bg-red-500/20 text-red-500 border-red-500/20", icon: AlertCircle },
} as const;

export function PurchaseHistory() {
  const { data: purchases, isLoading } = useUserPurchases();
   const [searchTerm, setSearchTerm] = useState("");
 
   const filteredPurchases = useMemo(() => {
     if (!purchases) return [];
     return purchases.filter(p => 
       p.reward?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       statusConfig[p.status].label.toLowerCase().includes(searchTerm.toLowerCase())
     );
   }, [purchases, searchTerm]);

  if (isLoading) {
     return (
       <div className="flex flex-col items-center justify-center py-20 gap-4">
         <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Acessando Arquivos de Transação...</p>
       </div>
     );
  }

  if (!purchases || purchases.length === 0) {
    return (
       <Card className="bg-[#0d0e14] border-white/5 shadow-2xl">
         <CardContent className="py-20 text-center space-y-4">
           <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto ring-1 ring-white/10">
             <ShoppingBag className="w-10 h-10 text-muted-foreground/40" />
           </div>
           <div className="space-y-2">
             <h3 className="text-xl font-black uppercase tracking-tight italic">Nenhum Registro Encontrado</h3>
             <p className="text-xs text-muted-foreground uppercase tracking-widest max-w-[280px] mx-auto leading-relaxed">
               Seu histórico de aquisições táticas está vazio. Visite a loja para equipar novos módulos.
             </p>
           </div>
        </CardContent>
      </Card>
    );
  }

  return (
     <div className="space-y-6">
       <div className="relative">
         <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
         <Input 
           placeholder="PESQUISAR NOS ARQUIVOS DE AQUISIÇÃO..."
           className="h-14 pl-12 bg-zinc-900/50 border-white/5 rounded-2xl font-black text-[10px] tracking-widest uppercase focus:ring-primary/20 transition-all"
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
         />
       </div>
 
       <div className="space-y-4">
         <AnimatePresence mode="popLayout">
           {filteredPurchases.map((purchase, index) => {
             const StatusIcon = statusConfig[purchase.status].icon;
             const categoryConfig = purchase.reward ? shopService.getCategoryConfig(purchase.reward.category) : null;
             
             return (
               <motion.div
                 key={purchase.id}
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 transition={{ delay: index * 0.05 }}
               >
                 <Card className="group relative overflow-hidden bg-[#0d0e14] border-white/5 hover:border-white/10 transition-all duration-300">
                   <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   
                   <CardContent className="py-5 px-6">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                       <div className="flex items-center gap-5">
                         <div className="relative">
                           <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center text-2xl shadow-inner border border-white/5">
                             {categoryConfig?.icon || "🎁"}
                           </div>
                           <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-black border border-white/10 flex items-center justify-center">
                             <StatusIcon className={cn("w-3.5 h-3.5", statusConfig[purchase.status].color.split(' ')[1])} />
                           </div>
                         </div>
                         
                         <div className="space-y-1">
                           <h4 className="font-black uppercase tracking-tight text-lg italic text-white leading-none">
                             {purchase.reward?.name || "RECOMPENSA_NÃO_IDENTIFICADA"}
                           </h4>
                           <div className="flex items-center gap-3">
                             <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                               <Calendar className="w-3 h-3" />
                               {format(new Date(purchase.created_at), "dd MMM yyyy", { locale: ptBR })}
                             </div>
                             <div className="w-1 h-1 rounded-full bg-zinc-800" />
                             <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                               <Clock className="w-3 h-3" />
                               {format(new Date(purchase.created_at), "HH:mm", { locale: ptBR })}
                             </div>
                           </div>
                         </div>
                       </div>
 
                       <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                         <div className="space-y-1 text-right">
                           <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">INVESTIMENTO</p>
                           <div className="flex items-center gap-2 text-amber-500">
                             <Coins className="w-4 h-4 fill-amber-500/20" />
                             <span className="text-xl font-black italic tracking-tighter">{purchase.total_coins.toLocaleString()}</span>
                           </div>
                         </div>
 
                         <Badge variant="outline" className={cn(
                           "h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border-2",
                           statusConfig[purchase.status].color
                         )}>
                           {statusConfig[purchase.status].label}
                         </Badge>
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               </motion.div>
             );
           })}
         </AnimatePresence>
       </div>
 
       {filteredPurchases.length === 0 && searchTerm && (
         <div className="text-center py-10">
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Nenhum registro encontrado para sua busca.</p>
         </div>
       )}
    </div>
  );
}
