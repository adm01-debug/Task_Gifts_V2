import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Plus, Edit2, Trash2, Save, X, Play, Pause, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { usePulseSurveys } from "@/hooks/usePulseSurveys";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { SurveyQuestion } from "@/services/pulseSurveysService";

export function SurveyCreator() {
  const { activeSurveys: surveys, isLoading, createSurvey, closeSurvey } = usePulseSurveys();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    is_anonymous: true,
    starts_at: "",
    ends_at: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    
    if (!formData.ends_at) {
      toast.error("Data de término é obrigatória");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create default questions for pulse survey
      const defaultQuestions: SurveyQuestion[] = [
        { id: crypto.randomUUID(), question: "Como você avalia seu nível de satisfação no trabalho hoje?", type: "rating", required: true },
        { id: crypto.randomUUID(), question: "Em uma escala de 0-10, qual a probabilidade de você recomendar a empresa como um bom lugar para trabalhar?", type: "nps", required: true },
        { id: crypto.randomUUID(), question: "Há algo que gostaria de compartilhar ou sugerir?", type: "text", required: false },
      ];
      
      createSurvey({
        title: formData.title,
        description: formData.description || undefined,
        questions: defaultQuestions,
        is_anonymous: formData.is_anonymous,
        starts_at: formData.starts_at || undefined,
        ends_at: formData.ends_at,
      });
      
      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        is_anonymous: true,
        starts_at: "",
        ends_at: "",
      });
    } catch {
      toast.error("Erro ao criar pesquisa");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = (surveyId: string, currentStatus: string) => {
    if (currentStatus === "active") {
      closeSurvey(surveyId);
    } else {
      toast.info("Pesquisa já está encerrada");
    }
  };

  const statusColors: Record<string, string> = {
    draft: "bg-gray-500/10 text-gray-500",
    active: "bg-green-500/10 text-green-500",
    completed: "bg-blue-500/10 text-blue-500",
    closed: "bg-blue-500/10 text-blue-500",
    paused: "bg-yellow-500/10 text-yellow-500",
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
          <h2 className="text-2xl font-bold">Pulse Surveys</h2>
          <p className="text-muted-foreground">Crie e gerencie pesquisas de clima</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Pesquisa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Pesquisa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Pesquisa de Clima Q4"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o objetivo da pesquisa..."
                />
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
              <div className="flex items-center justify-between">
                <Label htmlFor="anonymous">Respostas anônimas</Label>
                <Switch
                  id="anonymous"
                  checked={formData.is_anonymous}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_anonymous: checked })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="animate-spin mr-2">⏳</span>
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isSubmitting ? "Criando..." : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {surveys.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma pesquisa criada</h3>
            <p className="text-muted-foreground mb-4">Crie sua primeira pesquisa de clima</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Pesquisa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {surveys.map((survey, index) => (
            <motion.div
              key={survey.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base">{survey.title}</CardTitle>
                        <Badge className={statusColors[survey.status] || "bg-gray-500/10 text-gray-500"} variant="secondary">
                          {survey.status === "active" ? "Ativo" : 
                           survey.status === "draft" ? "Rascunho" :
                           survey.status === "closed" ? "Encerrado" : "Pausado"}
                        </Badge>
                      </div>
                      <CardDescription>{survey.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-3">
                    <p>Início: {format(new Date(survey.starts_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                    <p>Término: {format(new Date(survey.ends_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">
                      {survey.is_anonymous ? "Anônimo" : "Identificado"}
                    </Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {survey.status === "active" ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(survey.id, survey.status)}
                        >
                          <Pause className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(survey.id, survey.status)}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
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
