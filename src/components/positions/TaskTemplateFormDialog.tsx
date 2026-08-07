import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TaskTemplateFormData {
  position_id: string;
  title: string;
  description: string;
  frequency: string;
  priority: string;
  expected_duration_minutes: number;
  xp_reward: number;
  coin_reward: number;
  xp_penalty_late: number;
  xp_penalty_rework: number;
  deadline_hours: number;
  is_active: boolean;
}

interface TaskTemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: TaskTemplateFormData;
  onFormChange: (form: TaskTemplateFormData) => void;
  onSave: () => void;
  isEditing: boolean;
  isSaving: boolean;
  positions: Array<{ id: string; name: string }>;
}

export function TaskTemplateFormDialog({ open, onOpenChange, form, onFormChange, onSave, isEditing, isSaving, positions }: TaskTemplateFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
          <DialogDescription>Configure a tarefa e suas recompensas/penalidades</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Cargo *</Label>
            <Select value={form.position_id} onValueChange={(v) => onFormChange({ ...form, position_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione o cargo" /></SelectTrigger>
              <SelectContent>{positions.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><Label>Título da Tarefa *</Label><Input value={form.title} onChange={(e) => onFormChange({ ...form, title: e.target.value })} placeholder="Ex: Atualizar pipeline de vendas" /></div>
          <div className="col-span-2"><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => onFormChange({ ...form, description: e.target.value })} placeholder="Detalhes da tarefa..." /></div>
          <div>
            <Label>Frequência</Label>
            <Select value={form.frequency} onValueChange={(v) => onFormChange({ ...form, frequency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="daily">Diária</SelectItem><SelectItem value="weekly">Semanal</SelectItem><SelectItem value="monthly">Mensal</SelectItem></SelectContent>
            </Select>
          </div>
          <div>
            <Label>Prioridade</Label>
            <Select value={form.priority} onValueChange={(v) => onFormChange({ ...form, priority: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="low">Baixa</SelectItem><SelectItem value="medium">Média</SelectItem><SelectItem value="high">Alta</SelectItem><SelectItem value="critical">Crítica</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>Prazo (horas)</Label><Input type="number" value={form.deadline_hours} onChange={(e) => onFormChange({ ...form, deadline_hours: parseInt(e.target.value) || 24 })} /></div>
          <div><Label>Duração Estimada (min)</Label><Input type="number" value={form.expected_duration_minutes} onChange={(e) => onFormChange({ ...form, expected_duration_minutes: parseInt(e.target.value) || 60 })} /></div>
          <div><Label>XP Recompensa</Label><Input type="number" value={form.xp_reward} onChange={(e) => onFormChange({ ...form, xp_reward: parseInt(e.target.value) || 0 })} /></div>
          <div><Label>Coins Recompensa</Label><Input type="number" value={form.coin_reward} onChange={(e) => onFormChange({ ...form, coin_reward: parseInt(e.target.value) || 0 })} /></div>
          <div><Label>XP Penalidade (atraso)</Label><Input type="number" value={form.xp_penalty_late} onChange={(e) => onFormChange({ ...form, xp_penalty_late: parseInt(e.target.value) || 0 })} /></div>
          <div><Label>XP Penalidade (retrabalho)</Label><Input type="number" value={form.xp_penalty_rework} onChange={(e) => onFormChange({ ...form, xp_penalty_rework: parseInt(e.target.value) || 0 })} /></div>
          <div className="col-span-2 flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(c) => onFormChange({ ...form, is_active: c })} /><Label>Tarefa ativa</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave} disabled={isSaving}>{isEditing ? "Salvar" : "Criar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
