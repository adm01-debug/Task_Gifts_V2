import { motion } from "framer-motion";
import { Package, ShoppingCart, Zap, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { RewardsManager } from "@/components/shop-admin/RewardsManager";
 import { PurchasesManager } from "@/components/shop-admin/PurchasesManager";
 import { PromotionsManager } from "@/components/shop-admin/PromotionsManager";
 import { PageShell } from "@/components/navigation";

export default function ShopAdmin() {
  return (
    <PageShell title="Admin da Loja">
       <div className="min-h-screen bg-background pb-20">
         {/* Header */}
         <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
           <div className="max-w-6xl mx-auto">
             <motion.div
               initial={{ opacity: 0, y: -20 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex items-center gap-3"
             >
               <Settings className="w-8 h-8" />
               <div>
                 <h1 className="text-2xl font-bold">Admin da Loja</h1>
                 <p className="text-white/80">Gerencie recompensas, pedidos e promoções</p>
               </div>
             </motion.div>
           </div>
         </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <Tabs defaultValue="rewards" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="rewards" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Recompensas
            </TabsTrigger>
            <TabsTrigger value="purchases" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Pedidos
            </TabsTrigger>
            <TabsTrigger value="promotions" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Promoções
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rewards">
            <RewardsManager />
          </TabsContent>

          <TabsContent value="purchases">
            <PurchasesManager />
          </TabsContent>

          <TabsContent value="promotions">
            <PromotionsManager />
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </PageShell>
  );
}
