import { motion } from "framer-motion";
import { Package, ShoppingCart, Zap, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { RewardsManager } from "@/components/shop-admin/RewardsManager";
 import { PurchasesManager } from "@/components/shop-admin/PurchasesManager";
 import { PromotionsManager } from "@/components/shop-admin/PromotionsManager";
import { PageShell } from "@/components/navigation";

export default function ShopAdmin() {
   return (
     <PageShell title="Administração da Loja" backFallback="/admin">
       <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6 lg:p-8 pb-24">
         <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
           <div className="flex items-center gap-3">
             <div className="p-2 rounded-xl bg-primary/10">
               <Settings className="h-6 w-6 text-primary" />
             </div>
             <div>
               <h1 className="text-3xl font-bold">Administração da Loja</h1>
               <p className="text-muted-foreground">Gerencie recompensas, pedidos e promoções</p>
             </div>
           </div>
         </header>
 
         <Tabs defaultValue="rewards" className="space-y-4">
           <TabsList className="grid w-full max-w-lg grid-cols-3 h-auto">
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
