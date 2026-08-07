import { useState, useCallback, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
  useCreateReward,
  useUpdateReward,
  useDeleteReward,
} from "@/hooks/useShop";
import { shopService, type ShopReward } from "@/services/shopService";
import { RewardFormDialog, type RewardFormData } from "./RewardFormDialog";

export const RewardsManager = forwardRef<HTMLDivElement>(function RewardsManager(_, ref) {
  const { data: rewards, isLoading } = useAdminRewards();
  const createMutation = useCreateReward();
  const updateMutation = useUpdateReward();
  const deleteMutation = useDeleteReward();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<ShopReward | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ShopReward | null>(null);
  const [deletingRewardIds, setDeletingRewardIds] = useState<Set<string>>(new Set());

  const handleCreate = useCallback(() => {
    setEditingReward(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((reward: ShopReward) => {
    setEditingReward(reward);
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback((data: RewardFormData) => {
    if (editingReward) {
      updateMutation.mutate(
        { id: editingReward.id, updates: data },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  }, [editingReward, updateMutation, createMutation]);

  const handleDelete = useCallback(() => {
    if (deleteConfirm) {
      setDeletingRewardIds(prev => new Set(prev).add(deleteConfirm.id));
      deleteMutation.mutate(deleteConfirm.id, {
        onSettled: () => {
          setDeletingRewardIds(prev => {
            const next = new Set(prev);
            next.delete(deleteConfirm.id);
            return next;
          });
          setDeleteConfirm(null);
        },
      });
    }
  }, [deleteConfirm, deleteMutation]);

  if (isLoading) {
    return <div ref={ref} className="text-center py-8">Carregando recompensas...</div>;
  }

  return (
    <div ref={ref} className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          Recompensas ({rewards?.length || 0})
        </h2>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Recompensa
        </Button>
      </div>

      <div className="grid gap-3">
        <AnimatePresence mode="popLayout">
          {rewards?.map((reward, index) => {
            const rarityConfig = shopService.getRarityConfig(reward.rarity);
            const categoryConfig = shopService.getCategoryConfig(reward.category);

            return (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card
                  className={`${
                    !reward.is_active ? "opacity-60" : ""
                  } border-l-4 ${rarityConfig.borderColor}`}
                >
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                            reward.rarity === "legendary"
                              ? "bg-amber-100 dark:bg-amber-900/30"
                              : reward.rarity === "epic"
                              ? "bg-purple-100 dark:bg-purple-900/30"
                              : reward.rarity === "rare"
                              ? "bg-blue-100 dark:bg-blue-900/30"
                              : "bg-muted"
                          }`}
                        >
                          {categoryConfig.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{reward.name}</span>
                            <Badge
                              variant="outline"
                              className={`text-xs ${rarityConfig.textColor}`}
                            >
                              {rarityConfig.label}
                            </Badge>
                            {!reward.is_active && (
                              <Badge variant="secondary" className="text-xs">
                                Inativo
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              🪙 {reward.price_coins}
                            </span>
                            <span>
                              {reward.stock === null
                                ? "∞ estoque"
                                : `${reward.stock} restantes`}
                            </span>
                            <span>{categoryConfig.label}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(reward)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(reward)}
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

      <RewardFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingReward={editingReward}
        onSave={handleSave}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteConfirm?.name}"? Esta ação
              não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deletingRewardIds.has(deleteConfirm?.id || '')}
              className="bg-destructive text-destructive-foreground"
            >
              {deletingRewardIds.has(deleteConfirm?.id || '') ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});
