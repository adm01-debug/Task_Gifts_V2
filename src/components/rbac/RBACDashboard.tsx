import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Crown, Key, Settings, Users } from "lucide-react";
import { RolesTab } from "./RolesTab";
import { PermissionsTab } from "./PermissionsTab";
import { PermissionMatrixTab } from "./PermissionMatrixTab";
import { UserRolesTab } from "./UserRolesTab";

export function RBACDashboard() {
  const [activeTab, setActiveTab] = useState("roles");
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Controle de Acesso (RBAC)</h2>
          <p className="text-muted-foreground">Gerencie roles, permissões e acesso de usuários</p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 w-64" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="roles" className="flex items-center gap-2"><Crown className="h-4 w-4" />Roles</TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2"><Key className="h-4 w-4" />Permissões</TabsTrigger>
          <TabsTrigger value="matrix" className="flex items-center gap-2"><Settings className="h-4 w-4" />Matriz</TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2"><Users className="h-4 w-4" />Usuários</TabsTrigger>
        </TabsList>
        <TabsContent value="roles" className="mt-6"><RolesTab searchTerm={searchTerm} /></TabsContent>
        <TabsContent value="permissions" className="mt-6"><PermissionsTab searchTerm={searchTerm} /></TabsContent>
        <TabsContent value="matrix" className="mt-6"><PermissionMatrixTab /></TabsContent>
        <TabsContent value="users" className="mt-6"><UserRolesTab searchTerm={searchTerm} /></TabsContent>
      </Tabs>
    </div>
  );
}
