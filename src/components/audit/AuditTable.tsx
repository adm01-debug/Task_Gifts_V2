import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

const actionColors: Record<string, string> = {
  user_signup: "bg-success/20 text-success border-success/30",
  user_login: "bg-info/20 text-info border-info/30",
  profile_update: "bg-secondary/20 text-secondary-foreground border-secondary/30",
  xp_gained: "bg-success/20 text-success border-success/30",
  level_up: "bg-warning/20 text-warning border-warning/30",
  coins_earned: "bg-warning/20 text-warning border-warning/30",
  coins_spent: "bg-destructive/20 text-destructive border-destructive/30",
  quest_created: "bg-primary/20 text-primary border-primary/30",
  quest_updated: "bg-secondary/20 text-secondary-foreground border-secondary/30",
  quest_deleted: "bg-destructive/20 text-destructive border-destructive/30",
  quest_assigned: "bg-info/20 text-info border-info/30",
  quest_completed: "bg-success/20 text-success border-success/30",
  kudos_given: "bg-accent/20 text-accent-foreground border-accent/30",
  kudos_received: "bg-accent/20 text-accent-foreground border-accent/30",
  achievement_unlocked: "bg-warning/20 text-warning border-warning/30",
  streak_updated: "bg-streak/20 text-streak border-streak/30",
  department_created: "bg-primary/20 text-primary border-primary/30",
  department_updated: "bg-secondary/20 text-secondary-foreground border-secondary/30",
  team_member_added: "bg-success/20 text-success border-success/30",
  team_member_removed: "bg-destructive/20 text-destructive border-destructive/30",
  role_assigned: "bg-info/20 text-info border-info/30",
  role_removed: "bg-destructive/20 text-destructive border-destructive/30",
};

interface AuditLog {
  id: string;
  created_at: string;
  user_id: string;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  metadata: unknown;
}

interface AuditTableProps {
  logs: AuditLog[];
  isLoading: boolean;
  getUserName: (userId: string) => string;
}

export function AuditTable({ logs, isLoading, getUserName }: AuditTableProps) {
  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-primary" />Registros de Auditoria</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3">
                <Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-24" /><Skeleton className="h-6 w-20 rounded-full" /><Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-primary" />Registros de Auditoria</CardTitle></CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum log encontrado com os filtros aplicados.</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Data/Hora</TableHead>
                  <TableHead className="w-[180px]">Usuário</TableHead>
                  <TableHead className="w-[180px]">Ação</TableHead>
                  <TableHead className="w-[120px]">Entidade</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log, index) => (
                  <motion.tr key={log.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.02 }} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <TableCell className="font-mono text-sm">{format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</TableCell>
                    <TableCell><span className="text-sm font-medium">{getUserName(log.user_id)}</span></TableCell>
                    <TableCell><Badge variant="outline" className={`text-xs ${actionColors[log.action] || ""}`}>{actionLabels[log.action] || log.action}</Badge></TableCell>
                    <TableCell><span className="text-sm text-muted-foreground">{log.entity_type}</span></TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{log.entity_id || "-"}</TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
