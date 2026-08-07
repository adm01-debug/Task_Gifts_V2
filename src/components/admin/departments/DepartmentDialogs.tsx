import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Palette } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Department } from "@/services/departmentsService";

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#ef4444", "#f97316",
  "#f59e0b", "#eab308", "#84cc16", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1",
];

export interface DepartmentFormData {
  name: string;
  description: string;
  color: string;
}

export const emptyForm: DepartmentFormData = { name: "", description: "", color: "#6366f1" };

interface DepartmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingDept: Department | null;
  formData: DepartmentFormData;
  setFormData: (data: DepartmentFormData) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function DepartmentFormDialog({ open, onOpenChange, editingDept, formData, setFormData, onSave, isSaving }: DepartmentFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingDept ? "Editar Departamento" : "Novo Departamento"}</DialogTitle>
          <DialogDescription>Preencha as informações do departamento</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2"><Label htmlFor="name">Nome</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Comercial" /></div>
          <div className="space-y-2"><Label htmlFor="description">Descrição (opcional)</Label><Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descrição do departamento..." rows={2} /></div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Palette className="w-4 h-4" />Cor</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button key={color} type="button" onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${formData.color === color ? "border-foreground scale-110" : "border-transparent hover:scale-105"}`}
                  style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave} disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteConfirmDialogProps {
  department: Department | null;
  onClose: () => void;
  onDelete: () => void;
}

export function DeleteConfirmDialog({ department, onClose, onDelete }: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={!!department} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Departamento</AlertDialogTitle>
          <AlertDialogDescription>Tem certeza que deseja excluir o departamento "{department?.name}"? Todos os membros serão removidos. Esta ação não pode ser desfeita.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface AddMemberDialogProps {
  open: boolean;
  onClose: () => void;
  selectedUserId: string;
  setSelectedUserId: (id: string) => void;
  availableUsers: Array<{ id: string; display_name: string | null; email: string | null }>;
  onAdd: () => void;
  isAdding: boolean;
}

export function AddMemberDialog({ open, onClose, selectedUserId, setSelectedUserId, availableUsers, onAdd, isAdding }: AddMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Membro</DialogTitle>
          <DialogDescription>Selecione um usuário para adicionar ao departamento</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Usuário</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger><SelectValue placeholder="Selecione um usuário..." /></SelectTrigger>
              <SelectContent>
                {availableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}><span>{user.display_name || user.email}</span></SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onAdd} disabled={!selectedUserId || isAdding}>{isAdding ? "Adicionando..." : "Adicionar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
