import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/services/loggingService";
import {
  buildLeadSnapshot,
  detectLeadEvents,
  pointsToNextPosition,
  type WarLeadEvent,
  type WarLeadSnapshot,
} from "@/lib/warLeadership";
import type { WarStanding } from "@/lib/departmentWar";
import { useAuth } from "./useAuth";

/** Departamento do usuario atual (fonte: banco, respeitando RLS). */
export function useMyDepartmentId() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-department-id", user?.id ?? "anon"],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_department_id", { p_user_id: user!.id });
      if (error) {
        logger.error("Falha ao obter departamento do usuário", "useMyDepartmentId", error);
        return null;
      }
      return (data as string | null) ?? null;
    },
  });
}

export interface WarLeadershipWatch {
  events: WarLeadEvent[];
  snapshot: WarLeadSnapshot;
  nextTarget: { target: string; gap: number } | null;
  myDepartmentId: string | null;
}

/**
 * Observa o placar e narra mudancas de lideranca.
 *
 * O snapshot anterior vive em `ref` (nao em estado) de proposito: comparar
 * placares nao deve provocar re-render extra, e o primeiro ciclo apenas
 * memoriza a linha de base — sem isso o usuario receberia um alerta falso
 * ao abrir a pagina.
 */
export function useWarLeadershipWatch(standings: WarStanding[], notify = true): WarLeadershipWatch {
  const { data: myDepartmentId = null } = useMyDepartmentId();
  const previousRef = useRef<WarLeadSnapshot | null>(null);
  const announcedRef = useRef<Set<string>>(new Set());
  const [events, setEvents] = useState<WarLeadEvent[]>([]);

  const snapshot = useMemo(() => buildLeadSnapshot(standings), [standings]);

  useEffect(() => {
    if (snapshot.rows.length === 0) return;
    const detected = detectLeadEvents(previousRef.current, snapshot, myDepartmentId);
    previousRef.current = snapshot;
    if (detected.length === 0) return;

    setEvents(detected);
    if (!notify) return;

    for (const event of detected) {
      if (announcedRef.current.has(event.id)) continue;
      announcedRef.current.add(event.id);
      if (event.severity === "critical") toast.error(event.title, { description: event.description });
      else if (event.severity === "warning") toast.warning(event.title, { description: event.description });
      else if (event.severity === "positive") toast.success(event.title, { description: event.description });
      else toast.info(event.title, { description: event.description });
    }
  }, [snapshot, myDepartmentId, notify]);

  const nextTarget = useMemo(
    () => pointsToNextPosition(snapshot, myDepartmentId),
    [snapshot, myDepartmentId],
  );

  return { events, snapshot, nextTarget, myDepartmentId };
}
