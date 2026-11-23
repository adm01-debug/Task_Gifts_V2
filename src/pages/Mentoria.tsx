import { useMemo, useState } from "react";
import {
  Heart,
  Users,
  Target,
  Sparkles,
  Search,
  Check,
  X,
  Trophy,
  Shield,
  Loader2,
} from "lucide-react";
import { PageShell } from "@/components/navigation";
import { PageWrapper } from "@/components/PageWrapper";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/hooks/useAuth";
import { useRBAC } from "@/hooks/useRBAC";
import {
  useAllMentorshipMissions,
  useCloseMentorshipPair,
  useCreateMentorshipMission,
  useCreateMentorshipRequest,
  useIncomingMentorshipRequests,
  useMarkMentorshipPart,
  useMentorshipCandidates,
  useMentorshipMissions,
  useMyMentorshipPairs,
  usePairProgress,
  useRespondMentorshipRequest,
  useSeedMentorshipMissions,
  useSentMentorshipRequests,
  useSetMentorshipMissionActive,
} from "@/hooks/useMentorship";
import type {
  MentorshipDifficulty,
  MentorshipMission,
  MentorshipMissionType,
  MentorshipPairWithPeople,
  MentorshipPerson,
  MentorshipRequest,
  MentorshipRequestStatus,
  MentorshipRole,
} from "@/services/mentorshipService";

const MISSION_TYPE_LABEL: Record<MentorshipMissionType, string> = {
  mentor_only: "Só o mentor",
  apprentice_only: "Só o mentorado",
  collaborative: "Os dois",
};

const DIFFICULTY_LABEL: Record<MentorshipDifficulty, string> = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
};

const REQUEST_STATUS_LABEL: Record<MentorshipRequestStatus, string> = {
  pending: "Aguardando resposta",
  accepted: "Aceita",
  rejected: "Recusada",
  expired: "Expirada",
};

function initials(person: MentorshipPerson | null): string {
  const name = person?.display_name?.trim();
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function PersonChip({ person }: { person: MentorshipPerson | null }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-9 w-9">
        <AvatarImage src={person?.avatar_url ?? undefined} alt={person?.display_name ?? "Pessoa"} />
        <AvatarFallback>{initials(person)}</AvatarFallback>
      </Avatar>
      <span className="text-sm font-semibold truncate">{person?.display_name ?? "Pessoa"}</span>
    </div>
  );
}
function PairCard({
  pair,
  role,
  missionsDone,
  missionsTotal,
  onSelect,
  selected,
}: {
  pair: MentorshipPairWithPeople;
  role: MentorshipRole;
  missionsDone: number;
  missionsTotal: number;
  onSelect: () => void;
  selected: boolean;
}) {
  const closePair = useCloseMentorshipPair();
  const counterpart = role === "mentor" ? pair.apprentice : pair.mentor;

  const statusBadge = useMemo(() => {
    if (pair.status === "active") {
      return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Ativa</Badge>;
    }
    if (pair.status === "completed") {
      return <Badge className="bg-primary/15 text-primary border-primary/30">Concluída</Badge>;
    }
    if (pair.status === "pending") return <Badge variant="secondary">Aguardando</Badge>;
    return <Badge variant="outline">Encerrada</Badge>;
  }, [pair.status]);

  const percent = missionsTotal === 0 ? 0 : Math.round((missionsDone / missionsTotal) * 100);

  return (
    <Card
      className={`transition-colors ${selected ? "border-primary/60 bg-primary/5" : "border-white/5 hover:border-white/20"}`}
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              {role === "mentor" ? "Seu mentorado" : "Seu mentor"}
            </p>
            <PersonChip person={counterpart} />
          </div>
          {statusBadge}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>
              {missionsDone} de {missionsTotal} missões
            </span>
            <span>{percent}%</span>
          </div>
          <Progress value={percent} className="h-2" />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-semibold">
          <span className="inline-flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" /> {pair.total_xp_earned} XP para a dupla
          </span>
          <span className="inline-flex items-center gap-1">
            <Trophy className="h-3.5 w-3.5" /> {pair.total_missions_completed} concluídas
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={selected ? "default" : "outline"} onClick={onSelect}>
            Ver missões
          </Button>

          {pair.status === "active" && (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="text-emerald-400">
                    Concluir mentoria
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Concluir esta mentoria?</AlertDialogTitle>
                    <AlertDialogDescription>
                      A dupla passa para o status "concluída" e sai da lista de mentorias ativas. As missões já
                      registradas continuam no histórico.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => closePair.mutate({ pairId: pair.id, outcome: "completed" })}>
                      Concluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="text-destructive">
                    Encerrar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Encerrar esta mentoria?</AlertDialogTitle>
                    <AlertDialogDescription>
                      A dupla sai da lista de mentorias ativas. Nenhuma missão ou pontuação já conquistada é apagada.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => closePair.mutate({ pairId: pair.id, outcome: "cancelled" })}>
                      Encerrar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MissionCard({
  mission,
  pair,
  role,
  myDone,
  partnerDone,
  settled,
  disabled,
}: {
  mission: MentorshipMission;
  pair: MentorshipPairWithPeople;
  role: MentorshipRole;
  myDone: boolean;
  partnerDone: boolean;
  settled: boolean;
  disabled: boolean;
}) {
  const markPart = useMarkMentorshipPart();
  const partnerRole: MentorshipRole = role === "mentor" ? "apprentice" : "mentor";

  return (
    <Card className="border-white/5 hover:border-white/20 transition-colors">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none" aria-hidden="true">
            {mission.icon}
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold leading-tight">{mission.title}</h3>
              {settled && (
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Concluída</Badge>
              )}
            </div>
            {mission.description && (
              <p className="text-sm text-muted-foreground">{mission.description}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-bold">
            {MISSION_TYPE_LABEL[mission.mission_type]}
          </Badge>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold">
            {DIFFICULTY_LABEL[mission.difficulty]}
          </Badge>
          <Badge
            variant="outline"
            className="text-[10px] uppercase tracking-wider font-bold text-primary border-primary/30"
          >
            +{mission.xp_reward} XP
          </Badge>
          {mission.coin_reward > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] uppercase tracking-wider font-bold text-amber-400 border-amber-400/30"
            >
              +{mission.coin_reward} moedas
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
          <div
            className={`rounded-lg border px-3 py-2 ${myDone ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-white/10 text-muted-foreground"}`}
          >
            Você: {myDone ? "concluído" : "pendente"}
          </div>
          <div
            className={`rounded-lg border px-3 py-2 ${partnerDone ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-white/10 text-muted-foreground"}`}
          >
            {partnerRole === "mentor" ? "Mentor" : "Mentorado"}: {partnerDone ? "concluído" : "pendente"}
          </div>
        </div>

        {pair.status === "active" && (
          <Button
            className="w-full"
            size="sm"
            variant={myDone ? "outline" : "default"}
            disabled={myDone || disabled || markPart.isPending}
            onClick={() => markPart.mutate({ pair, missionId: mission.id, role })}
          >
            {markPart.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {myDone ? "Sua parte está concluída" : "Concluí minha parte"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
export default function Mentoria() {
  const { user } = useAuth();
  const { isAdmin } = useRBAC();

  const missionsQuery = useMentorshipMissions();
  const pairsQuery = useMyMentorshipPairs();
  const incomingQuery = useIncomingMentorshipRequests();
  const sentQuery = useSentMentorshipRequests();

  const [selectedPairId, setSelectedPairId] = useState<string | null>(null);

  const pairs = useMemo(() => pairsQuery.data ?? [], [pairsQuery.data]);
  const missions = missionsQuery.data ?? [];
  const incoming = incomingQuery.data ?? [];
  const sentRequests = sentQuery.data ?? [];

  const activePair = useMemo<MentorshipPairWithPeople | null>(() => {
    if (selectedPairId) return pairs.find((pair) => pair.id === selectedPairId) ?? null;
    return pairs.find((pair) => pair.status === "active") ?? pairs[0] ?? null;
  }, [pairs, selectedPairId]);

  const progressQuery = usePairProgress(activePair?.id ?? null);
  const progress = useMemo(() => progressQuery.data ?? [], [progressQuery.data]);

  const role: MentorshipRole =
    activePair && user && activePair.mentor_id === user.id ? "mentor" : "apprentice";

  const settledByPair = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of progress) {
      if (item.rewards_claimed) counts.set(item.pair_id, (counts.get(item.pair_id) ?? 0) + 1);
    }
    return counts;
  }, [progress]);

  const isLoading = missionsQuery.isLoading || pairsQuery.isLoading;
  const error = missionsQuery.error ?? pairsQuery.error ?? incomingQuery.error ?? sentQuery.error;

  return (
    <PageShell
      title="Mentoria"
      subtitle="Conecte-se com quem já trilhou o caminho e cresça junto"
      icon={<Heart className="w-6 h-6 text-primary" />}
    >
      <PageWrapper pageName="Mentoria">
        <SEOHead
          title="Mentoria | Gamify"
          description="Encontre um mentor ou mentorado, cumpra missões em dupla e ganhe XP e moedas."
        />

        <div className="container max-w-6xl mx-auto p-4 md:p-8 space-y-8 pb-32">
          {error && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
              <h3 className="text-base font-black uppercase tracking-wider text-destructive">
                Não foi possível carregar a mentoria
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {(error as Error)?.message ?? "Erro desconhecido."}
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
          ) : (
            <Tabs defaultValue="missoes" className="space-y-6">
              <TabsList className="bg-transparent h-auto p-0 flex flex-wrap gap-4 border-b border-white/5 pb-3">
                <TabsTrigger
                  value="missoes"
                  className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-3 h-auto text-xs font-black uppercase tracking-[0.2em]"
                >
                  Missões
                </TabsTrigger>
                <TabsTrigger
                  value="duplas"
                  className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-3 h-auto text-xs font-black uppercase tracking-[0.2em]"
                >
                  Minhas duplas ({pairs.length})
                </TabsTrigger>
                <TabsTrigger
                  value="solicitacoes"
                  className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-3 h-auto text-xs font-black uppercase tracking-[0.2em]"
                >
                  Solicitações ({incoming.length})
                </TabsTrigger>
                <TabsTrigger
                  value="encontrar"
                  className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-3 h-auto text-xs font-black uppercase tracking-[0.2em]"
                >
                  Encontrar pessoas
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger
                    value="admin"
                    className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-3 h-auto text-xs font-black uppercase tracking-[0.2em]"
                  >
                    Missões (admin)
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="missoes" className="space-y-6">
                {!activePair ? (
                  <EmptyState
                    icon={Users}
                    title="Você ainda não tem uma dupla de mentoria"
                    description="Envie uma solicitação para alguém e comece a cumprir missões em dupla."
                  />
                ) : (
                  <>
                    <Card className="border-white/5">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-black uppercase tracking-[0.2em]">
                          Dupla em foco
                        </CardTitle>
                        <CardDescription>
                          {role === "mentor" ? "Você é o mentor de" : "Você é mentorado por"}{" "}
                          <strong>
                            {role === "mentor"
                              ? activePair.apprentice?.display_name ?? "—"
                              : activePair.mentor?.display_name ?? "—"}
                          </strong>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-wrap items-center gap-3">
                        <PersonChip person={activePair.mentor} />
                        <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">mentor</span>
                        <span className="text-muted-foreground">•</span>
                        <PersonChip person={activePair.apprentice} />
                        <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">mentorado</span>
                        {pairs.length > 1 && (
                          <Select value={activePair.id} onValueChange={setSelectedPairId}>
                            <SelectTrigger className="ml-auto w-[220px]">
                              <SelectValue placeholder="Trocar dupla" />
                            </SelectTrigger>
                            <SelectContent>
                              {pairs.map((pair) => (
                                <SelectItem key={pair.id} value={pair.id}>
                                  {pair.mentor?.display_name ?? "Mentor"} → {pair.apprentice?.display_name ?? "Mentorado"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </CardContent>
                    </Card>

                    {missions.length === 0 ? (
                      <EmptyState
                        icon={Target}
                        title="Nenhuma missão ativa"
                        description={
                          isAdmin
                            ? "Crie as missões iniciais na aba Missões (admin) para liberar o acompanhamento."
                            : "Peça a um administrador para publicar as missões de mentoria."
                        }
                      />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {missions.map((mission) => {
                          const item = progress.find((row) => row.mission_id === mission.id);
                          return (
                            <MissionCard
                              key={mission.id}
                              mission={mission}
                              pair={activePair}
                              role={role}
                              myDone={
                                role === "mentor" ? !!item?.completed_by_mentor : !!item?.completed_by_apprentice
                              }
                              partnerDone={
                                role === "mentor" ? !!item?.completed_by_apprentice : !!item?.completed_by_mentor
                              }
                              settled={!!item?.rewards_claimed}
                              disabled={progressQuery.isLoading}
                            />
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="duplas" className="space-y-5">
                {pairs.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="Sem duplas por aqui"
                    description="Aceite uma solicitação ou envie a sua para começar uma mentoria."
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {pairs.map((pair) => {
                      const pairRole: MentorshipRole = user && pair.mentor_id === user.id ? "mentor" : "apprentice";
                      return (
                        <PairCard
                          key={pair.id}
                          pair={pair}
                          role={pairRole}
                          missionsDone={settledByPair.get(pair.id) ?? pair.total_missions_completed}
                          missionsTotal={missions.length}
                          onSelect={() => setSelectedPairId(pair.id)}
                          selected={activePair?.id === pair.id}
                        />
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="solicitacoes" className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                    Recebidas
                  </h3>
                  {incoming.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente para você.</p>
                  ) : (
                    incoming.map((request) => <RequestRow key={request.id} request={request} />)
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                    Enviadas
                  </h3>
                  {sentRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Você ainda não enviou solicitações.</p>
                  ) : (
                    sentRequests.map((request) => (
                      <Card key={request.id} className="border-white/5">
                        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold">
                              {request.request_type === "find_mentor" ? "Procuro um mentor" : "Quero mentorar"} ·{" "}
                              {request.target?.display_name ?? "Pessoa"}
                            </p>
                            {request.message && (
                              <p className="text-xs text-muted-foreground line-clamp-2">{request.message}</p>
                            )}
                          </div>
                          <Badge variant={request.status === "accepted" ? "default" : "secondary"}>
                            {REQUEST_STATUS_LABEL[request.status]}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="encontrar">
                <FindPeopleTab />
              </TabsContent>

              {isAdmin && (
                <TabsContent value="admin">
                  <AdminMissionsTab />
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>
      </PageWrapper>
    </PageShell>
  );
}
type MentorshipRequestTypeIntent = "find_mentor" | "find_apprentice";

function RequestRow({ request }: { request: MentorshipRequest & { requester: MentorshipPerson | null } }) {
  const respond = useRespondMentorshipRequest();

  const intent =
    request.request_type === "find_apprentice" ? "quer ser mentorado por você" : "procura você como mentor";

  return (
    <Card className="border-white/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <PersonChip person={request.requester} />
            <p className="text-xs text-muted-foreground">{intent}</p>
          </div>
          <Badge variant="secondary">Pendente</Badge>
        </div>

        {request.message && (
          <p className="text-sm rounded-lg border border-white/10 bg-white/5 p-3">{request.message}</p>
        )}

        <div className="flex gap-2">
          <Button size="sm" disabled={respond.isPending} onClick={() => respond.mutate({ request, accept: true })}>
            <Check className="h-4 w-4 mr-1" /> Aceitar
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={respond.isPending}
            onClick={() => respond.mutate({ request, accept: false })}
          >
            <X className="h-4 w-4 mr-1" /> Recusar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FindPeopleTab() {
  const { user } = useAuth();
  const [intent, setIntent] = useState<MentorshipRequestTypeIntent>("find_mentor");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MentorshipPerson | null>(null);
  const [message, setMessage] = useState("");

  const candidatesQuery = useMentorshipCandidates(search);
  const createRequest = useCreateMentorshipRequest();

  const candidates = candidatesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <Card className="border-white/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-black uppercase tracking-[0.2em]">O que você procura?</CardTitle>
          <CardDescription>Escolha o seu papel e envie a solicitação para quem você quer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant={intent === "find_mentor" ? "default" : "outline"}
              onClick={() => setIntent("find_mentor")}
            >
              Quero um mentor
            </Button>
            <Button
              variant={intent === "find_apprentice" ? "default" : "outline"}
              onClick={() => setIntent("find_apprentice")}
            >
              Quero mentorar alguém
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por nome"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Buscar pessoas por nome"
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Pessoas</h3>
            {candidatesQuery.isLoading ? (
              <Skeleton className="h-24 w-full rounded-xl" />
            ) : candidates.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma pessoa encontrada.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {candidates.map((person) => (
                  <Card key={person.id} className="border-white/5">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <PersonChip person={person} />
                        <p className="text-xs text-muted-foreground mt-1">
                          Nível {person.level ?? 1} · {person.xp ?? 0} XP
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setSelected(person)}>
                        Solicitar
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar solicitação para {selected?.display_name ?? "pessoa"}</AlertDialogTitle>
            <AlertDialogDescription>
              {intent === "find_mentor"
                ? "Você está pedindo para essa pessoa ser sua mentora."
                : "Você está se oferecendo para mentorar essa pessoa."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Textarea
            placeholder="Mensagem (opcional)"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={3}
            aria-label="Mensagem da solicitação"
          />

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={createRequest.isPending || !user}
              onClick={(event) => {
                event.preventDefault();
                if (!user || !selected) return;
                createRequest.mutate(
                  {
                    requesterId: user.id,
                    targetId: selected.id,
                    requestType: intent,
                    message: message.trim() || null,
                  },
                  {
                    onSuccess: () => {
                      setSelected(null);
                      setMessage("");
                    },
                  },
                );
              }}
            >
              Enviar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AdminMissionsTab() {
  const allMissionsQuery = useAllMentorshipMissions(true);
  const createMission = useCreateMentorshipMission();
  const setActive = useSetMentorshipMissionActive();
  const seed = useSeedMentorshipMissions();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [missionType, setMissionType] = useState<MentorshipMissionType>("collaborative");
  const [difficulty, setDifficulty] = useState<MentorshipDifficulty>("medium");
  const [xpReward, setXpReward] = useState("50");
  const [coinReward, setCoinReward] = useState("25");

  const missions = allMissionsQuery.data ?? [];

  const submit = () => {
    if (!title.trim()) return;
    createMission.mutate(
      {
        title: title.trim(),
        description: description.trim() || null,
        icon: icon.trim() || "🎯",
        mission_type: missionType,
        difficulty,
        xp_reward: Number(xpReward) || 0,
        coin_reward: Number(coinReward) || 0,
        order_index: missions.length + 1,
      },
      {
        onSuccess: () => {
          setTitle("");
          setDescription("");
          setIcon("🎯");
          setXpReward("50");
          setCoinReward("25");
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <Card className="border-white/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Catálogo de missões
          </CardTitle>
          <CardDescription>
            Missões são o roteiro da dupla. Desative em vez de apagar para preservar o histórico.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {missions.length === 0 && (
            <Button variant="outline" disabled={seed.isPending} onClick={() => seed.mutate()}>
              <Sparkles className="h-4 w-4 mr-1" /> Criar missões iniciais
            </Button>
          )}

          {allMissionsQuery.isLoading ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : (
            missions.map((mission) => (
              <div
                key={mission.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {mission.icon} {mission.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {MISSION_TYPE_LABEL[mission.mission_type]} · {DIFFICULTY_LABEL[mission.difficulty]} · +
                    {mission.xp_reward} XP · +{mission.coin_reward} moedas
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{mission.is_active ? "Ativa" : "Inativa"}</span>
                  <Switch
                    checked={mission.is_active}
                    onCheckedChange={(checked) => setActive.mutate({ missionId: mission.id, isActive: checked })}
                    aria-label={`Ativar missão ${mission.title}`}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-white/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-black uppercase tracking-[0.2em]">Nova missão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_100px] gap-3">
            <div className="space-y-1">
              <Label htmlFor="mission-title">Título</Label>
              <Input
                id="mission-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex.: Revisar o plano de desenvolvimento"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mission-icon">Ícone</Label>
              <Input id="mission-icon" value={icon} onChange={(event) => setIcon(event.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="mission-description">Descrição</Label>
            <Textarea
              id="mission-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label>Quem faz</Label>
              <Select value={missionType} onValueChange={(value) => setMissionType(value as MentorshipMissionType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="collaborative">Os dois</SelectItem>
                  <SelectItem value="mentor_only">Só o mentor</SelectItem>
                  <SelectItem value="apprentice_only">Só o mentorado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Dificuldade</Label>
              <Select value={difficulty} onValueChange={(value) => setDifficulty(value as MentorshipDifficulty)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Fácil</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="hard">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="mission-xp">XP</Label>
              <Input
                id="mission-xp"
                type="number"
                min={0}
                value={xpReward}
                onChange={(event) => setXpReward(event.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="mission-coins">Moedas</Label>
              <Input
                id="mission-coins"
                type="number"
                min={0}
                value={coinReward}
                onChange={(event) => setCoinReward(event.target.value)}
              />
            </div>
          </div>

          <Button onClick={submit} disabled={!title.trim() || createMission.isPending}>
            {createMission.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Criar missão
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}