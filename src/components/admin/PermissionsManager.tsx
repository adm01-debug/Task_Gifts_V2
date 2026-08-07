import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions } from "@/hooks/usePermissions";
import { Shield, Users, Lock, Settings, CheckCircle } from "lucide-react";

export const PermissionsManager = () => {
  const { permissions, roles, isLoading, getRolePermissions, assignPermission, removePermission } = usePermissions();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);

  const handleSelectRole = async (roleId: string) => {
    setSelectedRole(roleId);
    const perms = await getRolePermissions(roleId);
    setRolePermissions(perms.map(p => p.id));
  };

  const handleTogglePermission = (permissionId: string, enabled: boolean) => {
    if (!selectedRole) return;
    if (enabled) {
      assignPermission({ roleId: selectedRole, permissionId });
      setRolePermissions(prev => [...prev, permissionId]);
    } else {
      removePermission({ roleId: selectedRole, permissionId });
      setRolePermissions(prev => prev.filter(id => id !== permissionId));
    }
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, typeof permissions>);

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles"><Users className="h-4 w-4 mr-2" />Roles</TabsTrigger>
          <TabsTrigger value="permissions"><Lock className="h-4 w-4 mr-2" />Permissões</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roles.map(role => (
              <Card key={role.id} className={`cursor-pointer transition-all ${selectedRole === role.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`} onClick={() => handleSelectRole(role.id)}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <span className="font-medium">{role.name}</span>
                    </div>
                    <Badge variant={role.is_system ? 'secondary' : 'outline'}>Nível {role.level}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                  {role.is_system && <Badge variant="outline" className="mt-2">Sistema</Badge>}
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedRole && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Permissões da Role
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(groupedPermissions).map(([module, perms]) => (
                    <div key={module}>
                      <h4 className="font-medium mb-3 capitalize">{module}</h4>
                      <div className="space-y-2">
                        {perms.map(perm => (
                          <div key={perm.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                              <p className="font-medium text-sm">{perm.name}</p>
                              <p className="text-xs text-muted-foreground">{perm.description}</p>
                            </div>
                            <Switch checked={rolePermissions.includes(perm.id)} onCheckedChange={(checked) => handleTogglePermission(perm.id, checked)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          {Object.entries(groupedPermissions).map(([module, perms]) => (
            <Card key={module}>
              <CardHeader>
                <CardTitle className="text-lg capitalize flex items-center gap-2">
                  <Lock className="h-5 w-5" />{module}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {perms.map(perm => (
                    <div key={perm.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">{perm.name}</p>
                        <p className="text-xs text-muted-foreground">{perm.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{perm.key}</Badge>
                          {perm.is_system && <Badge variant="secondary">Sistema</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};
