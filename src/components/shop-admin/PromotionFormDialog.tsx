import { useState, useEffect, forwardRef } from "react";
import { Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type ShopReward,
  type ShopPromotion,
  type CreatePromotionInput,
} from "@/services/shopService";

export type PromotionFormData = Omit<CreatePromotionInput, "starts_at" | "ends_at"> & {
  starts_at: string;
  ends_at: string;
};

export const emptyPromotionForm: PromotionFormData = {
  reward_id: "",
  title: "",
  description: "",
  discount_percent: null,
  discount_coins: null,
  starts_at: new Date().toISOString().slice(0, 16),
  ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  is_active: true,
  max_claims: null,
};

interface PromotionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPromotion: ShopPromotion | null;
  rewards: ShopReward[];
  onSave: (data: PromotionFormData) => void;
  isSaving: boolean;
}

export const PromotionFormDialog = forwardRef<HTMLDivElement, PromotionFormDialogProps>(
  function PromotionFormDialog({ open, onOpenChange, editingPromotion, rewards, onSave, isSaving }, ref) {
  const [formData, setFormData] = useState<PromotionFormData>(emptyPromotionForm);
  const [discountType, setDiscountType] = useState<"percent" | "coins">("percent");

  useEffect(() => {
    if (editingPromotion) {
      setFormData({
        reward_id: editingPromotion.reward_id,
        title: editingPromotion.title,
        description: editingPromotion.description || "",
        discount_percent: editingPromotion.discount_percent,
        discount_coins: editingPromotion.discount_coins,
        starts_at: new Date(editingPromotion.starts_at).toISOString().slice(0, 16),
        ends_at: new Date(editingPromotion.ends_at).toISOString().slice(0, 16),
        is_active: editingPromotion.is_active,
        max_claims: editingPromotion.max_claims,
      });
      setDiscountType(editingPromotion.discount_percent ? "percent" : "coins");
    } else {
      setFormData(emptyPromotionForm);
      setDiscountType("percent");
    }
  }, [editingPromotion, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      discount_percent: discountType === "percent" ? formData.discount_percent : null,
      discount_coins: discountType === "coins" ? formData.discount_coins : null,
    };
    onSave(submitData);
  };

  const selectedReward = rewards.find((r) => r.id === formData.reward_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingPromotion ? "Editar Promoção" : "Nova Promoção"}
          </DialogTitle>
          <DialogDescription>Configure os detalhes da oferta temporária</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Recompensa</Label>
            <Select
              value={formData.reward_id}
              onValueChange={(v) => setFormData({ ...formData, reward_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma recompensa" />
              </SelectTrigger>
              <SelectContent>
                {rewards.map((reward) => (
                  <SelectItem key={reward.id} value={reward.id}>
                    {reward.name} - 🪙 {reward.price_coins}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="promo-title">Título da Promoção</Label>
            <Input
              id="promo-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Black Friday - 50% OFF!"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="promo-desc">Descrição (opcional)</Label>
            <Textarea
              id="promo-desc"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              placeholder="Descreva os detalhes da promoção..."
            />
          </div>

          <div className="space-y-3">
            <Label>Tipo de Desconto</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={discountType === "percent" ? "default" : "outline"}
                size="sm"
                onClick={() => setDiscountType("percent")}
              >
                <Percent className="w-4 h-4 mr-1" />
                Percentual
              </Button>
              <Button
                type="button"
                variant={discountType === "coins" ? "default" : "outline"}
                size="sm"
                onClick={() => setDiscountType("coins")}
              >
                🪙 Moedas Fixas
              </Button>
            </div>

            {discountType === "percent" ? (
              <div className="space-y-2">
                <Label htmlFor="discount-percent">Desconto (%)</Label>
                <Input
                  id="discount-percent"
                  type="number"
                  min={1}
                  max={100}
                  value={formData.discount_percent ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount_percent: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="Ex: 30"
                />
                {selectedReward && formData.discount_percent && (
                  <p className="text-sm text-muted-foreground">
                    Preço final: 🪙{" "}
                    {Math.round(selectedReward.price_coins * (1 - formData.discount_percent / 100))}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="discount-coins">Desconto em Moedas</Label>
                <Input
                  id="discount-coins"
                  type="number"
                  min={1}
                  value={formData.discount_coins ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount_coins: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="Ex: 50"
                />
                {selectedReward && formData.discount_coins && (
                  <p className="text-sm text-muted-foreground">
                    Preço final: 🪙 {Math.max(0, selectedReward.price_coins - formData.discount_coins)}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="starts-at">Início</Label>
              <Input
                id="starts-at"
                type="datetime-local"
                value={formData.starts_at}
                onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ends-at">Término</Label>
              <Input
                id="ends-at"
                type="datetime-local"
                value={formData.ends_at}
                onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-claims">Limite de Resgates (opcional)</Label>
            <Input
              id="max-claims"
              type="number"
              min={1}
              value={formData.max_claims ?? ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  max_claims: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              placeholder="Ilimitado"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="promo-active">Promoção Ativa</Label>
            <Switch
              id="promo-active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving || !formData.reward_id}>
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});
