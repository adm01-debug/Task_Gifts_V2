import { motion } from "framer-motion";
import {
  Award,
  Flame,
  Coins,
  MoreVertical,
  Shield,
  Building2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type AppRole } from "@/hooks/useRBAC";
import { roleConfig } from "./index";

interface UserRowProps {
  user: {
    id: string;
    display_name: string | null;
    email: string;
    avatar_url: string | null;
    level: number;
    streak: number;
    coins: number;
  };
  index: number;
  isSelected: boolean;
  onSelect: (userId: string) => void;
  userRoles: AppRole[];
  userDepts: { id: string; name: string; isManager: boolean }[];
  onAssignRole: (userId: string) => void;
  onAssignDept: (userId: string) => void;
  onRemoveRole: (userId: string, role: AppRole) => void;
  onRemoveDeptMember: (memberId: string) => void;
  removingDeptMemberId: string | null;
}

export function UserRow({
  user,
  index,
  isSelected,
  onSelect,
  userRoles,
  userDepts,
  onAssignRole,
  onAssignDept,
  onRemoveRole,
  onRemoveDeptMember,
  removingDeptMemberId,
}: UserRowProps) {
  return (
    <motion.div
      key={user.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.02 }}
      className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 hover:bg-muted/20 transition-colors items-center"
    >
      <div className="col-span-1">
        <Checkbox checked={isSelected} onCheckedChange={() => onSelect(user.id)} />
      </div>

      <div className="col-span-3 flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {(user.display_name || user.email || "U").substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-medium truncate">{user.display_name || "Sem nome"}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>

      <div className="col-span-2">
        <div className="flex flex-wrap gap-1">
          {userRoles.length === 0 ? (
            <Badge variant="outline" className="text-xs opacity-50">Nenhum</Badge>
          ) : (
            userRoles.map((role) => (
              <Badge key={role} className={`text-xs ${roleConfig[role].color}`}>
                {roleConfig[role].label}
              </Badge>
            ))
          )}
        </div>
      </div>

      <div className="col-span-2">
        <div className="flex flex-wrap gap-1">
          {userDepts.length === 0 ? (
            <span className="text-xs text-muted-foreground">-</span>
          ) : (
            userDepts.map((dept) => (
              <Badge key={dept.id} variant="outline" className="text-xs">
                {dept.name}{dept.isManager && " 👑"}
              </Badge>
            ))
          )}
        </div>
      </div>

      <div className="col-span-2">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Award className="w-3 h-3 text-primary" />Lv.{user.level}</span>
          <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-amber-500" />{user.streak}</span>
          <span className="flex items-center gap-1"><Coins className="w-3 h-3 text-yellow-500" />{user.coins}</span>
        </div>
      </div>

      <div className="col-span-2 flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Opções do usuário">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Gerenciar</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onAssignRole(user.id)}>
              <Shield className="w-4 h-4 mr-2" />Atribuir Role
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAssignDept(user.id)}>
              <Building2 className="w-4 h-4 mr-2" />Adicionar a Depto
            </DropdownMenuItem>
            {userRoles.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Remover Role</DropdownMenuLabel>
                {userRoles.map((role) => (
                  <DropdownMenuItem key={role} onClick={() => onRemoveRole(user.id, role)} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />{roleConfig[role].label}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            {userDepts.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Remover de Depto</DropdownMenuLabel>
                {userDepts.map((dept) => (
                  <DropdownMenuItem key={dept.id} onClick={() => onRemoveDeptMember(dept.id)} className="text-destructive" disabled={removingDeptMemberId === dept.id}>
                    {removingDeptMemberId === dept.id ? (
                      <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    {dept.name}
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
