import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLeagues } from "@/hooks/useLeagues";
import { League } from "@/services/leaguesService";

interface LeagueFormData {
  name: string;
  tier: number;
  icon: string;
  color: string;
  min_xp_weekly: number;
  promotion_slots: number;
  demotion_slots: number;
  xp_bonus_percent: number;
}

const defaultFormData: LeagueFormData = {
  name: "",
  tier: 1,
  icon: "🥉",
  color: "#CD7F32",
  min_xp_weekly: 0,
  promotion_slots: 3,
  demotion_slots: 3,
  xp_bonus_percent: 0,
};

export function LeaguesManager() {
  const { leagues, isLoading, createLeague, updateLeague, deleteLeague, isCreating, isUpdating, isDeleting } = useLeagues();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<LeagueFormData>(defaultFormData);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      updateLeague({ id: editingId, data: formData });
    } else {
      createLeague(formData);
    }
    
    setIsDialogOpen(false);
    setFormData(defaultFormData);
    setEditingId(null);
  };

  const handleEdit = (league: League) => {
    setFormData({
      name: league.name,
      tier: league.tier,
      icon: league.icon,
      color: league.color,
      min_xp_weekly: league.min_xp_weekly,
      promotion_slots: league.promotion_slots,
      demotion_slots: league.demotion_slots,
      xp_bonus_percent: league.xp_bonus_percent,
    });
    setEditingId(league.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta liga?")) {
      deleteLeague(id);
    }
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-8">
          <div className="h-40 bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Ligas</h2>
          <p className="text-muted-foreground">Configure as ligas e regras de promoção/rebaixamento</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Liga
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Liga" : "Nova Liga"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Atualize os detalhes da liga." : "Crie uma nova liga para o sistema de rankings."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Bronze"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tier">Tier</Label>
                  <Input
                    id="tier"
                    type="number"
                    min={1}
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="icon">Ícone</Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="🥉"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Cor</Label>
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="min_xp">XP Mínimo Semanal</Label>
                  <Input
                    id="min_xp"
                    type="number"
                    min={0}
                    value={formData.min_xp_weekly}
                    onChange={(e) => setFormData({ ...formData, min_xp_weekly: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="xp_bonus">Bônus de XP (%)</Label>
                  <Input
                    id="xp_bonus"
                    type="number"
                    min={0}
                    value={formData.xp_bonus_percent}
                    onChange={(e) => setFormData({ ...formData, xp_bonus_percent: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="promotion">Vagas Promoção</Label>
                  <Input
                    id="promotion"
                    type="number"
                    min={0}
                    value={formData.promotion_slots}
                    onChange={(e) => setFormData({ ...formData, promotion_slots: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="demotion">Vagas Rebaixamento</Label>
                  <Input
                    id="demotion"
                    type="number"
                    min={0}
                    value={formData.demotion_slots}
                    onChange={(e) => setFormData({ ...formData, demotion_slots: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {leagues.map((league, index) => (
          <motion.div
            key={league.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="hover:border-primary/40 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${league.color}20` }}
                    >
                      {league.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{league.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">Tier {league.tier}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(league)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(league.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">XP Mínimo:</span>
                    <span className="ml-1 font-medium">{league.min_xp_weekly}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Bônus:</span>
                    <span className="ml-1 font-medium">+{league.xp_bonus_percent}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Promoção:</span>
                    <Badge variant="secondary" className="ml-1">{league.promotion_slots}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Rebaixamento:</span>
                    <Badge variant="secondary" className="ml-1">{league.demotion_slots}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
