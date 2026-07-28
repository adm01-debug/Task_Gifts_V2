import { useMemo, useState } from "react";
import { Gavel, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateAuction } from "@/hooks/useAuctions";
import { hasBlockingIssues, validateAuctionDraft, type AuctionDraft } from "@/lib/auctionAdmin";

/** Converte um `datetime-local` (hora local) em ISO UTC aceito pelo banco. */
function toIso(value: string): string {
  if (!value) return "";
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? new Date(time).toISOString() : "";
}

function defaultStart(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

function defaultEnd(): string {
  const end = new Date(Date.now() + 48 * 3_600_000);
  end.setMinutes(end.getMinutes() - end.getTimezoneOffset());
  return end.toISOString().slice(0, 16);
}

export function AuctionAdminForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startingBid, setStartingBid] = useState("100");
  const [minIncrement, setMinIncrement] = useState("10");
  const [startsAt, setStartsAt] = useState(defaultStart);
  const [endsAt, setEndsAt] = useState(defaultEnd);

  const createAuction = useCreateAuction();

  const draft = useMemo<AuctionDraft>(
    () => ({
      title,
      description,
      startingBid: Number(startingBid),
      minIncrement: Number(minIncrement),
      startsAt: toIso(startsAt),
      endsAt: toIso(endsAt),
      status: "draft",
    }),
    [title, description, startingBid, minIncrement, startsAt, endsAt],
  );

  const issues = useMemo(() => validateAuctionDraft(draft, Date.now()), [draft]);
  const blocked = hasBlockingIssues(issues);

  const handleSubmit = async () => {
    if (blocked) return;
    try {
      await createAuction.mutateAsync({
        title: draft.title,
        description: draft.description,
        starting_bid: draft.startingBid,
        min_increment: draft.minIncrement,
        starts_at: draft.startsAt,
        ends_at: draft.endsAt,
      });
      toast.success("Leilão criado como rascunho. Publique quando estiver pronto.");
      setTitle("");
      setDescription("");
    } catch (err: unknown) {
      toast.error("Não foi possível criar o leilão.");
    }
  };

  return (
    <Card className="border-border/60 bg-card/70 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Gavel className="h-4 w-4" aria-hidden />
          Novo leilão
        </CardTitle>
        <CardDescription>
          Criado sempre como rascunho: nenhum lance é aceito antes da publicação explícita.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="auction-title">Título</Label>
          <Input
            id="auction-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ex.: Fone Bluetooth Premium"
            maxLength={120}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="auction-description">Descrição</Label>
          <Textarea
            id="auction-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Detalhes do item disputado"
            maxLength={800}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="auction-starting-bid">Lance inicial (moedas)</Label>
            <Input
              id="auction-starting-bid"
              type="number"
              min={1}
              step={1}
              value={startingBid}
              onChange={(event) => setStartingBid(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auction-min-increment">Incremento mínimo</Label>
            <Input
              id="auction-min-increment"
              type="number"
              min={1}
              step={1}
              value={minIncrement}
              onChange={(event) => setMinIncrement(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auction-starts-at">Início</Label>
            <Input
              id="auction-starts-at"
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auction-ends-at">Término</Label>
            <Input
              id="auction-ends-at"
              type="datetime-local"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
            />
          </div>
        </div>

        {issues.length > 0 && (
          <Alert variant={blocked ? "destructive" : "default"}>
            <AlertDescription>
              <ul className="list-inside list-disc space-y-1 text-sm">
                {issues.map((issue) => (
                  <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleSubmit}
          disabled={blocked || createAuction.isPending}
          className="w-full min-h-[44px]"
        >
          {createAuction.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          ) : null}
          Criar rascunho
        </Button>
      </CardContent>
    </Card>
  );
}