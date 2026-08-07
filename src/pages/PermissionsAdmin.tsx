import { RolePermissionsManager } from "@/components/admin/RolePermissionsManager";
import { PermissionsManager } from "@/components/admin/PermissionsManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/navigation";
import {
  Shield,
  Users,
  Lock,
  UserCog,
  ChevronLeft,
  Settings,
  Info
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PermissionsAdmin() {
  const navigate = useNavigate();
  const { permissions, roles, isLoading } = usePermissions();

  // Get user counts per role
  const { data: roleCounts } = useQuery({
    queryKey: ["role-user-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role");
      
      if (error) throw error;
      
      interface UserRoleData { role: string }
      const counts: Record<string, number> = {};
      (data || []).forEach((ur: UserRoleData) => {
        counts[ur.role] = (counts[ur.role] || 0) + 1;
      });
      return counts;
    },
  });

   return (
     <PageShell title="Gestão de Permissões" backFallback="/admin">
       <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6 lg:p-8 pb-24">
         <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
           <div className="flex items-center gap-3">
             <div className="p-2 rounded-xl bg-primary/10">
               <Shield className="h-6 w-6 text-primary" />
             </div>
             <div>
               <h1 className="text-3xl font-bold">Gestão de Permissões</h1>
               <p className="text-muted-foreground">Controle de acesso e roles do sistema</p>
             </div>
           </div>
         </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Roles</p>
                  <p className="text-2xl font-bold">
                    {isLoading ? <Skeleton className="h-8 w-12" /> : roles.length}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Permissões</p>
                  <p className="text-2xl font-bold">
                    {isLoading ? <Skeleton className="h-8 w-12" /> : permissions.length}
                  </p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-full">
                  <Lock className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Módulos</p>
                  <p className="text-2xl font-bold">
                    {isLoading ? (
                      <Skeleton className="h-8 w-12" />
                    ) : (
                      new Set(permissions.map((p) => p.module)).size
                    )}
                  </p>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-full">
                  <Settings className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Usuários com Role</p>
                  <p className="text-2xl font-bold">
                    {roleCounts ? (
                      Object.values(roleCounts).reduce((a, b) => a + b, 0)
                    ) : (
                      <Skeleton className="h-8 w-12" />
                    )}
                  </p>
                </div>
                <div className="p-3 bg-orange-500/10 rounded-full">
                  <UserCog className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">Sistema de Permissões Granulares</p>
                <p className="text-sm text-muted-foreground">
                  As permissões são organizadas por módulos e podem ser atribuídas individualmente a cada role.
                  Usuários herdam todas as permissões das roles que possuem.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="roles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Permissões por Role
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Todas Permissões
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roles">
            <RolePermissionsManager />
          </TabsContent>

          <TabsContent value="all">
            <PermissionsManager />
          </TabsContent>
        </Tabs>
       </div>
     </PageShell>
  );
}
