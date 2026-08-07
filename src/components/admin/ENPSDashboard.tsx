import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Plus,
  TrendingUp,
  TrendingDown,
  Send,
  MessageSquare,
  Filter,
  RefreshCw,
  LineChart,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useENPSSurveys,
  useDeleteENPSSurvey,
  useEngagementSnapshots,
  useGenerateSnapshot,
} from "@/hooks/useENPS";
import { useDepartments } from "@/hooks/useDepartments";
import { format } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { ENPSTrendChart } from "./ENPSTrendChart";
import {
  CreateSurveyForm,
  SurveyCard,
  SurveyResultsCard,
  SurveyDetailView,
} from "./enps/ENPSSubComponents";

export function ENPSDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: surveys, isLoading } = useENPSSurveys(statusFilter !== "all" ? statusFilter : undefined);
  const { data: snapshots } = useEngagementSnapshots(undefined, 12);
  const { data: departments } = useDepartments();
  const deleteSurvey = useDeleteENPSSurvey();
  const generateSnapshot = useGenerateSnapshot();

  const activeSurveys = surveys?.filter((s) => s.status === "active") || [];
  const totalResponses = surveys?.reduce((sum, s) => sum + (s.response_count || 0), 0) || 0;
  const latestScore = surveys?.find((s) => s.enps_score !== undefined)?.enps_score || 0;

  const trendData =
    snapshots
      ?.map((s) => ({
        date: format(new Date(s.snapshot_date), "dd/MM"),
        enps: s.enps_score || 0,
        mood: (s.mood_avg || 0) * 20,
        participation: s.participation_rate || 0,
      }))
      .reverse() || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Dashboard eNPS
          </h2>
          <p className="text-muted-foreground">Monitore a satisfação e engajamento dos colaboradores</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => generateSnapshot.mutate({})} disabled={generateSnapshot.isPending}>
            <RefreshCw className={`w-4 h-4 mr-2 ${generateSnapshot.isPending ? "animate-spin" : ""}`} />
            Gerar Snapshot
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Nova Pesquisa</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <CreateSurveyForm departments={departments || []} onClose={() => setShowCreateDialog(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-muted-foreground">Score eNPS</p><p className="text-3xl font-bold">{latestScore}</p></div>
                <div className={`p-3 rounded-xl ${latestScore >= 50 ? "bg-green-500/20" : latestScore >= 0 ? "bg-yellow-500/20" : "bg-red-500/20"}`}>
                  {latestScore >= 0 ? <TrendingUp className={`w-6 h-6 ${latestScore >= 50 ? "text-green-500" : "text-yellow-500"}`} /> : <TrendingDown className="w-6 h-6 text-red-500" />}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{latestScore >= 50 ? "Excelente" : latestScore >= 0 ? "Bom" : "Precisa melhorar"}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-border/50"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Pesquisas Ativas</p><p className="text-3xl font-bold">{activeSurveys.length}</p></div><div className="p-3 rounded-xl bg-blue-500/20"><Send className="w-6 h-6 text-blue-500" /></div></div><p className="text-xs text-muted-foreground mt-2">{surveys?.length || 0} total</p></CardContent></Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/50"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Respostas</p><p className="text-3xl font-bold">{totalResponses}</p></div><div className="p-3 rounded-xl bg-purple-500/20"><MessageSquare className="w-6 h-6 text-purple-500" /></div></div><p className="text-xs text-muted-foreground mt-2">Todas as pesquisas</p></CardContent></Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-border/50"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Snapshots</p><p className="text-3xl font-bold">{snapshots?.length || 0}</p></div><div className="p-3 rounded-xl bg-amber-500/20"><LineChart className="w-6 h-6 text-amber-500" /></div></div><p className="text-xs text-muted-foreground mt-2">Histórico de engajamento</p></CardContent></Card>
        </motion.div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="surveys">Pesquisas</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="analytics">Análise Avançada</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Evolução do Engajamento</CardTitle><CardDescription>Últimos 12 períodos</CardDescription></CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs><linearGradient id="colorEnps" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" /><YAxis domain={[-100, 100]} className="text-xs" />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                      <Area type="monotone" dataKey="enps" stroke="#6366f1" fillOpacity={1} fill="url(#colorEnps)" name="eNPS" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            {surveys?.[0] && <SurveyResultsCard surveyId={surveys[0].id} />}
          </div>
        </TabsContent>

        <TabsContent value="surveys" className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="closed">Encerrada</SelectItem>
                <SelectItem value="archived">Arquivada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : surveys?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Nenhuma pesquisa encontrada</div>
            ) : (
              surveys?.map((survey, index) => (
                <motion.div key={survey.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                  <SurveyCard survey={survey} onView={() => setSelectedSurvey(survey.id)} onDelete={() => deleteSurvey.mutate(survey.id)} />
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Métricas de Engajamento</CardTitle><CardDescription>Comparativo de indicadores ao longo do tempo</CardDescription></CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="date" className="text-xs" /><YAxis className="text-xs" />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    <Legend />
                    <Bar dataKey="enps" name="eNPS" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="mood" name="Humor (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="participation" name="Participação (%)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics"><ENPSTrendChart /></TabsContent>
      </Tabs>

      <Dialog open={selectedSurvey !== null} onOpenChange={() => setSelectedSurvey(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedSurvey && <SurveyDetailView surveyId={selectedSurvey} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
