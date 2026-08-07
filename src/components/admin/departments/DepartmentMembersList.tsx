import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, X, UserPlus } from "lucide-react";

interface DeptMember {
  memberId: string;
  userId: string;
  isManager: boolean;
  profile: {
    id: string;
    display_name: string | null;
    email: string | null;
    level: number;
    xp: number;
    avatar_url?: string | null;
  } | undefined;
}

interface DepartmentMembersListProps {
  members: DeptMember[];
  onAddMember: () => void;
  onRemoveMember: (memberId: string) => void;
  onToggleManager: (memberId: string, isCurrentlyManager: boolean) => void;
  removingMemberIds: Set<string>;
  togglingManagerIds: Set<string>;
}

export function DepartmentMembersList({
  members,
  onAddMember,
  onRemoveMember,
  onToggleManager,
  removingMemberIds,
  togglingManagerIds,
}: DepartmentMembersListProps) {
  return (
    <div className="px-4 pb-4 border-t border-border/50 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-muted-foreground">Membros</h4>
        <Button variant="outline" size="sm" onClick={onAddMember} className="gap-1">
          <UserPlus className="w-4 h-4" />
          Adicionar
        </Button>
      </div>

      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum membro neste departamento
        </p>
      ) : (
        <div className="grid gap-2">
          {members.map((member) => (
            <div
              key={member.memberId}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {(member.profile?.display_name || member.profile?.email || "U")
                      .substring(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {member.profile?.display_name || "Sem nome"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {member.profile?.email}
                  </p>
                </div>
                {member.isManager && (
                  <Badge className="bg-amber-500/20 text-amber-500 text-xs gap-1">
                    <Crown className="w-3 h-3" />
                    Gestor
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleManager(member.memberId, member.isManager)}
                  disabled={togglingManagerIds.has(member.memberId)}
                  title={member.isManager ? "Remover como gestor" : "Definir como gestor"}
                >
                  {togglingManagerIds.has(member.memberId) ? (
                    <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Crown
                      className={`w-4 h-4 ${member.isManager ? "text-amber-500" : "text-muted-foreground"}`}
                    />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveMember(member.memberId)}
                  disabled={removingMemberIds.has(member.memberId)}
                  className="text-destructive hover:text-destructive"
                >
                  {removingMemberIds.has(member.memberId) ? (
                    <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
