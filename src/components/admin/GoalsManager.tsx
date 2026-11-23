import { useState } from "react";
import { motion } from "framer-motion";
import { Target, Plus, Edit2, Trash2, Save, X, Copy, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface GoalTemplate {
  id: string;
  title: string;
  description: string;
  goal_type: "personal" | "team" | "company";
  priority: "low" | "medium" | "high";
  xp_reward: number;
  coin_reward: number;
}

export function GoalsManager() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<GoalTemplate>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: templates = [], isLoading } = useQuery<GoalTemplate[]>({
    queryKey: ["goal_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goal_templates" as never)
        .select("id, title, description, goal_type, priority, xp_reward, coin_reward")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as GoalTemplate[]) || [];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (tmpl: Partial<GoalTemplate> & { id?: string }) => {
      if (tmpl.id) {
        const { error } = await supabase
          .from("goal_templates" as never)
          .update({
            title: tmpl.title,
            description: tmpl.description,
            goal_type: tmpl.goal_type,
            priority: tmpl.priority,
            xp_reward: tmpl.xp_reward,
            coin_reward: tmpl.coin_reward,
          } as never)
          .eq("id", tmpl.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("goal_templates" as never)
          .insert({
            title: tmpl.title,
            description: tmpl.description,
            goal_type: tmpl.goal_type || "personal",
            priority: tmpl.priority || "medium",
            xp_reward: tmpl.xp_reward ?? 100,
            coin_reward: tmpl.coin_reward ?? 50,
            created_by: user?.id,
          } as never);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      toast.success(variables.id ? "Template atualizado!" : "Template criado!");
      qc.invalidateQueries({ queryKey: ["goal_templates"] });
    },
    onError: (e) => toast.error(`Erro: ${(e as Error).message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("goal_templates" as never)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Template removido!");
      qc.invalidateQueries({ queryKey: ["goal_templates"] });
    },
    onError: (e) => toast.error(`Erro ao remover: ${(e as Error).message}`),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (tmpl: GoalTemplate) => {
      const { error } = await supabase
        .from("goal_templates" as never)
        .insert({
          title: `${tmpl.title} (Cópia)`,
          description: tmpl.description,
          goal_type: tmpl.goal_type,
          priority: tmpl.priority,
          xp_reward: tmpl.xp_reward,
          coin_reward: tmpl.coin_reward,
          created_by: user?.id,
        } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Template duplicado!");
      qc.invalidateQueries({ queryKey: ["goal_templates"] });
    },
    onError: (e) => toast.error(`Erro ao duplicar: ${(e as Error).message}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertMutation.mutate(editingId ? { ...formData, id: editingId } : formData);
    setIsDialogOpen(false);
    setFormData({});
    setEditingId(null);
  };

  const handleEdit = (template: GoalTemplate) => {
    setFormData(template);
    setEditingId(template.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleDuplicate = (template: GoalTemplate) => {
    duplicateMutation.mutate(template);
  };

  const priorityColors = {
    low: "bg-blue-500/10 text-blue-500",
    medium: "bg-yellow-500/10 text-yellow-500",
    high: "bg-red-500/10 text-red-500",
  };

  const typeColors = {
    personal: "bg-purple-500/10 text-purple-500",
    team: "bg-green-500/10 text-green-500",
    company: "bg-orange-500/10 text-orange-500",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Gestão de Templates de Metas
          </h2>
          <p className="text-muted-foreground mt-1">
            Configure templates reutilizáveis para metas de performance
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(o) => { setIsDialogOpen(o); if (!o) { setFormData({}); setEditingId(null); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Template" : "Novo Template de Meta"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nome da meta"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o objetivo desta meta..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.goal_type || "personal"}
                    onValueChange={(v) => setFormData({ ...formData, goal_type: v as GoalTemplate["goal_type"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Pessoal</SelectItem>
                      <SelectItem value="team">Equipe</SelectItem>
                      <SelectItem value="company">Empresa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select
                    value={formData.priority || "medium"}
                    onValueChange={(v) => setFormData({ ...formData, priority: v as GoalTemplate["priority"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="xp_reward">Recompensa XP</Label>
                  <Input
                    id="xp_reward"
                    type="number"
                    min="0"
                    value={formData.xp_reward || 100}
                    onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coin_reward">Recompensa Moedas</Label>
                  <Input
                    id="coin_reward"
                    type="number"
                    min="0"
                    value={formData.coin_reward || 50}
                    onChange={(e) => setFormData({ ...formData, coin_reward: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); setFormData({}); setEditingId(null); }}>
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
                <Button type="submit" disabled={upsertMutation.isPending}>
                  {upsertMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                  {editingId ? "Salvar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Carregando templates...
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Target className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum template cadastrado.</p>
            <p className="text-sm text-muted-foreground">Clique em "Novo Template" para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">{template.title}</CardTitle>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(template)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDuplicate(template)} disabled={duplicateMutation.isPending}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(template.id)} disabled={deleteMutation.isPending}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <Badge className={`text-xs ${priorityColors[template.priority]}`}>
                      {template.priority === "low" ? "Baixa" : template.priority === "medium" ? "Média" : "Alta"}
                    </Badge>
                    <Badge className={`text-xs ${typeColors[template.goal_type]}`}>
                      {template.goal_type === "personal" ? "Pessoal" : template.goal_type === "team" ? "Equipe" : "Empresa"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {template.description && (
                    <CardDescription className="text-xs mb-3 line-clamp-2">{template.description}</CardDescription>
                  )}
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>⚡ {template.xp_reward} XP</span>
                    <span>🪙 {template.coin_reward} moedas</span>
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