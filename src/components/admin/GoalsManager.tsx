import { useState } from "react";
import { motion } from "framer-motion";
import { Target, Plus, Edit2, Trash2, Save, X, Copy } from "lucide-react";
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

interface GoalTemplate {
  id: string;
  title: string;
  description: string;
  goal_type: "personal" | "team" | "company";
  priority: "low" | "medium" | "high";
  xp_reward: number;
  coin_reward: number;
}

const defaultTemplates: GoalTemplate[] = [
  {
    id: "1",
    title: "Aumentar Produtividade",
    description: "Meta para aumentar a produtividade individual em 20%",
    goal_type: "personal",
    priority: "high",
    xp_reward: 200,
    coin_reward: 100,
  },
  {
    id: "2",
    title: "Concluir Treinamento",
    description: "Finalizar todas as trilhas de aprendizado obrigatórias",
    goal_type: "personal",
    priority: "medium",
    xp_reward: 150,
    coin_reward: 75,
  },
  {
    id: "3",
    title: "Meta de Vendas da Equipe",
    description: "Atingir R$ 100.000 em vendas no trimestre",
    goal_type: "team",
    priority: "high",
    xp_reward: 500,
    coin_reward: 250,
  },
];

export function GoalsManager() {
  const [templates, setTemplates] = useState<GoalTemplate[]>(defaultTemplates);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<GoalTemplate>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setTemplates(templates.map((t) => (t.id === editingId ? { ...t, ...formData } as GoalTemplate : t)));
      toast.success("Template atualizado!");
    } else {
      const newTemplate: GoalTemplate = {
        id: Date.now().toString(),
        title: formData.title || "",
        description: formData.description || "",
        goal_type: formData.goal_type || "personal",
        priority: formData.priority || "medium",
        xp_reward: formData.xp_reward || 100,
        coin_reward: formData.coin_reward || 50,
      };
      setTemplates([...templates, newTemplate]);
      toast.success("Template criado!");
    }
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
    setTemplates(templates.filter((t) => t.id !== id));
    toast.success("Template removido!");
  };

  const handleDuplicate = (template: GoalTemplate) => {
    const newTemplate = {
      ...template,
      id: Date.now().toString(),
      title: `${template.title} (Cópia)`,
    };
    setTemplates([...templates, newTemplate]);
    toast.success("Template duplicado!");
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
          <h2 className="text-2xl font-bold">Templates de Metas/OKRs</h2>
          <p className="text-muted-foreground">Crie templates reutilizáveis para metas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Template" : "Novo Template"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nome da meta"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva a meta..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="goal_type">Tipo</Label>
                  <Select
                    value={formData.goal_type || "personal"}
                    onValueChange={(value) => setFormData({ ...formData, goal_type: value as GoalTemplate['goal_type'] })}
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
                <div>
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select
                    value={formData.priority || "medium"}
                    onValueChange={(value) => setFormData({ ...formData, priority: value as GoalTemplate['priority'] })}
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
                <div>
                  <Label htmlFor="xp_reward">Recompensa XP</Label>
                  <Input
                    id="xp_reward"
                    type="number"
                    min={0}
                    value={formData.xp_reward || 100}
                    onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="coin_reward">Recompensa Coins</Label>
                  <Input
                    id="coin_reward"
                    type="number"
                    min={0}
                    value={formData.coin_reward || 50}
                    onChange={(e) => setFormData({ ...formData, coin_reward: parseInt(e.target.value) })}
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
        {templates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="hover:border-primary/40 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{template.title}</CardTitle>
                      <div className="flex gap-1 mt-1">
                        <Badge className={typeColors[template.goal_type]} variant="secondary">
                          {template.goal_type === "personal" ? "Pessoal" : template.goal_type === "team" ? "Equipe" : "Empresa"}
                        </Badge>
                        <Badge className={priorityColors[template.priority]} variant="secondary">
                          {template.priority === "low" ? "Baixa" : template.priority === "medium" ? "Média" : "Alta"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-3">{template.description}</CardDescription>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex gap-3">
                    <span className="text-muted-foreground">
                      <span className="font-semibold text-primary">{template.xp_reward}</span> XP
                    </span>
                    <span className="text-muted-foreground">
                      <span className="font-semibold text-yellow-500">{template.coin_reward}</span> Coins
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleDuplicate(template)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
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
