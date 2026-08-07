import { Search, Filter, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AllSelectItem } from "@/components/ui/all-select-item";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { AuditAction } from "@/hooks/useAudit";

const actionLabels: Record<AuditAction, string> = {
  user_signup: "Cadastro", user_login: "Login", profile_update: "Atualização de Perfil",
  xp_gained: "XP Ganho", level_up: "Subiu de Nível", coins_earned: "Moedas Ganhas",
  coins_spent: "Moedas Gastas", quest_created: "Quest Criada", quest_updated: "Quest Atualizada",
  quest_deleted: "Quest Excluída", quest_assigned: "Quest Atribuída", quest_completed: "Quest Completa",
  kudos_given: "Kudos Enviado", kudos_received: "Kudos Recebido",
  achievement_unlocked: "Conquista Desbloqueada", streak_updated: "Streak Atualizado",
  department_created: "Departamento Criado", department_updated: "Departamento Atualizado",
  team_member_added: "Membro Adicionado", team_member_removed: "Membro Removido",
  role_assigned: "Cargo Atribuído", role_removed: "Cargo Removido",
};

const allActions: AuditAction[] = Object.keys(actionLabels) as AuditAction[];

interface AuditFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedAction: string;
  onActionChange: (value: string) => void;
  selectedUserId: string;
  onUserChange: (value: string) => void;
  startDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  endDate: Date | undefined;
  onEndDateChange: (date: Date | undefined) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
  profiles: Array<{ id: string; display_name: string | null; email: string | null }>;
}

export { actionLabels, allActions };

export function AuditFilters({
  searchQuery, onSearchChange, selectedAction, onActionChange,
  selectedUserId, onUserChange, startDate, onStartDateChange,
  endDate, onEndDateChange, onClear, hasActiveFilters, profiles,
}: AuditFiltersProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg"><Filter className="w-5 h-5 text-primary" />Filtros</CardTitle>
          {hasActiveFilters && <Button variant="ghost" size="sm" onClick={onClear}>Limpar filtros</Button>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
          </div>
          <Select value={selectedAction} onValueChange={onActionChange}>
            <SelectTrigger><SelectValue placeholder="Tipo de ação" /></SelectTrigger>
            <SelectContent>
              <AllSelectItem label="Todas as ações" />
              {allActions.map((action) => <SelectItem key={action} value={action}>{actionLabels[action]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedUserId} onValueChange={onUserChange}>
            <SelectTrigger><SelectValue placeholder="Usuário" /></SelectTrigger>
            <SelectContent>
              <AllSelectItem label="Todos os usuários" />
              {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.display_name || p.email || "Sem nome"}</SelectItem>)}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                <Calendar className="mr-2 h-4 w-4" />{startDate ? format(startDate, "dd/MM/yyyy") : "Data início"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start"><CalendarComponent mode="single" selected={startDate} onSelect={onStartDateChange} initialFocus className="pointer-events-auto" /></PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                <Calendar className="mr-2 h-4 w-4" />{endDate ? format(endDate, "dd/MM/yyyy") : "Data fim"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start"><CalendarComponent mode="single" selected={endDate} onSelect={onEndDateChange} initialFocus className="pointer-events-auto" /></PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  );
}
