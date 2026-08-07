import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Trash2, Edit2, Eye, EyeOff, 
  Sparkles, Trophy, HelpCircle,
  Filter, Search, Wand2, BarChart3
} from "lucide-react";
import AIQuestionGenerator from "@/components/quiz/AIQuestionGenerator";
import QuizCategoryStats from "@/components/quiz/QuizCategoryStats";
import QuestionStatsInline from "@/components/quiz/QuestionStatsInline";
import HardestQuestionsRanking from "@/components/quiz/HardestQuestionsRanking";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AllSelectItem } from "@/components/ui/all-select-item";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { DesktopBackButton } from "@/components/navigation";
import { 
  useQuizQuestions, useCreateQuizQuestion, useUpdateQuizQuestion,
  useDeleteQuizQuestion, useToggleQuizQuestionActive, useQuizQuestion
} from "@/hooks/useQuizQuestions";
import { useDepartments } from "@/hooks/useDepartments";
import { useFuseSearch, SEARCH_PRESETS } from "@/hooks/useFuseSearch";
 import { ProtectedRoute } from "@/components/rbac/ProtectedRoute";
import { Skeleton } from "@/components/ui/skeleton";
import { QuestionFormDialog, emptyForm, type QuestionForm } from "@/components/quiz/QuestionFormDialog";

const difficultyConfig = {
  easy: { label: 'Fácil', color: 'bg-emerald-500/20 text-emerald-500' },
  medium: { label: 'Médio', color: 'bg-amber-500/20 text-amber-500' },
  hard: { label: 'Difícil', color: 'bg-red-500/20 text-red-500' },
};

const quizTypeConfig = {
  magic_cards: { label: 'Cartas Mágicas', icon: Sparkles, color: 'text-primary' },
  millionaire: { label: 'Show do Milhão', icon: Trophy, color: 'text-amber-500' },
};

function QuizAdminContent() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<QuestionForm>(emptyForm);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const { data: questions, isLoading } = useQuizQuestions();
  const { data: editQuestion } = useQuizQuestion(editingId || '');
  const { data: departments } = useDepartments();
  const createQuestion = useCreateQuizQuestion();
  const updateQuestion = useUpdateQuizQuestion();
  const deleteQuestion = useDeleteQuizQuestion();
  const toggleActive = useToggleQuizQuestionActive();

  const categories = useMemo(() => [...new Set(questions?.map(q => q.category).filter(Boolean) || [])].sort(), [questions]);

  const preFilteredQuestions = useMemo(() => (questions || []).filter(q => {
    const matchesType = filterType === 'all' || q.quiz_type === filterType;
    const matchesCategory = filterCategory === 'all' || q.category === filterCategory;
    return matchesType && matchesCategory;
  }), [questions, filterType, filterCategory]);

  const searchResults = useFuseSearch(preFilteredQuestions, ['question'], searchQuery, { ...SEARCH_PRESETS.content, limit: 100 });
  const filteredQuestions = searchResults.map(r => r.item);

  const handleOpenCreate = useCallback(() => { setEditingId(null); setForm(emptyForm); setIsDialogOpen(true); }, []);
  const handleOpenEdit = useCallback((id: string) => { setEditingId(id); setIsDialogOpen(true); }, []);

  if (editingId && editQuestion && form.question !== editQuestion.question) {
    setForm({
      quiz_type: editQuestion.quiz_type, question: editQuestion.question,
      explanation: editQuestion.explanation || '', points: editQuestion.points,
      difficulty: editQuestion.difficulty, department_id: editQuestion.department_id || '',
      category: editQuestion.category || '',
      options: editQuestion.options?.map(o => ({ text: o.text, is_correct: o.is_correct })) || emptyForm.options,
    });
  }

  const handleSubmit = useCallback(async () => {
    if (!form.question.trim()) { toast.error("Pergunta é obrigatória"); return; }
    if (form.options.filter(o => o.text.trim()).length < 2) { toast.error("Mínimo de 2 alternativas"); return; }
    if (!form.options.some(o => o.is_correct)) { toast.error("Selecione a alternativa correta"); return; }
    try {
      const data = { quiz_type: form.quiz_type, question: form.question.trim(), explanation: form.explanation.trim() || undefined, points: form.points, difficulty: form.difficulty, department_id: form.department_id || null, category: form.category.trim() || undefined, options: form.options.filter(o => o.text.trim()) };
      if (editingId) { await updateQuestion.mutateAsync({ id: editingId, data }); toast.success("Pergunta atualizada!"); }
      else { await createQuestion.mutateAsync(data); toast.success("Pergunta criada!"); }
      setIsDialogOpen(false); setForm(emptyForm); setEditingId(null);
    } catch { toast.error("Erro ao salvar pergunta"); }
  }, [form, editingId, updateQuestion, createQuestion]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    try { await deleteQuestion.mutateAsync(deleteId); toast.success("Pergunta excluída!"); setDeleteId(null); } catch { toast.error("Erro ao excluir"); }
  }, [deleteId, deleteQuestion]);

  const handleToggleActive = useCallback(async (id: string, isActive: boolean) => {
    try { await toggleActive.mutateAsync({ id, isActive: !isActive }); toast.success(isActive ? "Pergunta desativada" : "Pergunta ativada"); } catch { toast.error("Erro ao alterar status"); }
  }, [toggleActive]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <DesktopBackButton label="Voltar" />
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2"><div className="p-2 rounded-xl bg-primary/10"><HelpCircle className="h-6 w-6 text-primary" /></div><h1 className="text-3xl font-bold">Administrar Perguntas</h1></div>
              <p className="text-muted-foreground">Gerencie as perguntas dos quizzes</p>
            </div>
            <div className="flex gap-2">
              <Button variant={showStats ? "default" : "outline"} onClick={() => { setShowStats(!showStats); setShowAIGenerator(false); }} className="gap-2"><BarChart3 className="w-4 h-4" />Estatísticas</Button>
              <Button variant={showAIGenerator ? "default" : "outline"} onClick={() => { setShowAIGenerator(!showAIGenerator); setShowStats(false); }} className="gap-2"><Wand2 className="w-4 h-4" />Gerar com IA</Button>
              <Button onClick={handleOpenCreate} className="gap-2"><Plus className="w-4 h-4" />Nova Pergunta</Button>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>{showAIGenerator && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden"><AIQuestionGenerator onQuestionsGenerated={() => setShowAIGenerator(false)} /></motion.div>}</AnimatePresence>
        <AnimatePresence>{showStats && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden space-y-6"><QuizCategoryStats /><HardestQuestionsRanking /></motion.div>}</AnimatePresence>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Buscar perguntas..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
          <Select value={filterType} onValueChange={setFilterType}><SelectTrigger className="w-[180px]"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Tipo de Quiz" /></SelectTrigger><SelectContent><AllSelectItem label="Todos os tipos" /><SelectItem value="magic_cards">Cartas Mágicas</SelectItem><SelectItem value="millionaire">Show do Milhão</SelectItem></SelectContent></Select>
          {categories.length > 0 && <Select value={filterCategory} onValueChange={setFilterCategory}><SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger><SelectContent><AllSelectItem label="Todas categorias" />{categories.map((cat) => <SelectItem key={cat} value={cat as string}>{cat}</SelectItem>)}</SelectContent></Select>}
        </motion.div>

        {isLoading ? <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
        : filteredQuestions.length === 0 ? <Card className="text-center py-12"><CardContent><HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" /><p className="text-muted-foreground">Nenhuma pergunta encontrada</p><Button onClick={handleOpenCreate} variant="outline" className="mt-4 gap-2"><Plus className="w-4 h-4" />Criar primeira pergunta</Button></CardContent></Card>
        : <motion.div className="space-y-3"><AnimatePresence mode="popLayout">{filteredQuestions.map((q, index) => {
          const TypeIcon = quizTypeConfig[q.quiz_type as keyof typeof quizTypeConfig]?.icon || HelpCircle;
          const typeColor = quizTypeConfig[q.quiz_type as keyof typeof quizTypeConfig]?.color || '';
          const diffConfig = difficultyConfig[q.difficulty as keyof typeof difficultyConfig];
          return (
            <motion.div key={q.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: index * 0.03 }}>
              <Card className={`transition-all ${!q.is_active ? 'opacity-60' : ''}`}><CardContent className="p-4"><div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg bg-muted ${typeColor}`}><TypeIcon className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0"><p className="font-medium line-clamp-2">{q.question}</p><div className="flex flex-wrap items-center gap-2 mt-2"><Badge variant="outline" className="text-xs">{quizTypeConfig[q.quiz_type as keyof typeof quizTypeConfig]?.label || q.quiz_type}</Badge><Badge className={`text-xs ${diffConfig?.color || ''}`}>{diffConfig?.label || q.difficulty}</Badge><Badge variant="secondary" className="text-xs">{q.points} pts</Badge>{q.category && <Badge variant="outline" className="text-xs">{q.category}</Badge>}<div className="ml-auto"><QuestionStatsInline questionId={q.id} /></div></div></div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleToggleActive(q.id, q.is_active)} aria-label={q.is_active ? 'Desativar' : 'Ativar'}>{q.is_active ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}</Button>
                  <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(q.id)} aria-label="Editar"><Edit2 className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(q.id)} aria-label="Excluir"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div></CardContent></Card>
            </motion.div>
          );
        })}</AnimatePresence></motion.div>}

        <QuestionFormDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} editingId={editingId} form={form} setForm={setForm} departments={departments} onSubmit={handleSubmit} isSaving={createQuestion.isPending || updateQuestion.isPending} />

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir pergunta?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default function QuizAdmin() {
  return <ProtectedRoute requiredRole="manager"><QuizAdminContent /></ProtectedRoute>;
}
