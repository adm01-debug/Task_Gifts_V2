import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Plus, Edit2, Trash2, Save, X, Users, Calendar } from "lucide-react";
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
import { useFeedback360 } from "@/hooks/useFeedback360";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export function FeedbackCycleManager() {
  const { cycles, isLoading, createCycle } = useFeedback360();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cycle_type: "360" as "360" | "manager" | "peer" | "self",
    starts_at: "",
    ends_at: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCycle({
      name: formData.name,
      description: formData.description,
      cycle_type: formData.cycle_type,
      starts_at: formData.starts_at,
      ends_at: formData.ends_at,
      questions: [],
    });
    setIsDialogOpen(false);
    setFormData({
      name: "",
      description: "",
      cycle_type: "360",
      starts_at: "",
      ends_at: "",
    });
  };

  const statusColors: Record<string, string> = {
    draft: "bg-gray-500/10 text-gray-500",
    active: "bg-green-500/10 text-green-500",
    review: "bg-yellow-500/10 text-yellow-500",
    completed: "bg-blue-500/10 text-blue-500",
  };

  const statusLabels: Record<string, string> = {
    draft: "Rascunho",
    active: "Ativo",
    review: "Em Revisão",
    completed: "Concluído",
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
          <h2 className="text-2xl font-bold">Ciclos de Feedback 360°</h2>
          <p className="text-muted-foreground">Gerencie avaliações 360° e feedbacks</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Ciclo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Ciclo de Feedback</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Ciclo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Avaliação Anual 2024"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o objetivo deste ciclo..."
                />
              </div>
              <div>
                <Label htmlFor="cycle_type">Tipo de Avaliação</Label>
                <Select
                  value={formData.cycle_type}
                  onValueChange={(value: "360" | "manager" | "peer" | "self") => setFormData({ ...formData, cycle_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="360">360° Completo</SelectItem>
                    <SelectItem value="manager">Avaliação do Gestor</SelectItem>
                    <SelectItem value="peer">Apenas Pares</SelectItem>
                    <SelectItem value="self">Auto-avaliação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="starts_at">Data de Início</Label>
                  <Input
                    id="starts_at"
                    type="date"
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ends_at">Data de Término</Label>
                  <Input
                    id="ends_at"
                    type="date"
                    value={formData.ends_at}
                    onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                    required
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
                  Criar Ciclo
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {cycles.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum ciclo de feedback</h3>
            <p className="text-muted-foreground mb-4">Crie seu primeiro ciclo de avaliação 360°</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Ciclo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cycles.map((cycle, index) => (
            <motion.div
              key={cycle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base">{cycle.name}</CardTitle>
                        <Badge className={statusColors[cycle.status]} variant="secondary">
                          {statusLabels[cycle.status]}
                        </Badge>
                      </div>
                      <CardDescription>{cycle.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(new Date(cycle.starts_at), "dd/MM/yyyy", { locale: ptBR })} - {" "}
                        {format(new Date(cycle.ends_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>Tipo: {cycle.cycle_type}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
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
