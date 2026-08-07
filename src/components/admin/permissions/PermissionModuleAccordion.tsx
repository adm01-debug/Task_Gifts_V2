import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Lock, CheckCircle2 } from "lucide-react";

const categoryColors: Record<string, string> = {
  view: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  create: "bg-green-500/10 text-green-500 border-green-500/20",
  edit: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  delete: "bg-red-500/10 text-red-500 border-red-500/20",
  admin: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  export: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
};

interface Permission {
  id: string;
  key: string;
  name: string;
  description: string | null;
  module: string;
  category: string;
}

interface PermissionModuleAccordionProps {
  filteredGroupedPermissions: Record<string, Permission[]>;
  groupedPermissions: Record<string, Permission[]>;
  rolePermissions: Set<string>;
  moduleIcons: Record<string, React.ReactNode>;
  moduleLabels: Record<string, string>;
  onTogglePermission: (permId: string, enabled: boolean) => void;
  onToggleModule: (module: string, enabled: boolean) => void;
  isModuleFullyEnabled: (module: string) => boolean;
  isModulePartiallyEnabled: (module: string) => boolean;
}

export function PermissionModuleAccordion({
  filteredGroupedPermissions,
  groupedPermissions,
  rolePermissions,
  moduleIcons,
  moduleLabels,
  onTogglePermission,
  onToggleModule,
  isModuleFullyEnabled,
  isModulePartiallyEnabled,
}: PermissionModuleAccordionProps) {
  return (
    <ScrollArea className="h-[500px] pr-4">
      <Accordion type="multiple" defaultValue={Object.keys(groupedPermissions)} className="space-y-2">
        {Object.entries(filteredGroupedPermissions).map(([module, perms]) => (
          <AccordionItem key={module} value={module} className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {moduleIcons[module] || <Lock className="h-4 w-4" />}
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{moduleLabels[module] || module}</p>
                    <p className="text-xs text-muted-foreground">
                      {perms.filter((p) => rolePermissions.has(p.id)).length} / {perms.length} ativas
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={isModuleFullyEnabled(module)}
                    onCheckedChange={(checked) => onToggleModule(module, checked)}
                    className={isModulePartiallyEnabled(module) ? "opacity-50" : ""}
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
                      rolePermissions.has(perm.id) ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded ${rolePermissions.has(perm.id) ? "bg-primary/10" : "bg-muted"}`}>
                        {rolePermissions.has(perm.id) ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{perm.name}</p>
                        <p className="text-xs text-muted-foreground">{perm.description}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className={`text-[10px] py-0 ${categoryColors[perm.category] || ""}`}>
                            {perm.category}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono">{perm.key}</span>
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={rolePermissions.has(perm.id)}
                      onCheckedChange={(checked) => onTogglePermission(perm.id, checked)}
                    />
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </ScrollArea>
  );
}
