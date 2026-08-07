import { useQuery } from "@tanstack/react-query";
import { auditService, AuditAction, AuditLog } from "@/services/auditService";

export const auditKeys = {
  all: ["audit"] as const,
  byUser: (userId: string) => [...auditKeys.all, "user", userId] as const,
  byAction: (action: AuditAction) => [...auditKeys.all, "action", action] as const,
  byEntity: (entityType: string, entityId: string) => [...auditKeys.all, "entity", entityType, entityId] as const,
  recent: () => [...auditKeys.all, "recent"] as const,
};

export function useAuditLogsByUser(userId: string, limit = 50) {
  return useQuery({
    queryKey: auditKeys.byUser(userId),
    queryFn: () => auditService.getByUserId(userId, limit),
    enabled: !!userId,
  });
}

export function useAuditLogsByAction(action: AuditAction, limit = 50) {
  return useQuery({
    queryKey: auditKeys.byAction(action),
    queryFn: () => auditService.getByAction(action, limit),
  });
}

export function useAuditLogsByEntity(entityType: string, entityId: string, limit = 50) {
  return useQuery({
    queryKey: auditKeys.byEntity(entityType, entityId),
    queryFn: () => auditService.getByEntity(entityType, entityId, limit),
    enabled: !!entityType && !!entityId,
  });
}

export function useRecentAuditLogs(limit = 100) {
  return useQuery({
    queryKey: auditKeys.recent(),
    queryFn: () => auditService.getRecent(limit),
  });
}

export { auditService };
export type { AuditAction, AuditLog };
