import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Crown, Key, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { rbacService, type Permission } from "@/services/rbacService";
import { useFuseSearch, SEARCH_PRESETS } from "@/hooks/useFuseSearch";

export function RolesTab({ searchTerm }: { searchTerm: string }) {
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["rbac-roles"],
    queryFn: () => rbacService.getRoles(),
  });

  const searchResults = useFuseSearch(roles, ['name', 'key'], searchTerm, { ...SEARCH_PRESETS.commands, limit: 50 });
  const filteredRoles = searchResults.map(r => r.item);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredRoles.map((role) => (
        <Card key={role.id} className="relative">
          {role.is_system && <Badge variant="secondary" className="absolute top-3 right-3">Sistema</Badge>}
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Crown className="h-5 w-5 text-primary" />{role.name}</CardTitle>
            <CardDescription>{role.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Nível {role.level}</Badge>
                <Badge variant="secondary">{role.key}</Badge>
              </div>
              <RolePermissionsDialog roleId={role.id} roleName={role.name} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RolePermissionsDialog({ roleId, roleName }: { roleId: string; roleName: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: rolePermissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ["rbac-role-permissions", roleId],
    queryFn: () => rbacService.getRolePermissions(roleId),
    enabled: open,
  });

  const { data: allPermissions = [], isLoading: allPermissionsLoading } = useQuery({
    queryKey: ["rbac-all-permissions"],
    queryFn: () => rbacService.getPermissions(),
    enabled: open,
  });

  const assignMutation = useMutation({
    mutationFn: (permissionId: string) => rbacService.assignPermissionToRole(roleId, permissionId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["rbac-role-permissions", roleId] }); toast.success("Permissão atribuída!"); },
    onError: () => toast.error("Erro ao atribuir permissão"),
  });

  const removeMutation = useMutation({
    mutationFn: (permissionId: string) => rbacService.removePermissionFromRole(roleId, permissionId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["rbac-role-permissions", roleId] }); toast.success("Permissão removida!"); },
    onError: () => toast.error("Erro ao remover permissão"),
  });

  const permissionIds = new Set(rolePermissions.map(p => p.id));
  const permissionsByModule = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm"><Key className="h-4 w-4 mr-1" />Permissões</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Permissões de {roleName}</DialogTitle>
          <DialogDescription>Gerencie as permissões atribuídas a esta role</DialogDescription>
        </DialogHeader>
        {(permissionsLoading || allPermissionsLoading) ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <ScrollArea className="h-[50vh] pr-4">
            <div className="space-y-6">
              {Object.entries(permissionsByModule).map(([module, permissions]) => (
                <div key={module}>
                  <h4 className="font-semibold mb-3 flex items-center gap-2"><Lock className="h-4 w-4" />{module.charAt(0).toUpperCase() + module.slice(1)}</h4>
                  <div className="space-y-2">
                    {permissions.map((perm) => {
                      const hasPermission = permissionIds.has(perm.id);
                      return (
                        <div key={perm.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                          <div className="flex-1"><p className="font-medium text-sm">{perm.name}</p><p className="text-xs text-muted-foreground">{perm.key}</p></div>
                          <Switch checked={hasPermission} onCheckedChange={(checked) => { if (checked) assignMutation.mutate(perm.id); else removeMutation.mutate(perm.id); }} disabled={assignMutation.isPending || removeMutation.isPending} />
                        </div>
                      );
                    })}
                  </div>
                  <Separator className="mt-4" />
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
