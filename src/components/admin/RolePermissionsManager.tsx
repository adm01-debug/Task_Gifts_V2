import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";
import {
  Shield,
  ShieldCheck,
  Users,
  User,
  Lock,
  Settings,
  CheckCircle2,
  Search,
  Save,
  RotateCcw,
  Eye,
  Edit,
  Trash2,
  Plus,
  LayoutDashboard,
  UserCog,
  Building2,
  Trophy,
  ShoppingBag,
  GraduationCap,
  MessageSquare,
  ClipboardList,
  Target,
  CalendarCheck,
  BarChart3,
  ShieldAlert,
  Cog,
  Plug,
  Crown
} from "lucide-react";

const moduleIcons: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard className="h-4 w-4" />,
  users: <UserCog className="h-4 w-4" />,
  departments: <Building2 className="h-4 w-4" />,
  gamification: <Trophy className="h-4 w-4" />,
  training: <GraduationCap className="h-4 w-4" />,
  feedback: <MessageSquare className="h-4 w-4" />,
  surveys: <ClipboardList className="h-4 w-4" />,
  pdi: <Target className="h-4 w-4" />,
  goals: <Target className="h-4 w-4" />,
  checkins: <CalendarCheck className="h-4 w-4" />,
  reports: <BarChart3 className="h-4 w-4" />,
  security: <ShieldAlert className="h-4 w-4" />,
  settings: <Cog className="h-4 w-4" />,
  integrations: <Plug className="h-4 w-4" />,
  admin: <Crown className="h-4 w-4" />,
};

const moduleLabels: Record<string, string> = {
  dashboard: "Dashboard",
  users: "Usuários",
  departments: "Departamentos",
  gamification: "Gamificação",
  training: "Treinamentos",
  feedback: "Feedback",
  surveys: "Pesquisas",
  pdi: "PDI",
  goals: "Metas",
  checkins: "Check-ins",
  reports: "Relatórios",
  security: "Segurança",
  settings: "Configurações",
  integrations: "Integrações",
  admin: "Administração",
};

const categoryColors: Record<string, string> = {
  view: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  create: "bg-green-500/10 text-green-500 border-green-500/20",
  edit: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  delete: "bg-red-500/10 text-red-500 border-red-500/20",
  admin: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  export: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
};

const roleIcons: Record<string, React.ReactNode> = {
  admin: <ShieldCheck className="h-5 w-5" />,
  manager: <Users className="h-5 w-5" />,
  user: <User className="h-5 w-5" />,
};

export function RolePermissionsManager() {
  const {
    permissions,
    roles,
    isLoading,
    getRolePermissions,
    assignPermission,
    removePermission,
  } = usePermissions();

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Set<string>>(new Set());
  const [originalPermissions, setOriginalPermissions] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingRoleSwitch, setPendingRoleSwitch] = useState<string | null>(null);

  // Group permissions by module
  const groupedPermissions = useMemo(() => {
    return permissions.reduce((acc, perm) => {
      if (!acc[perm.module]) acc[perm.module] = [];
      acc[perm.module].push(perm);
      return acc;
    }, {} as Record<string, typeof permissions>);
  }, [permissions]);

  // Filter permissions by search
  const filteredGroupedPermissions = useMemo(() => {
    if (!searchQuery.trim()) return groupedPermissions;

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, typeof permissions> = {};

    Object.entries(groupedPermissions).forEach(([module, perms]) => {
      const matchingPerms = perms.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.key.toLowerCase().includes(query) ||
          moduleLabels[module]?.toLowerCase().includes(query)
      );
      if (matchingPerms.length > 0) {
        filtered[module] = matchingPerms;
      }
    });

    return filtered;
  }, [groupedPermissions, searchQuery]);

  // Load role permissions when role is selected
  const handleSelectRole = async (roleId: string) => {
    if (hasChanges) {
      setPendingRoleSwitch(roleId);
      setConfirmDialogOpen(true);
      return;
    }

    await loadRolePermissions(roleId);
  };

  const loadRolePermissions = async (roleId: string) => {
    setSelectedRole(roleId);
    try {
      const perms = await getRolePermissions(roleId);
      const permIds = new Set(perms.map((p) => p.id));
      setRolePermissions(permIds);
      setOriginalPermissions(permIds);
      setHasChanges(false);
    } catch {
      toast.error("Erro ao carregar permissões");
    }
  };

  const handleConfirmSwitch = async () => {
    setConfirmDialogOpen(false);
    if (pendingRoleSwitch) {
      await loadRolePermissions(pendingRoleSwitch);
      setPendingRoleSwitch(null);
    }
  };

  const handleCancelSwitch = () => {
    setConfirmDialogOpen(false);
    setPendingRoleSwitch(null);
  };

  // Toggle permission
  const handleTogglePermission = (permissionId: string, enabled: boolean) => {
    const newPermissions = new Set(rolePermissions);
    if (enabled) {
      newPermissions.add(permissionId);
    } else {
      newPermissions.delete(permissionId);
    }
    setRolePermissions(newPermissions);

    // Check for changes
    const hasChanged =
      newPermissions.size !== originalPermissions.size ||
      [...newPermissions].some((id) => !originalPermissions.has(id));
    setHasChanges(hasChanged);
  };

  // Toggle all permissions in a module
  const handleToggleModule = (module: string, enabled: boolean) => {
    const modulePerms = groupedPermissions[module] || [];
    const newPermissions = new Set(rolePermissions);

    modulePerms.forEach((perm) => {
      if (enabled) {
        newPermissions.add(perm.id);
      } else {
        newPermissions.delete(perm.id);
      }
    });

    setRolePermissions(newPermissions);
    setHasChanges(true);
  };

  // Check if all permissions in module are enabled
  const isModuleFullyEnabled = (module: string) => {
    const modulePerms = groupedPermissions[module] || [];
    return modulePerms.every((p) => rolePermissions.has(p.id));
  };

  // Check if some permissions in module are enabled
  const isModulePartiallyEnabled = (module: string) => {
    const modulePerms = groupedPermissions[module] || [];
    const enabledCount = modulePerms.filter((p) => rolePermissions.has(p.id)).length;
    return enabledCount > 0 && enabledCount < modulePerms.length;
  };

  // Save changes
  const handleSaveChanges = async () => {
    if (!selectedRole) return;

    setIsSaving(true);
    try {
      // Find permissions to add and remove
      const toAdd = [...rolePermissions].filter((id) => !originalPermissions.has(id));
      const toRemove = [...originalPermissions].filter((id) => !rolePermissions.has(id));

      // Apply changes
      await Promise.all([
        ...toAdd.map((permId) =>
          assignPermission({ roleId: selectedRole, permissionId: permId })
        ),
        ...toRemove.map((permId) =>
          removePermission({ roleId: selectedRole, permissionId: permId })
        ),
      ]);

      setOriginalPermissions(new Set(rolePermissions));
      setHasChanges(false);
      toast.success("Permissões atualizadas com sucesso!");
    } catch {
      toast.error("Erro ao salvar permissões");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset changes
  const handleResetChanges = () => {
    setRolePermissions(new Set(originalPermissions));
    setHasChanges(false);
  };

  // Get selected role info
  const selectedRoleInfo = roles.find((r) => r.id === selectedRole);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Gerenciador de Permissões
          </h2>
          <p className="text-muted-foreground">
            Configure permissões granulares para cada role do sistema
          </p>
        </div>
        {hasChanges && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleResetChanges}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Descartar
            </Button>
            <Button onClick={handleSaveChanges} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        )}
      </div>

      {/* Role Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map((role) => (
          <Card
            key={role.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedRole === role.id
                ? "ring-2 ring-primary shadow-lg"
                : "hover:border-primary/50"
            }`}
            onClick={() => handleSelectRole(role.id)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: `${role.color}20` }}
                >
                  <div style={{ color: role.color }}>
                    {roleIcons[role.key] || <Shield className="h-5 w-5" />}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{
                    borderColor: role.color,
                    color: role.color,
                  }}
                >
                  Nível {role.level}
                </Badge>
              </div>
              <h3 className="font-semibold text-lg">{role.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {role.description}
              </p>
              {role.is_system && (
                <Badge variant="secondary" className="mt-3">
                  Sistema
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permissions Editor */}
      {selectedRole && selectedRoleInfo && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${selectedRoleInfo.color}20` }}
                >
                  <div style={{ color: selectedRoleInfo.color }}>
                    {roleIcons[selectedRoleInfo.key] || <Shield className="h-5 w-5" />}
                  </div>
                </div>
                <div>
                  <CardTitle>Permissões: {selectedRoleInfo.name}</CardTitle>
                  <CardDescription>
                    {rolePermissions.size} de {permissions.length} permissões ativas
                  </CardDescription>
                </div>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar permissões..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <Accordion
                type="multiple"
                defaultValue={Object.keys(groupedPermissions)}
                className="space-y-2"
              >
                {Object.entries(filteredGroupedPermissions).map(([module, perms]) => (
                  <AccordionItem
                    key={module}
                    value={module}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            {moduleIcons[module] || <Lock className="h-4 w-4" />}
                          </div>
                          <div className="text-left">
                            <p className="font-medium">
                              {moduleLabels[module] || module}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {perms.filter((p) => rolePermissions.has(p.id)).length} /{" "}
                              {perms.length} ativas
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Switch
                            checked={isModuleFullyEnabled(module)}
                            onCheckedChange={(checked) =>
                              handleToggleModule(module, checked)
                            }
                            className={
                              isModulePartiallyEnabled(module) ? "opacity-50" : ""
                            }
                          />
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                      <div className="grid gap-2">
                        {perms.map((perm) => (
                          <div
                            key={perm.id}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                              rolePermissions.has(perm.id)
                                ? "bg-primary/5 border-primary/20"
                                : "bg-muted/30 border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-1.5 rounded ${
                                  rolePermissions.has(perm.id)
                                    ? "bg-primary/10"
                                    : "bg-muted"
                                }`}
                              >
                                {rolePermissions.has(perm.id) ? (
                                  <CheckCircle2 className="h-4 w-4 text-primary" />
                                ) : (
                                  <Lock className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{perm.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {perm.description}
                                </p>
                                <div className="flex gap-2 mt-1">
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] py-0 ${
                                      categoryColors[perm.category] || ""
                                    }`}
                                  >
                                    {perm.category}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    {perm.key}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Switch
                              checked={rolePermissions.has(perm.id)}
                              onCheckedChange={(checked) =>
                                handleTogglePermission(perm.id, checked)
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* No role selected */}
      {!selectedRole && (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Shield className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Selecione uma Role</h3>
            <p className="text-muted-foreground max-w-md">
              Clique em uma das roles acima para visualizar e editar suas permissões
            </p>
          </CardContent>
        </Card>
      )}

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterações não salvas</DialogTitle>
            <DialogDescription>
              Você tem alterações não salvas. Deseja descartá-las e mudar para outra
              role?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelSwitch}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmSwitch}>
              Descartar e Mudar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
