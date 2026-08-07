import { useState } from "react";
import { motion } from "framer-motion";
import { PartyPopper, Plus, Calendar, X, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCelebrations } from "@/hooks/useCelebrations";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function CelebrationManager() {
  const { upcomingCelebrations: celebrations, isLoading, createCelebration, isCreating } = useCelebrations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    celebration_type: "birthday" as "birthday" | "work_anniversary" | "milestone" | "custom",
    celebration_date: "",
    xp_reward: 50,
    coin_reward: 25,
    is_public: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createCelebration({
      celebration_type: formData.celebration_type,
      title: formData.title,
      description: formData.description || undefined,
      celebration_date: formData.celebration_date,
      is_public: formData.is_public,
    });
    
    setIsDialogOpen(false);
    setFormData({
      title: "",
      description: "",
      celebration_type: "birthday",
      celebration_date: "",
      xp_reward: 50,
      coin_reward: 25,
      is_public: true,
    });
  };

  const typeColors: Record<string, string> = {
    birthday: "bg-pink-500/10 text-pink-500",
    anniversary: "bg-purple-500/10 text-purple-500",
    achievement: "bg-yellow-500/10 text-yellow-500",
    promotion: "bg-green-500/10 text-green-500",
    custom: "bg-blue-500/10 text-blue-500",
  };

  const typeLabels: Record<string, string> = {
    birthday: "Aniversário",
    anniversary: "Tempo de Casa",
    achievement: "Conquista",
    promotion: "Promoção",
    custom: "Personalizado",
  };

  const typeIcons: Record<string, string> = {
    birthday: "🎂",
    anniversary: "🎉",
    achievement: "🏆",
    promotion: "⭐",
    custom: "🎊",
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
          <h2 className="text-2xl font-bold">Celebrações</h2>
          <p className="text-muted-foreground">Gerencie aniversários, tempo de casa e conquistas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Celebração
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Celebração</DialogTitle>
              <DialogDescription>
                Crie uma celebração personalizada para reconhecer conquistas da equipe.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título da celebração"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={formData.celebration_type}
                    onValueChange={(value: "birthday" | "work_anniversary" | "milestone" | "custom") => 
                      setFormData({ ...formData, celebration_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="birthday">🎂 Aniversário</SelectItem>
                      <SelectItem value="work_anniversary">🎉 Tempo de Casa</SelectItem>
                      <SelectItem value="milestone">🏆 Marco</SelectItem>
                      <SelectItem value="custom">🎊 Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.celebration_date}
                    onChange={(e) => setFormData({ ...formData, celebration_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="xp">Recompensa XP</Label>
                  <Input
                    id="xp"
                    type="number"
                    min={0}
                    value={formData.xp_reward}
                    onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="coins">Recompensa Coins</Label>
                  <Input
                    id="coins"
                    type="number"
                    min={0}
                    value={formData.coin_reward}
                    onChange={(e) => setFormData({ ...formData, coin_reward: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="public">Celebração pública</Label>
                <Switch
                  id="public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  Criar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {["birthday", "anniversary", "achievement", "promotion"].map((type) => {
          const count = celebrations.filter((c) => c.celebration_type === type).length;
          return (
            <Card key={type} className="border-border/50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-1">{typeIcons[type]}</div>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">{typeLabels[type]}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {celebrations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <PartyPopper className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma celebração</h3>
            <p className="text-muted-foreground mb-4">As celebrações são geradas automaticamente ou você pode criar manualmente</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Celebração
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {celebrations.slice(0, 12).map((celebration, index) => (
            <motion.div
              key={celebration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{typeIcons[celebration.celebration_type]}</div>
                      <div>
                        <CardTitle className="text-base">{celebration.title}</CardTitle>
                        <div className="flex gap-1 mt-1">
                          <Badge className={typeColors[celebration.celebration_type]} variant="secondary">
                            {typeLabels[celebration.celebration_type]}
                          </Badge>
                          {celebration.auto_generated && (
                            <Badge variant="outline" className="text-xs">Auto</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(celebration.celebration_date), "dd 'de' MMMM", { locale: ptBR })}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-primary font-medium">{celebration.xp_reward} XP</span>
                    <span className="text-yellow-500 font-medium">{celebration.coin_reward} Coins</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
