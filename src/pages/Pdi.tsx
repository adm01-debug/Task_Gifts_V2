import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BookOpen, Loader2, Plus, Trash2, Users } from "lucide-react";
import { PageShell } from "@/components/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useRBAC } from "@/hooks/useRBAC";
import { useMyDevelopmentPlans } from "@/hooks/useDevelopmentPlans";
import { usePDI } from "@/hooks/usePDI";
import { useProfiles } from "@/hooks/useProfiles";
import { toast } from "sonner";

interface ProfileOption {
  id: string;
  display_name?: string | null;
  email?: string | null;
}

const PLAN_STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  active: "Ativo",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const MENTOR_ROLES = [
  { value: "mentor", label: "Mentor" },
  { value: "coach", label: "Coach" },
  { value: "sponsor", label: "Padrinho / Sponsor" },
];

const formateDate = (value?: string | null) => {
  if (!value) return "sem prazo";
  try {
    return format(new Date(value), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return "sem prazo";
  }
};

export default function Pdi() {
  const { user } = useAuth();
  const { isAdmin, isManager } = useRBAC();
  // pdi_mentors_insert foi endurecida (manager/admin) na migration 20260306000250.
  const canManageMentors = isAdmin || isManager;
  const { data: plans = [], isLoading: plansLoading } = useMyDevelopmentPlans();
  const { data: profilesData } = useProfiles();
  const profiles = (profilesData ?? []) as unknown as ProfileOption[];

  const [planId, setPlanId] = useState("");
  const activePlan = useMemo(
    () => plans.find((plan) => plan.id === planId) ?? plans[0],
    [plans, planId],
  );

  const { templates, mentors, checkins, addMentor, removeMentor, createCheckin, applyTemplate } =
    usePDI(activePlan?.id);

  if (plansLoading) {
    return (
      <PageShell title="PDI" subtitle="Plano de Desenvolvimento Individual: templates, mentores e check-ins.">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 flex items-center justify-center text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando seus PDIs...
        </div>
      </PageShell>
    );
  }

  if (!activePlan) {
    return (
      <PageShell title="PDI" subtitle="Plano de Desenvolvimento Individual: templates, mentores e check-ins.">
        <div className="max-w-3xl mx-auto px-6 md:px-12 py-16">
          <Card>
            <CardHeader>
              <CardTitle>Você ainda não tem um PDI</CardTitle>
              <CardDescription>
                O plano de desenvolvimento é criado pelo seu gestor a partir de uma avaliação 9-Box, de um feedback
                360° ou manualmente. Quando ele existir, você poderá aplicar templates, registrar mentores e fazer
                check-ins aqui.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="PDI"
      subtitle="Plano de Desenvolvimento Individual: templates, mentores e check-ins."
      icon={<BookOpen className="w-6 h-6" />}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 pb-16 space-y-6">
        <Card>
          <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Plano selecionado</p>
              <p className="text-lg font-semibold truncate">{activePlan.title}</p>
              <p className="text-sm text-muted-foreground">
                {PLAN_STATUS_LABEL[activePlan.status] ?? activePlan.status} · prazo {formateDate(activePlan.target_date)}
              </p>
            </div>
            <div className="w-full md:w-72">
              <Select value={activePlan.id} onValueChange={setPlanId}>
                <SelectTrigger aria-label="Selecionar plano de desenvolvimento">
                  <SelectValue placeholder="Escolher plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="templates">
          <TabsList>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="mentores">Mentores</TabsTrigger>
            <TabsTrigger value="checkins">Check-ins</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            <CardDescription>
              Aplicar um template copia as ações previstas para este PDI. Ações já registradas são mantidas.
            </CardDescription>
            {templates.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  Nenhum template ativo cadastrado. Peça ao RH para cadastrar templates de PDI.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <CardDescription>{template.description || "Sem descrição"}</CardDescription>
                        </div>
                        <Badge variant="secondary">{template.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {(template.actions_template ?? []).slice(0, 4).map((action, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {action.title}
                          </Badge>
                        ))}
                        {(template.actions_template?.length ?? 0) > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{(template.actions_template?.length ?? 0) - 4}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {template.actions_template?.length ?? 0} ações
                        {template.estimated_duration_months
                          ? ` · ~${template.estimated_duration_months} meses`
                          : ""}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() =>
                          applyTemplate(
                            { planId: activePlan.id, templateId: template.id },
                            {
                              onError: (error: unknown) =>
                                toast.error("Não foi possível aplicar o template", {
                                  description: error instanceof Error ? error.message : undefined,
                                }),
                            },
                          )
                        }
                      >
                        <Plus className="w-3 h-3" /> Aplicar a este PDI
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mentores" className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <CardDescription>Quem acompanha este PDI.</CardDescription>
              {canManageMentors ? (
                <AddMentorDialog
                profiles={profiles.filter((profile) => profile.id !== user?.id)}
                onSubmit={(payload, onDone) =>
                  addMentor(
                    { ...payload, plan_id: activePlan.id, status: "active" },
                    { onSuccess: onDone, onError: (error: unknown) => {
                      toast.error("Não foi possível adicionar o mentor", {
                        description: error instanceof Error ? error.message : undefined,
                      });
                      onDone();
                    } },
                  )
                }
              />
              ) : (
                <span className="text-xs text-muted-foreground text-right">
                  Só gestor ou admin vincula mentores.
                </span>
              )}
            </div>
            {mentors.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  Nenhum mentor vinculado a este PDI.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {mentors.map((mentor) => {
                  const profile = profiles.find((item) => item.id === mentor.mentor_id);
                  return (
                    <Card key={mentor.id}>
                      <CardContent className="p-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {profile?.display_name || profile?.email || mentor.mentor_id}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">{mentor.role}</p>
                          {mentor.notes && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{mentor.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline">{mentor.status}</Badge>
                          {canManageMentors && (
                            <RemoveMentorButton
                              onConfirm={() =>
                                removeMentor(mentor.id, {
                                  onError: (error: unknown) =>
                                    toast.error("Não foi possível remover o mentor", {
                                      description: error instanceof Error ? error.message : undefined,
                                    }),
                                })
                              }
                            />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="checkins" className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <CardDescription>Registro periódico de progresso, bloqueios e próximos passos.</CardDescription>
              <AddCheckinDialog
                onSubmit={(payload, onDone) =>
                  createCheckin(
                    { ...payload, plan_id: activePlan.id, created_by: user?.id ?? "" },
                    { onSuccess: onDone, onError: (error: unknown) => {
                      toast.error("Não foi possível registrar o check-in", {
                        description: error instanceof Error ? error.message : undefined,
                      });
                      onDone();
                    } },
                  )
                }
              />
            </div>
            {checkins.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  Nenhum check-in registrado. O primeiro check-in normalmente acontece na primeira conversa com o
                  mentor.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {checkins.map((checkin) => (
                  <Card key={checkin.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-3">
                        <CardTitle className="text-base">
                          Check-in de {formateDate(checkin.checkin_date)}
                        </CardTitle>
                        {typeof checkin.mood_rating === "number" && (
                          <Badge variant="secondary">Ânimo {checkin.mood_rating}/5</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2 text-sm">
                      {checkin.progress_summary && (
                        <p><span className="font-medium">Progresso: </span>{checkin.progress_summary}</p>
                      )}
                      {checkin.blockers && (
                        <p><span className="font-medium">Bloqueios: </span>{checkin.blockers}</p>
                      )}
                      {checkin.next_steps && (
                        <p><span className="font-medium">Próximos passos: </span>{checkin.next_steps}</p>
                      )}
                      {checkin.manager_feedback && (
                        <p className="text-muted-foreground">
                          <span className="font-medium">Feedback do gestor: </span>{checkin.manager_feedback}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}

function RemoveMentorButton({ onConfirm }: { onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button
        size="icon"
        variant="ghost"
        aria-label="Remover mentor"
        onClick={() => setConfirming(true)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        variant="destructive"
        onClick={() => {
          onConfirm();
          setConfirming(false);
        }}
      >
        Remover
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
        Cancelar
      </Button>
    </div>
  );
}

function AddMentorDialog({
  profiles,
  onSubmit,
}: {
  profiles: ProfileOption[];
  onSubmit: (
    payload: { mentor_id: string; role: string; notes?: string },
    onDone: () => void,
  ) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mentorId, setMentorId] = useState("");
  const [role, setRole] = useState("mentor");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (!mentorId) {
      toast.error("Selecione quem vai acompanhar o PDI");
      return;
    }
    onSubmit(
      { mentor_id: mentorId, role, notes: notes.trim() || undefined },
      () => {
        setOpen(false);
        setMentorId("");
        setNotes("");
        setRole("mentor");
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Users className="w-3 h-3" /> Adicionar mentor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar mentor</DialogTitle>
          <DialogDescription>Escolha quem vai acompanhar este plano de desenvolvimento.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mentor-select">Pessoa</Label>
            <Select value={mentorId} onValueChange={setMentorId}>
              <SelectTrigger id="mentor-select">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.display_name || profile.email || profile.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mentor-role">Papel</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="mentor-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MENTOR_ROLES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mentor-notes">Observações</Label>
            <Textarea
              id="mentor-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Combinados, frequência das conversas..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddCheckinDialog({
  onSubmit,
}: {
  onSubmit: (
    payload: {
      checkin_date: string;
      progress_summary?: string;
      blockers?: string;
      next_steps?: string;
      mood_rating?: number;
    },
    onDone: () => void,
  ) => void;
}) {
  const [open, setOpen] = useState(false);
  const [checkinDate, setCheckinDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [progress, setProgress] = useState("");
  const [blockers, setBlockers] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [mood, setMood] = useState("4");

  const handleSubmit = () => {
    if (!checkinDate) {
      toast.error("Informe a data do check-in");
      return;
    }
    onSubmit(
      {
        checkin_date: checkinDate,
        progress_summary: progress.trim() || undefined,
        blockers: blockers.trim() || undefined,
        next_steps: nextSteps.trim() || undefined,
        mood_rating: Number(mood),
      },
      () => {
        setOpen(false);
        setProgress("");
        setBlockers("");
        setNextSteps("");
        setMood("4");
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus className="w-3 h-3" /> Registrar check-in
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo check-in</DialogTitle>
          <DialogDescription>Registre progresso, bloqueios e próximos passos deste PDI.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkin-date">Data</Label>
              <Input
                id="checkin-date"
                type="date"
                value={checkinDate}
                onChange={(event) => setCheckinDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkin-mood">Ânimo (1 a 5)</Label>
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger id="checkin-mood">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["1", "2", "3", "4", "5"].map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkin-progress">Progresso</Label>
            <Textarea
              id="checkin-progress"
              value={progress}
              onChange={(event) => setProgress(event.target.value)}
              placeholder="O que avançou desde o último check-in?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkin-blockers">Bloqueios</Label>
            <Textarea
              id="checkin-blockers"
              value={blockers}
              onChange={(event) => setBlockers(event.target.value)}
              placeholder="O que está impedindo o avanço?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkin-next">Próximos passos</Label>
            <Textarea
              id="checkin-next"
              value={nextSteps}
              onChange={(event) => setNextSteps(event.target.value)}
              placeholder="O que será feito até o próximo encontro?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>Registrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}