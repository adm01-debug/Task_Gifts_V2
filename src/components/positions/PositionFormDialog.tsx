import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PositionFormData {
  name: string;
  description: string;
  department_id: string;
  level: number;
  is_active: boolean;
}

interface PositionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: PositionFormData;
  onFormChange: (form: PositionFormData) => void;
  onSave: () => void;
  isEditing: boolean;
  isSaving: boolean;
  departments: Array<{ id: string; name: string }>;
}

export function PositionFormDialog({ open, onOpenChange, form, onFormChange, onSave, isEditing, isSaving, departments }: PositionFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Cargo" : "Novo Cargo"}</DialogTitle>
          <DialogDescription>Configure o cargo e suas características</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div><Label>Nome do Cargo *</Label><Input value={form.name} onChange={(e) => onFormChange({ ...form, name: e.target.value })} placeholder="Ex: Analista de Vendas" /></div>
          <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => onFormChange({ ...form, description: e.target.value })} placeholder="Responsabilidades do cargo..." /></div>
          <div>
            <Label>Departamento</Label>
            <Select value={form.department_id} onValueChange={(v) => onFormChange({ ...form, department_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
              <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Nível Hierárquico</Label><Input type="number" min={1} max={10} value={form.level} onChange={(e) => onFormChange({ ...form, level: parseInt(e.target.value) || 1 })} /></div>
          <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(c) => onFormChange({ ...form, is_active: c })} /><Label>Cargo ativo</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave} disabled={isSaving}>{isEditing ? "Salvar" : "Criar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
