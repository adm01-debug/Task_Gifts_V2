import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  User,
  Shield,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw,
  KeyRound,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AllSelectItem } from "@/components/ui/all-select-item";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfiles } from "@/hooks/useProfiles";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";

type AuditAction = Database["public"]["Enums"]["audit_action"];

const adminActions: AuditAction[] = [
  "role_assigned",
  "role_removed",
  "department_created",
  "department_updated",
  "team_member_added",
  "team_member_removed",
  "quest_created",
  "quest_updated",
  "quest_deleted",
  "api_key_created",
  "api_key_rotated",
  "api_key_status_changed",
  "api_key_deleted",
];

const actionConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  role_assigned: { label: "Role Atribuído", color: "bg-green-500/20 text-green-500", icon: Shield },
  role_removed: { label: "Role Removido", color: "bg-red-500/20 text-red-500", icon: Shield },
  department_created: { label: "Depto Criado", color: "bg-blue-500/20 text-blue-500", icon: Building2 },
  department_updated: { label: "Depto Atualizado", color: "bg-amber-500/20 text-amber-500", icon: Building2 },
  team_member_added: { label: "Membro Adicionado", color: "bg-emerald-500/20 text-emerald-500", icon: User },
  team_member_removed: { label: "Membro Removido", color: "bg-orange-500/20 text-orange-500", icon: User },
  quest_created: { label: "Quest Criada", color: "bg-purple-500/20 text-purple-500", icon: Calendar },
  quest_updated: { label: "Quest Atualizada", color: "bg-indigo-500/20 text-indigo-500", icon: Calendar },
  quest_deleted: { label: "Quest Excluída", color: "bg-rose-500/20 text-rose-500", icon: Calendar },
  api_key_created: { label: "Chave de API Criada", color: "bg-cyan-500/20 text-cyan-500", icon: KeyRound },
  api_key_rotated: { label: "Chave de API Rotacionada", color: "bg-amber-500/20 text-amber-500", icon: KeyRound },
  api_key_status_changed: { label: "Chave de API Ativada/Desativada", color: "bg-sky-500/20 text-sky-500", icon: KeyRound },
  api_key_deleted: { label: "Chave de API Excluída", color: "bg-red-500/20 text-red-500", icon: KeyRound },
};

const entityFilters: { value: string; label: string }[] = [
  { value: "all", label: "Todas as entidades" },
  { value: "external_api_key", label: "Chaves de API" },
  { value: "user_roles", label: "Papéis de usuário" },
  { value: "departments", label: "Departamentos" },
  { value: "quests", label: "Quests" },
];

interface AuditLog {
  id: string;
  user_id: string;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

function useAdminAuditLogs(actionFilter: string, entityFilter: string) {
  return useQuery({
    queryKey: ["admin-audit-logs", actionFilter, entityFilter],
    queryFn: async (): Promise<AuditLog[]> => {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .in("action", adminActions)
        .order("created_at", { ascending: false })
        .limit(100);

      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter as AuditAction);
      }

      if (entityFilter !== "all") {
        query = query.eq("entity_type", entityFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AuditLog[];
    },
    staleTime: 30000,
  });
}

export function AdminChangeHistory() {
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  
  const { data: logs, isLoading, refetch, isFetching } = useAdminAuditLogs(actionFilter, entityFilter);
  const { data: profiles } = useProfiles();

  const profilesMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  const toggleExpand = (id: string) => {
    setExpandedLogs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const formatDataChange = (oldData: Record<string, unknown> | null, newData: Record<string, unknown> | null) => {
    const changes: { field: string; old: string; new: string }[] = [];
    
    if (newData && !oldData) {
      Object.entries(newData).forEach(([key, value]) => {
        if (key !== "id" && key !== "created_at" && key !== "updated_at") {
          changes.push({ field: key, old: "-", new: String(value) });
        }
      });
    } else if (oldData && newData) {
      Object.keys({ ...oldData, ...newData }).forEach((key) => {
        if (key !== "id" && key !== "created_at" && key !== "updated_at") {
          const oldVal = oldData[key];
          const newVal = newData[key];
          if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            changes.push({
              field: key,
              old: oldVal !== undefined ? String(oldVal) : "-",
              new: newVal !== undefined ? String(newVal) : "-",
            });
          }
        }
      });
    } else if (oldData && !newData) {
      Object.entries(oldData).forEach(([key, value]) => {
        if (key !== "id" && key !== "created_at" && key !== "updated_at") {
          changes.push({ field: key, old: String(value), new: "-" });
        }
      });
    }

    return changes;
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Histórico de Alterações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Histórico de Alterações
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar ação" />
              </SelectTrigger>
              <SelectContent>
                <AllSelectItem label="Todas as ações" />
                {adminActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {actionConfig[action]?.label || action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar entidade" />
              </SelectTrigger>
              <SelectContent>
                {entityFilters.map((entity) => (
                  <SelectItem key={entity.value} value={entity.value}>
                    {entity.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          {logs?.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Nenhuma alteração registrada</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              <AnimatePresence mode="popLayout">
                {logs?.map((log, index) => {
                  const actor = profilesMap.get(log.user_id);
                  const config = actionConfig[log.action] || {
                    label: log.action,
                    color: "bg-muted text-muted-foreground",
                    icon: Calendar,
                  };
                  const Icon = config.icon;
                  const isExpanded = expandedLogs.has(log.id);
                  const changes = formatDataChange(log.old_data, log.new_data);

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="p-4 hover:bg-muted/20 transition-colors"
                    >
                      <div
                        className="flex items-start gap-4 cursor-pointer"
                        onClick={() => changes.length > 0 && toggleExpand(log.id)}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={actor?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {(actor?.display_name || "U").substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">
                              {actor?.display_name || "Usuário desconhecido"}
                            </span>
                            <Badge className={`text-xs ${config.color}`}>
                              <Icon className="w-3 h-3 mr-1" />
                              {config.label}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <span className="capitalize">{log.entity_type}</span>
                            {log.entity_id && (
                              <span className="text-xs font-mono truncate max-w-[150px]">
                                #{log.entity_id.slice(0, 8)}
                              </span>
                            )}
                          </div>

                          {changes.length > 0 && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                              <span>{changes.length} campo{changes.length > 1 ? "s" : ""} alterado{changes.length > 1 ? "s" : ""}</span>
                            </div>
                          )}

                          <AnimatePresence>
                            {isExpanded && changes.length > 0 && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-3 overflow-hidden"
                              >
                                <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                                  {changes.map((change, i) => (
                                    <div key={i} className="grid grid-cols-3 gap-2 text-xs">
                                      <span className="font-medium text-muted-foreground capitalize">
                                        {change.field.replace(/_/g, " ")}
                                      </span>
                                      <span className="text-red-500/80 line-through truncate">
                                        {change.old}
                                      </span>
                                      <span className="text-green-500 truncate">
                                        {change.new}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDistanceToNow(new Date(log.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2" align="end">
                            <p className="text-sm">
                              {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                            </p>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
