import { useState } from "react";
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
  type RewardCategory,
  type RewardRarity,
  type CreateRewardInput,
} from "@/services/shopService";

export type RewardFormData = CreateRewardInput;

export const emptyFormData: RewardFormData = {
  name: "",
  description: "",
  category: "product",
  price_coins: 100,
  stock: null,
  rarity: "common",
  is_active: true,
  image_url: "",
};

interface RewardFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingReward: ShopReward | null;
  onSave: (data: RewardFormData) => void;
  isSaving: boolean;
}

export function RewardFormDialog({
  open,
  onOpenChange,
  editingReward,
  onSave,
  isSaving,
}: RewardFormDialogProps) {
  const [formData, setFormData] = useState<RewardFormData>(
    editingReward
      ? {
          name: editingReward.name,
          description: editingReward.description || "",
          category: editingReward.category,
          price_coins: editingReward.price_coins,
          stock: editingReward.stock,
          rarity: editingReward.rarity,
          is_active: editingReward.is_active,
          image_url: editingReward.image_url || "",
        } as RewardFormData
      : emptyFormData
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingReward ? "Editar Recompensa" : "Nova Recompensa"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da recompensa
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(v) =>
                  setFormData({ ...formData, category: v as RewardCategory })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">🎁 Produto</SelectItem>
                  <SelectItem value="benefit">🌟 Benefício</SelectItem>
                  <SelectItem value="experience">🎯 Experiência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Raridade</Label>
              <Select
                value={formData.rarity}
                onValueChange={(v) =>
                  setFormData({ ...formData, rarity: v as RewardRarity })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="common">Comum</SelectItem>
                  <SelectItem value="rare">Raro</SelectItem>
                  <SelectItem value="epic">Épico</SelectItem>
                  <SelectItem value="legendary">Lendário</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Preço (moedas)</Label>
              <Input
                id="price"
                type="number"
                min={1}
                value={formData.price_coins}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price_coins: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Estoque (vazio = ilimitado)</Label>
              <Input
                id="stock"
                type="number"
                min={0}
                value={formData.stock ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stock: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="Ilimitado"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">URL da Imagem (opcional)</Label>
            <Input
              id="image"
              type="url"
              value={formData.image_url || ""}
              onChange={(e) =>
                setFormData({ ...formData, image_url: e.target.value })
              }
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="active">Ativo na loja</Label>
            <Switch
              id="active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
