import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Key, Loader2, Check, X } from "lucide-react";
import { rbacService, type Permission } from "@/services/rbacService";
import { useFuseSearch, SEARCH_PRESETS } from "@/hooks/useFuseSearch";

export function PermissionsTab({ searchTerm }: { searchTerm: string }) {
  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ["rbac-all-permissions"],
    queryFn: () => rbacService.getPermissions(),
  });

  const searchResults = useFuseSearch(permissions, ['name', 'key', 'module'], searchTerm, { ...SEARCH_PRESETS.commands, limit: 100 });
  const filteredPermissions = searchResults.map(r => r.item);

  const permissionsByModule = filteredPermissions.reduce((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {Object.entries(permissionsByModule).map(([module, perms]) => (
        <Card key={module}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5 text-primary" />{module.charAt(0).toUpperCase() + module.slice(1)}</CardTitle>
            <CardDescription>{perms.length} permissão(ões)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Chave</TableHead><TableHead>Categoria</TableHead><TableHead>Sistema</TableHead></TableRow></TableHeader>
              <TableBody>
                {perms.map((perm) => (
                  <TableRow key={perm.id}>
                    <TableCell className="font-medium">{perm.name}</TableCell>
                    <TableCell><code className="text-xs bg-muted px-2 py-1 rounded">{perm.key}</code></TableCell>
                    <TableCell><Badge variant="outline">{perm.category || "-"}</Badge></TableCell>
                    <TableCell>{perm.is_system ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-muted-foreground" />}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
