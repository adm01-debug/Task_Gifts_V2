import { useMemo, useState } from "react";
import { MessageSquareHeart } from "lucide-react";
import { PageShell } from "@/components/navigation";
import { MobilePageLayout } from "@/components/mobile";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRBAC } from "@/hooks/useRBAC";
import { useOpinionFeed, useToggleOpinionSupport } from "@/hooks/useOpinions";
import { OpinionComposer } from "@/components/engagement/opinions/OpinionComposer";
import { OpinionCard } from "@/components/engagement/opinions/OpinionCard";
import { OpinionTreatmentDialog } from "@/components/engagement/opinions/OpinionTreatmentDialog";
import {
  OPINION_STATUSES,
  STATUS_LABELS,
  sortOpinionQueue,
  summarizeOpinionFeed,
  type OpinionFeedEntry,
  type OpinionStatus,
} from "@/lib/opinionChannel";

const ALL_STATUS = "all";

function SummaryCard({ label, value, emphasis }: { label: string; value: number; emphasis?: boolean }) {
  return (
    <Card className="glass border-border/50">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={emphasis && value > 0 ? "text-2xl font-bold text-destructive" : "text-2xl font-bold"}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export default function OpinionChannel() {
  const isMobile = useIsMobile();
  const { isAdmin, isManager } = useRBAC();
  const canHandle = isAdmin || isManager;

  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUS);
  const [selected, setSelected] = useState<OpinionFeedEntry | null>(null);

  const mine = useOpinionFeed("mine");
  const queue = useOpinionFeed(
    "queue",
    statusFilter === ALL_STATUS ? null : (statusFilter as OpinionStatus),
  );

  const toggleSupport = useToggleOpinionSupport();

  const queueEntries = useMemo(() => sortOpinionQueue(queue.data ?? []), [queue.data]);
  const summary = useMemo(() => summarizeOpinionFeed(queueEntries), [queueEntries]);

  const myFeed = (
    <div className="space-y-4">
      <OpinionComposer className="glass border-border/50" />
      {mine.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (mine.data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Você ainda não registrou manifestações. O que for enviado aparece aqui com a situação da
          tratativa.
        </p>
      ) : (
        <div className="space-y-3">
          {(mine.data ?? []).map((entry) => (
            <OpinionCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );

  const handlerFeed = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Manifestações" value={summary.total} />
        <SummaryCard label="Em aberto" value={summary.open} />
        <SummaryCard label="Atrasadas" value={summary.overdue} emphasis />
        <SummaryCard label="Respondidas" value={summary.byStatus.resolved} />
      </div>

      {summary.anonymityNotice && (
        <p className="text-xs text-muted-foreground">{summary.anonymityNotice}</p>
      )}

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-full min-h-11 sm:w-[220px]" aria-label="Filtrar por situação">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_STATUS}>Todas as situações</SelectItem>
          {OPINION_STATUSES.map((key) => (
            <SelectItem key={key} value={key}>
              {STATUS_LABELS[key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {queue.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : queueEntries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma manifestação nesta situação. A fila prioriza automaticamente as atrasadas e as de
          maior urgência.
        </p>
      ) : (
        <div className="space-y-3">
          {queueEntries.map((entry) => (
            <OpinionCard
              key={entry.id}
              entry={entry}
              supportPending={toggleSupport.isPending}
              onSupport={(e) => toggleSupport.mutate(e.id)}
              onOpen={setSelected}
            />
          ))}
        </div>
      )}
    </div>
  );

  const content = canHandle ? (
    <Tabs defaultValue="queue" className="space-y-4">
      <TabsList>
        <TabsTrigger value="queue">Fila de tratativa</TabsTrigger>
        <TabsTrigger value="mine">Minhas manifestações</TabsTrigger>
      </TabsList>
      <TabsContent value="queue">{handlerFeed}</TabsContent>
      <TabsContent value="mine">{myFeed}</TabsContent>
    </Tabs>
  ) : (
    myFeed
  );

  return (
    <PageShell title="Canal de Opiniões">
      {isMobile ? (
        <MobilePageLayout
          title="Canal de Opiniões"
          icon={MessageSquareHeart}
          backPath="/engajamento"
          subtitle="Voz do colaborador, com anonimato garantido"
        >
          {content}
        </MobilePageLayout>
      ) : (
        <div className="space-y-6">
          <header>
            <h1 className="text-2xl font-bold">Canal de Opiniões</h1>
            <p className="text-sm text-muted-foreground">
              Sugestões, reclamações e elogios com anonimato garantido, prazo de tratativa por
              urgência e virada direta para plano de ação 5W2H.
            </p>
          </header>
          {content}
        </div>
      )}

      <OpinionTreatmentDialog entry={selected} onClose={() => setSelected(null)} />
    </PageShell>
  );
}