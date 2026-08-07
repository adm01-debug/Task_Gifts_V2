import { Shield, UserCog, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { type AppRole } from "@/hooks/useRBAC";

export const roleConfig: Record<AppRole, { label: string; color: string; icon: React.ElementType }> = {
  admin: { label: "Admin", color: "bg-red-500/20 text-red-500", icon: Shield },
  manager: { label: "Gestor", color: "bg-amber-500/20 text-amber-500", icon: UserCog },
  employee: { label: "Colaborador", color: "bg-blue-500/20 text-blue-500", icon: User },
};

// Role select content shared across dialogs
function RoleSelectContent() {
  return (
    <SelectContent>
      <SelectItem value="admin">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-500" />
          Admin
        </div>
      </SelectItem>
      <SelectItem value="manager">
        <div className="flex items-center gap-2">
          <UserCog className="w-4 h-4 text-amber-500" />
          Gestor
        </div>
      </SelectItem>
      <SelectItem value="employee">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-blue-500" />
          Colaborador
        </div>
      </SelectItem>
    </SelectContent>
  );
}

// Assign Role Dialog
interface AssignRoleDialogProps {
  open: boolean;
  onClose: () => void;
  selectedRole: AppRole;
  onRoleChange: (role: AppRole) => void;
  onAssign: () => void;
  isPending: boolean;
}

export function AssignRoleDialog({ open, onClose, selectedRole, onRoleChange, onAssign, isPending }: AssignRoleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atribuir Role</DialogTitle>
          <DialogDescription>Selecione o role a ser atribuído ao usuário</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={selectedRole} onValueChange={(v) => onRoleChange(v as AppRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <RoleSelectContent />
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onAssign} disabled={isPending}>
            {isPending ? "Atribuindo..." : "Atribuir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Assign Department Dialog
interface AssignDeptDialogProps {
  open: boolean;
  onClose: () => void;
  selectedDept: string;
  onDeptChange: (dept: string) => void;
  departments: { id: string; name: string }[];
  onAssign: () => void;
  isPending: boolean;
}

export function AssignDeptDialog({ open, onClose, selectedDept, onDeptChange, departments, onAssign, isPending }: AssignDeptDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar a Departamento</DialogTitle>
          <DialogDescription>Selecione o departamento</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Departamento</Label>
            <Select value={selectedDept} onValueChange={onDeptChange}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onAssign} disabled={!selectedDept || isPending}>
            {isPending ? "Adicionando..." : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Remove Role Confirmation
interface RemoveRoleConfirmProps {
  open: boolean;
  onClose: () => void;
  role: AppRole | null;
  onConfirm: () => void;
}

export function RemoveRoleConfirm({ open, onClose, role, onConfirm }: RemoveRoleConfirmProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover Role</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja remover o role{" "}
            <strong>{role && roleConfig[role].label}</strong>?
            Esta ação pode afetar as permissões do usuário.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground">
            Remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Bulk Assign Role Dialog
interface BulkAssignRoleDialogProps {
  open: boolean;
  onClose: () => void;
  selectedCount: number;
  role: AppRole;
  onRoleChange: (role: AppRole) => void;
  onAssign: () => void;
  isPending: boolean;
}

export function BulkAssignRoleDialog({ open, onClose, selectedCount, role, onRoleChange, onAssign, isPending }: BulkAssignRoleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atribuir Role em Lote</DialogTitle>
          <DialogDescription>
            Atribuir role para {selectedCount} usuário{selectedCount > 1 ? "s" : ""} selecionado{selectedCount > 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => onRoleChange(v as AppRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <RoleSelectContent />
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onAssign} disabled={isPending}>
            {isPending ? "Atribuindo..." : `Atribuir para ${selectedCount}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Bulk Assign Department Dialog
interface BulkAssignDeptDialogProps {
  open: boolean;
  onClose: () => void;
  selectedCount: number;
  dept: string;
  onDeptChange: (dept: string) => void;
  departments: { id: string; name: string }[];
  onAssign: () => void;
  isPending: boolean;
}

export function BulkAssignDeptDialog({ open, onClose, selectedCount, dept, onDeptChange, departments, onAssign, isPending }: BulkAssignDeptDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar a Departamento em Lote</DialogTitle>
          <DialogDescription>
            Adicionar {selectedCount} usuário{selectedCount > 1 ? "s" : ""} ao departamento
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Departamento</Label>
            <Select value={dept} onValueChange={onDeptChange}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onAssign} disabled={!dept || isPending}>
            {isPending ? "Adicionando..." : `Adicionar ${selectedCount}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Bulk Remove Role Confirmation
interface BulkRemoveRoleConfirmProps {
  open: boolean;
  onClose: () => void;
  role: AppRole | null;
  selectedCount: number;
  onConfirm: () => void;
}

export function BulkRemoveRoleConfirm({ open, onClose, role, selectedCount, onConfirm }: BulkRemoveRoleConfirmProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover Role em Lote</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja remover o role{" "}
            <strong>{role && roleConfig[role].label}</strong>{" "}
            de {selectedCount} usuário{selectedCount > 1 ? "s" : ""}?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground">
            Remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Bulk Remove Departments Confirmation
interface BulkRemoveDeptsConfirmProps {
  open: boolean;
  onClose: (open: boolean) => void;
  selectedCount: number;
  onConfirm: () => void;
}

export function BulkRemoveDeptsConfirm({ open, onClose, selectedCount, onConfirm }: BulkRemoveDeptsConfirmProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover de Departamentos em Lote</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja remover {selectedCount} usuário{selectedCount > 1 ? "s" : ""}{" "}
            de todos os departamentos?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground">
            Remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
