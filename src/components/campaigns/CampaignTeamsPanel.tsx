import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Plus, Trash2, Coins, HandCoins, UserMinus, BarChart3 } from "lucide-react";
import { useCampaignTeams } from "@/hooks/useCampaignTeams";
import { CampaignTeamSplitTrail } from "./CampaignTeamSplitTrail";
import { cn } from "@/lib/utils";
import type { CampaignParticipant } from "@/services/salesCampaignsService";

export interface CampaignTeamsPanelProps {
  campaignId: string;
  metricUnit: string;
  participants: CampaignParticipant[];
  canManage: boolean;
  currentUserId?: string | null;
}

const PODIUM = [
  "bg-gradient-to-br from-yellow-300 to-amber-500 text-yellow-950 ring-2 ring-yellow-300/50",
  "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 ring-2 ring-slate-300/50",
  "bg-gradient-to-br from-orange-300 to-amber-700 text-orange-950 ring-2 ring-orange-400/40",
];

/** Ranking coletivo por equipe, com gestão de membros e rateio `team_split`. */
export function CampaignTeamsPanel({
  campaignId,
  metricUnit,
  participants,
  canManage,
  currentUserId,
}: CampaignTeamsPanelProps) {
  const {
    teams,
    members,
    isLoading,
    create,
    isCreating,
    remove,
    addMembers,
    isAddingMembers,
    removeMember,
    awardTeamSplit,
    isAwarding,
  } = useCampaignTeams(campaignId);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", target_team: 0 });
  const [assignTeamId, setAssignTeamId] = useState<string>("");
  const [assignUserId, setAssignUserId] = useState<string>("");

  const membersByTeam = useMemo(() => {
    const map = new Map<string, typeof members>();
    members.forEach((m) => {
      const list = map.get(m.team_id) ?? [];
      list.push(m);
      map.set(m.team_id, list);
    });
    return map;
  }, [members]);

  const progressByUser = useMemo(() => {
    const map = new Map<string, number>();
    participants.forEach((p) => map.set(p.user_id, p.progress));
    return map;
  }, [participants]);

  const assignedUserIds = useMemo(() => new Set(members.map((m) => m.user_id)), [members]);
  const unassigned = participants.filter((p) => !assignedUserIds.has(p.user_id));

  const myTeamId = currentUserId
    ? members.find((m) => m.user_id === currentUserId)?.team_id ?? null
    : null;

  const handleCreate = () => {
    if (!form.name.trim()) return;
    create(
      { name: form.name.trim(), target_team: Number(form.target_team) || 0 },
      { onSuccess: () => { setForm({ name: "", target_team: 0 }); setCreateOpen(false); } },
    );
  };

  const handleAssign = () => {
    if (!assignTeamId || !assignUserId) return;
    addMembers(
      { teamId: assignTeamId, userIds: [assignUserId] },
      { onSuccess: () => setAssignUserId("") },
    );
  };

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Metas coletivas por equipe
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            O progresso de cada equipe é a soma das entregas dos seus membros. O prêmio coletivo é
            rateado quando a meta da equipe é batida.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild size="sm" variant="secondary" className="gap-2">
            <Link to={`/campanhas/${campaignId}/ranking-equipes`}>
              <BarChart3 className="h-4 w-4" /> Ranking detalhado
            </Link>
          </Button>
          {canManage && (
            <>
            <CampaignTeamSplitTrail campaignId={campaignId} />
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" /> Nova equipe
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nova equipe da campanha</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label htmlFor="team-name">Nome da equipe*</Label>
                    <Input
                      id="team-name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Ex: Loja Centro"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="team-target">Meta coletiva ({metricUnit})</Label>
                    <Input
                      id="team-target"
                      type="number"
                      min={0}
                      value={form.target_team}
                      onChange={(e) => setForm({ ...form, target_team: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreate} disabled={isCreating || !form.name.trim()}>
                    {isCreating ? "Criando..." : "Criar equipe"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={isAwarding || teams.length === 0}
              onClick={() => {
                if (window.confirm("Ratear o prêmio coletivo entre as equipes que bateram a meta?")) {
                  awardTeamSplit();
                }
              }}
            >
              <HandCoins className="h-4 w-4" />
              {isAwarding ? "Rateando..." : "Ratear prêmio"}
            </Button>
            </>
          )}
        </div>
      </div>

      {canManage && teams.length > 0 && (
        <div className="flex items-end gap-2 flex-wrap rounded-lg border border-dashed p-3">
          <div className="grid gap-1.5 min-w-[180px] flex-1">
            <Label className="text-xs">Colaborador sem equipe</Label>
            <Select value={assignUserId} onValueChange={setAssignUserId}>
              <SelectTrigger>
                <SelectValue placeholder={unassigned.length ? "Selecione" : "Todos já alocados"} />
              </SelectTrigger>
              <SelectContent>
                {unassigned.map((p) => (
                  <SelectItem key={p.user_id} value={p.user_id}>
                    {p.profile?.display_name ?? "Participante"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5 min-w-[180px] flex-1">
            <Label className="text-xs">Equipe</Label>
            <Select value={assignTeamId} onValueChange={setAssignTeamId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleAssign}
            disabled={isAddingMembers || !assignTeamId || !assignUserId}
          >
            Alocar
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {canManage
            ? "Nenhuma equipe criada. Crie equipes (lojas, células, regionais) para ativar a meta coletiva."
            : "Esta campanha ainda não tem metas coletivas."}
        </p>
      ) : (
        <div className="space-y-3">
          {teams.map((team, idx) => {
            const teamMembers = membersByTeam.get(team.id) ?? [];
            const isMine = myTeamId === team.id;
            const hit = team.target_team > 0 && team.progress >= team.target_team;
            return (
              <div
                key={team.id}
                className={cn(
                  "rounded-xl border p-4 space-y-3 transition-colors",
                  isMine ? "border-primary/40 bg-primary/5" : "border-border/60",
                )}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-sm",
                        idx < 3 ? PODIUM[idx] : "bg-muted text-muted-foreground",
                      )}
                    >
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : team.rank_position ?? idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate flex items-center gap-2">
                        {team.name}
                        {isMine && <Badge variant="secondary" className="text-[10px]">Sua equipe</Badge>}
                        {team.awarded_at && (
                          <Badge className="text-[10px] gap-1">
                            <Coins className="h-3 w-3" /> Premiada
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {team.progress.toLocaleString("pt-BR")} / {team.target_team.toLocaleString("pt-BR")} {metricUnit}
                        {" · "}
                        {team.members_count} membro(s)
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={cn("text-xl font-black", hit ? "text-green-500" : "text-primary")}>
                        {team.progress_percent}%
                      </div>
                    </div>
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remover equipe ${team.name}`}
                        onClick={() => {
                          if (window.confirm(`Remover a equipe "${team.name}"?`)) remove(team.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>

                <Progress value={Math.min(100, team.progress_percent)} className="h-2" />

                {teamMembers.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {teamMembers.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-2 rounded-full border border-border/60 pl-1 pr-2 py-1"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={m.profile?.avatar_url ?? undefined} alt={m.profile?.display_name ?? "Membro"} />
                          <AvatarFallback className="text-[10px]">
                            {(m.profile?.display_name ?? "?").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs">
                          {m.profile?.display_name ?? "Participante"}
                          <span className="text-muted-foreground ml-1">
                            {(progressByUser.get(m.user_id) ?? 0).toLocaleString("pt-BR")}
                          </span>
                        </span>
                        {canManage && (
                          <button
                            type="button"
                            aria-label={`Remover ${m.profile?.display_name ?? "membro"} da equipe`}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            onClick={() => removeMember(m.user_id)}
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}