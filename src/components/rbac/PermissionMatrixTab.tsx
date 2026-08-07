import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Crown, Loader2, Check, X } from "lucide-react";
import { rbacService, type Permission } from "@/services/rbacService";

export function PermissionMatrixTab() {
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["rbac-roles"],
    queryFn: () => rbacService.getRoles(),
  });

  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ["rbac-all-permissions"],
    queryFn: () => rbacService.getPermissions(),
  });

  const { data: allRolePermissions = {}, isLoading: matrixLoading } = useQuery({
    queryKey: ["rbac-permission-matrix", roles.map(r => r.id)],
    queryFn: async () => {
      const matrix: Record<string, Set<string>> = {};
      for (const role of roles) {
        const perms = await rbacService.getRolePermissions(role.id);
        matrix[role.id] = new Set(perms.map(p => p.id));
      }
      return matrix;
    },
    enabled: roles.length > 0,
  });

  const isLoading = rolesLoading || permissionsLoading || matrixLoading;

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const permissionsByModule = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matriz de Permissões</CardTitle>
        <CardDescription>Visualize todas as permissões por role</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background z-10">Permissão</TableHead>
                {roles.map((role) => (
                  <TableHead key={role.id} className="text-center min-w-[100px]">
                    <div className="flex flex-col items-center gap-1"><Crown className="h-4 w-4" /><span className="text-xs">{role.name}</span></div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(permissionsByModule).map(([module, perms]) => (
                <>
                  <TableRow key={`module-${module}`}>
                    <TableCell colSpan={roles.length + 1} className="bg-muted font-semibold">{module.charAt(0).toUpperCase() + module.slice(1)}</TableCell>
                  </TableRow>
                  {perms.map((perm) => (
                    <TableRow key={perm.id}>
                      <TableCell className="sticky left-0 bg-background">
                        <div><p className="font-medium text-sm">{perm.name}</p><p className="text-xs text-muted-foreground">{perm.key}</p></div>
                      </TableCell>
                      {roles.map((role) => {
                        const hasPermission = allRolePermissions[role.id]?.has(perm.id);
                        return (
                          <TableCell key={role.id} className="text-center">
                            {hasPermission ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
