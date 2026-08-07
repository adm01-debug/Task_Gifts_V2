import { useState } from "react";
import { format, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ThumbsUp, ThumbsDown, Minus, Eye, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useENPSSurveyStats,
  useENPSResponses,
  useCreateENPSSurvey,
  useUpdateENPSSurvey,
} from "@/hooks/useENPS";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  active: "bg-green-100 text-green-700",
  closed: "bg-blue-100 text-blue-700",
  archived: "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  active: "Ativa",
  closed: "Encerrada",
  archived: "Arquivada",
};

const ENPS_COLORS = {
  promoters: "#10b981",
  passives: "#f59e0b",
  detractors: "#ef4444",
};

// Create Survey Form
export function CreateSurveyForm({
  departments,
  onClose,
}: {
  departments: { id: string; name: string }[];
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 7), "yyyy-MM-dd"));
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [followUpQuestion, setFollowUpQuestion] = useState("");

  const createSurvey = useCreateENPSSurvey();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    await createSurvey.mutateAsync({
      title,
      description: description || undefined,
      department_id: departmentId || undefined,
      ends_at: new Date(endDate).toISOString(),
      is_anonymous: isAnonymous,
      follow_up_question: followUpQuestion || undefined,
      status: "active",
    });

    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nova Pesquisa eNPS</DialogTitle>
        <DialogDescription>Crie uma pesquisa para medir a satisfação</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label>Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ex: Pesquisa de Satisfação Q1 2024" />
        </div>
        <div className="space-y-2">
          <Label>Descrição (opcional)</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Contexto da pesquisa..." rows={2} />
        </div>
        <div className="space-y-2">
          <Label>Departamento (opcional)</Label>
          <Select value={departmentId} onValueChange={setDepartmentId}>
            <SelectTrigger><SelectValue placeholder="Todos os departamentos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Data de Encerramento</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Pergunta de Follow-up (opcional)</Label>
          <Input value={followUpQuestion} onChange={(e) => setFollowUpQuestion(e.target.value)} placeholder="O que podemos melhorar?" />
        </div>
        <div className="flex items-center justify-between">
          <Label>Respostas Anônimas</Label>
          <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={!title || createSurvey.isPending}>
            {createSurvey.isPending ? "Criando..." : "Criar Pesquisa"}
          </Button>
        </div>
      </form>
    </>
  );
}

// Survey Card
export function SurveyCard({
  survey,
  onView,
  onDelete,
}: {
  survey: {
    id: string;
    title: string;
    status: string;
    starts_at: string;
    ends_at: string;
    response_count?: number;
    enps_score?: number;
    is_anonymous: boolean;
  };
  onView: () => void;
  onDelete: () => void;
}) {
  const daysLeft = differenceInDays(new Date(survey.ends_at), new Date());
  const isActive = survey.status === "active";

  return (
    <Card className="border-border/50 hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">{survey.title}</h4>
              <Badge className={STATUS_COLORS[survey.status]}>{STATUS_LABELS[survey.status]}</Badge>
              {survey.is_anonymous && <Badge variant="outline" className="text-xs">Anônima</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {format(new Date(survey.starts_at), "dd/MM/yyyy")} - {format(new Date(survey.ends_at), "dd/MM/yyyy")}
              {isActive && daysLeft > 0 && ` • ${daysLeft} dias restantes`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold">{survey.enps_score ?? "-"}</p>
              <p className="text-xs text-muted-foreground">{survey.response_count || 0} respostas</p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={onView}><Eye className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Survey Results Card
export function SurveyResultsCard({ surveyId }: { surveyId: string }) {
  const { data: stats, isLoading } = useENPSSurveyStats(surveyId);

  if (isLoading || !stats) {
    return (
      <Card><CardContent className="p-6 text-center text-muted-foreground">Carregando resultados...</CardContent></Card>
    );
  }

  const pieData = [
    { name: "Promotores", value: stats.promoters, color: ENPS_COLORS.promoters },
    { name: "Neutros", value: stats.passives, color: ENPS_COLORS.passives },
    { name: "Detratores", value: stats.detractors, color: ENPS_COLORS.detractors },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Distribuição de Respostas</CardTitle>
        <CardDescription>Última pesquisa - {stats.total} respostas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="w-[200px] h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <ThumbsUp className="w-5 h-5 text-green-500" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1"><span>Promotores (9-10)</span><span className="font-medium">{stats.promoterPercent}%</span></div>
                <Progress value={stats.promoterPercent} className="h-2" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Minus className="w-5 h-5 text-yellow-500" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1"><span>Neutros (7-8)</span><span className="font-medium">{stats.passivePercent}%</span></div>
                <Progress value={stats.passivePercent} className="h-2" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThumbsDown className="w-5 h-5 text-red-500" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1"><span>Detratores (0-6)</span><span className="font-medium">{stats.detractorPercent}%</span></div>
                <Progress value={stats.detractorPercent} className="h-2" />
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Score eNPS</span>
                <span className={`text-2xl font-bold ${stats.score >= 50 ? "text-green-500" : stats.score >= 0 ? "text-yellow-500" : "text-red-500"}`}>
                  {stats.score}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Survey Detail View
export function SurveyDetailView({ surveyId }: { surveyId: string }) {
  const { data: stats } = useENPSSurveyStats(surveyId);
  const { data: responses } = useENPSResponses(surveyId);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Detalhes da Pesquisa</DialogTitle>
        <DialogDescription>Resultados e respostas detalhadas</DialogDescription>
      </DialogHeader>
      <div className="mt-4 space-y-6">
        {stats && (
          <div className="grid grid-cols-4 gap-4">
            <Card className="bg-green-500/10"><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-green-600">{stats.promoters}</p><p className="text-xs text-muted-foreground">Promotores</p></CardContent></Card>
            <Card className="bg-yellow-500/10"><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-yellow-600">{stats.passives}</p><p className="text-xs text-muted-foreground">Neutros</p></CardContent></Card>
            <Card className="bg-red-500/10"><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-red-600">{stats.detractors}</p><p className="text-xs text-muted-foreground">Detratores</p></CardContent></Card>
            <Card className="bg-primary/10"><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-primary">{stats.score}</p><p className="text-xs text-muted-foreground">Score</p></CardContent></Card>
          </div>
        )}
        <div>
          <h4 className="font-medium mb-3">Respostas ({responses?.length || 0})</h4>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {responses?.map((response) => (
              <Card key={response.id} className="bg-muted/30">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={response.category === "promoter" ? "bg-green-500" : response.category === "passive" ? "bg-yellow-500" : "bg-red-500"}>
                        {response.score}
                      </Badge>
                      <span className="text-sm capitalize">
                        {response.category === "promoter" ? "Promotor" : response.category === "passive" ? "Neutro" : "Detrator"}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{format(new Date(response.created_at), "dd/MM/yyyy HH:mm")}</span>
                  </div>
                  {response.follow_up_answer && (
                    <p className="text-sm text-muted-foreground mt-2 italic">"{response.follow_up_answer}"</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
