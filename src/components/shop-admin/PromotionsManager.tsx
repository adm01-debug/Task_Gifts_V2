import { useState, useCallback, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Zap, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useAdminRewards,
  useAdminPromotions,
  useCreatePromotion,
  useUpdatePromotion,
  useDeletePromotion,
} from "@/hooks/useShop";
import { type ShopPromotion, type CreatePromotionInput } from "@/services/shopService";
import { format } from "date-fns";
import { PromotionFormDialog, type PromotionFormData } from "./PromotionFormDialog";

export const PromotionsManager = forwardRef<HTMLDivElement>(function PromotionsManager(_, ref) {
  const { data: promotions, isLoading } = useAdminPromotions();
  const { data: rewards } = useAdminRewards();
  const createMutation = useCreatePromotion();
  const updateMutation = useUpdatePromotion();
  const deleteMutation = useDeletePromotion();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<ShopPromotion | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ShopPromotion | null>(null);
  const [deletingPromoIds, setDeletingPromoIds] = useState<Set<string>>(new Set());

  const handleCreate = useCallback(() => {
    setEditingPromotion(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((promo: ShopPromotion) => {
    setEditingPromotion(promo);
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback((data: PromotionFormData) => {
    const payload = {
      ...data,
      starts_at: new Date(data.starts_at).toISOString(),
      ends_at: new Date(data.ends_at).toISOString(),
    } satisfies CreatePromotionInput;

    if (editingPromotion) {
      updateMutation.mutate(
        { id: editingPromotion.id, updates: payload },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  }, [editingPromotion, updateMutation, createMutation]);

  const handleDelete = useCallback(() => {
    if (deleteConfirm) {
      setDeletingPromoIds(prev => new Set(prev).add(deleteConfirm.id));
      deleteMutation.mutate(deleteConfirm.id, {
        onSettled: () => {
          setDeletingPromoIds(prev => {
            const next = new Set(prev);
            next.delete(deleteConfirm.id);
            return next;
          });
          setDeleteConfirm(null);
        },
      });
    }
  }, [deleteConfirm, deleteMutation]);

  const getPromoStatus = useCallback((promo: ShopPromotion) => {
    const now = new Date();
    const start = new Date(promo.starts_at);
    const end = new Date(promo.ends_at);

    if (!promo.is_active) return { label: "Inativa", color: "bg-muted text-muted-foreground" };
    if (now < start) return { label: "Agendada", color: "bg-blue-500 text-white" };
    if (now > end) return { label: "Expirada", color: "bg-red-500 text-white" };
    return { label: "Ativa", color: "bg-green-500 text-white" };
  }, []);

  if (isLoading) {
    return <div ref={ref} className="text-center py-8">Carregando promoções...</div>;
  }

  return (
    <div ref={ref} className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Promoções ({promotions?.length || 0})</h2>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Promoção
        </Button>
      </div>

      {promotions?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma promoção criada ainda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence mode="popLayout">
            {promotions?.map((promo, index) => {
              const status = getPromoStatus(promo);
              const reward = rewards?.find((r) => r.id === promo.reward_id);

              return (
                <motion.div
                  key={promo.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Card className="border-l-4 border-l-orange-500">
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white">
                            <Zap className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{promo.title}</span>
                              <Badge className={status.color}>{status.label}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {reward?.name || "Recompensa removida"}
                              {" • "}
                              {promo.discount_percent
                                ? `${promo.discount_percent}% OFF`
                                : `🪙 ${promo.discount_coins} OFF`}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(promo.starts_at), "dd/MM HH:mm")} -{" "}
                                {format(new Date(promo.ends_at), "dd/MM HH:mm")}
                              </span>
                              {promo.max_claims && (
                                <span>
                                  {promo.current_claims}/{promo.max_claims} resgates
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(promo)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirm(promo)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <PromotionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingPromotion={editingPromotion}
        rewards={rewards || []}
        onSave={handleSave}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a promoção "{deleteConfirm?.title}"? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deletingPromoIds.has(deleteConfirm?.id || '')}
              className="bg-destructive text-destructive-foreground"
            >
              {deletingPromoIds.has(deleteConfirm?.id || '') ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});
