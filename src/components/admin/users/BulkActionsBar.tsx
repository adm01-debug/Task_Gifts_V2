import { motion } from "framer-motion";
import { Shield, Building2, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type AppRole } from "@/hooks/useRBAC";

interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  onBulkAssignRole: () => void;
  onBulkAssignDept: () => void;
  onBulkRemoveRole: (role: AppRole) => void;
  onBulkRemoveDepts: () => void;
  isPendingAssignRole: boolean;
  isPendingAssignDept: boolean;
  isPendingRemoveRole: boolean;
  isPendingRemoveDepts: boolean;
}

export function BulkActionsBar({
  selectedCount,
  onClear,
  onBulkAssignRole,
  onBulkAssignDept,
  onBulkRemoveRole,
  onBulkRemoveDepts,
  isPendingAssignRole,
  isPendingAssignDept,
  isPendingRemoveRole,
  isPendingRemoveDepts,
}: BulkActionsBarProps) {
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium">
              {selectedCount} selecionado{selectedCount > 1 ? "s" : ""}
            </span>
            <div className="h-4 w-px bg-border" />
            <Button variant="outline" size="sm" onClick={onBulkAssignRole} disabled={isPendingAssignRole}>
              <Shield className="w-4 h-4 mr-2" />
              Atribuir Role
            </Button>
            <Button variant="outline" size="sm" onClick={onBulkAssignDept} disabled={isPendingAssignDept}>
              <Building2 className="w-4 h-4 mr-2" />
              Adicionar a Depto
            </Button>
            <div className="h-4 w-px bg-border" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" disabled={isPendingRemoveRole}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remover Role
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onBulkRemoveRole("admin")}>Admin</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkRemoveRole("manager")}>Gestor</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkRemoveRole("employee")}>Colaborador</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={onBulkRemoveDepts} disabled={isPendingRemoveDepts}>
              <Trash2 className="w-4 h-4 mr-2" />
              Remover de Deptos
            </Button>
            <div className="flex-1" />
            <Button variant="ghost" size="sm" onClick={onClear}>Limpar seleção</Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
