import {
  Plus, Trash2, Sparkles, Trophy, CheckCircle2, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface OptionForm {
  text: string;
  is_correct: boolean;
}

export interface QuestionForm {
  quiz_type: string;
  question: string;
  explanation: string;
  points: number;
  difficulty: string;
  department_id: string;
  category: string;
  options: OptionForm[];
}

export const emptyForm: QuestionForm = {
  quiz_type: 'magic_cards',
  question: '',
  explanation: '',
  points: 100,
  difficulty: 'easy',
  department_id: '',
  category: '',
  options: [
    { text: '', is_correct: true },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
  ],
};

interface QuestionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId: string | null;
  form: QuestionForm;
  setForm: React.Dispatch<React.SetStateAction<QuestionForm>>;
  departments: Array<{ id: string; name: string }> | undefined;
  onSubmit: () => void;
  isSaving: boolean;
}

export function QuestionFormDialog({
  open, onOpenChange, editingId, form, setForm, departments, onSubmit, isSaving,
}: QuestionFormDialogProps) {
  const updateOption = (index: number, field: keyof OptionForm, value: string | boolean) => {
    setForm(prev => {
      const newOptions = [...prev.options];
      if (field === 'is_correct' && value === true) {
        newOptions.forEach((o, i) => o.is_correct = i === index);
      } else {
        newOptions[index] = { ...newOptions[index], [field]: value };
      }
      return { ...prev, options: newOptions };
    });
  };

  const addOption = () => {
    setForm(prev => prev.options.length < 4 ? { ...prev, options: [...prev.options, { text: '', is_correct: false }] } : prev);
  };

  const removeOption = (index: number) => {
    setForm(prev => prev.options.length > 2 ? { ...prev, options: prev.options.filter((_, i) => i !== index) } : prev);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingId ? 'Editar Pergunta' : 'Nova Pergunta'}</DialogTitle>
          <DialogDescription>Preencha os campos abaixo para {editingId ? 'atualizar' : 'criar'} a pergunta</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Quiz</Label>
              <Select value={form.quiz_type} onValueChange={(v) => setForm({ ...form, quiz_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="magic_cards"><span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />Cartas Mágicas</span></SelectItem>
                  <SelectItem value="millionaire"><span className="flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" />Show do Milhão</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dificuldade</Label>
              <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Fácil</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="hard">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Pergunta *</Label>
            <Textarea value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Digite a pergunta..." rows={3} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Alternativas *</Label>
              {form.options.length < 4 && (
                <Button variant="outline" size="sm" onClick={addOption}><Plus className="w-4 h-4 mr-1" />Adicionar</Button>
              )}
            </div>
            {form.options.map((opt, index) => (
              <div key={index} className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={opt.is_correct ? "default" : "outline"}
                  size="icon"
                  className={`shrink-0 ${opt.is_correct ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                  onClick={() => updateOption(index, 'is_correct', true)}
                  title="Marcar como correta"
                >
                  {opt.is_correct ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </Button>
                <Input value={opt.text} onChange={(e) => updateOption(index, 'text', e.target.value)} placeholder={`Alternativa ${index + 1}`} className="flex-1" />
                {form.options.length > 2 && (
                  <Button variant="ghost" size="icon" onClick={() => removeOption(index)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                )}
              </div>
            ))}
            <p className="text-xs text-muted-foreground">Clique no ícone para marcar a alternativa correta</p>
          </div>

          <div className="space-y-2">
            <Label>Explicação (opcional)</Label>
            <Textarea value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} placeholder="Explicação exibida após responder..." rows={2} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Pontos</Label>
              <Input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 100 })} min={10} step={10} />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: Processos" />
            </div>
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select value={form.department_id} onValueChange={(v) => setForm({ ...form, department_id: v })}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {departments?.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={isSaving}>{editingId ? 'Salvar Alterações' : 'Criar Pergunta'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
