import { Gift, PackageOpen } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { RARITY_LABEL, type CardRarity } from "@/lib/tradingCards";
import { useOpenCardPack } from "@/hooks/useTradingCards";
import type { CardPackRow } from "@/services/tradingCardsService";

const SOURCE_LABEL: Record<CardPackRow["source"], string> = {
  task: "Tarefa concluída",
  training: "Treinamento concluído",
  quest: "Missão concluída",
  campaign: "Campanha comercial",
  manual: "Concedido pela gestão",
  streak: "Sequência de presença",
};

export interface PackListProps {
  packs: CardPackRow[];
  cardNames: Map<string, string>;
}

/** Pacotes fechados e o resultado dos já abertos. O sorteio ocorre no servidor. */
export function PackList({ packs, cardNames }: PackListProps) {
  const openPack = useOpenCardPack();

  const handleOpen = async (packId: string) => {
    try {
      const result = await openPack.mutateAsync(packId);
      if (!result.success) {
        toast.error("Não foi possível abrir o pacote agora.");
        return;
      }
      const novas = (result.cards || []).filter((c) => c.is_new).length;
      toast.success(
        novas > 0 ? `Pacote aberto! ${novas} carta(s) inédita(s).` : "Pacote aberto! Só repetidas — ótimas para troca.",
      );
    } catch {
      toast.error("Falha ao abrir o pacote. Tente novamente.");
    }
  };

  if (packs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Nenhum pacote por aqui. Conclua tarefas e trilhas para ganhar novos.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {packs.map((pack) => (
        <div
          key={pack.id}
          className="flex flex-col gap-3 rounded-xl border border-border bg-card/60 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Gift className="h-4 w-4 text-primary" aria-hidden="true" />
              Pacote de {pack.size} cartas
            </p>
            <p className="text-xs text-muted-foreground">{SOURCE_LABEL[pack.source]}</p>
            {pack.status === "opened" && pack.result && (
              <p className="mt-1 text-xs text-muted-foreground">
                {pack.result
                  .map(
                    (c) =>
                      `${cardNames.get(c.card_id) ?? "Carta"} (${RARITY_LABEL[c.rarity as CardRarity] ?? "?"})${c.is_new ? " ✦" : ""}`,
                  )
                  .join(" · ")}
              </p>
            )}
          </div>

          {pack.status === "sealed" ? (
            <Button
              onClick={() => void handleOpen(pack.id)}
              disabled={openPack.isPending}
              className="min-h-[44px] shrink-0"
            >
              <PackageOpen className="mr-2 h-4 w-4" aria-hidden="true" />
              Abrir pacote
            </Button>
          ) : (
            <span className="shrink-0 text-xs text-muted-foreground">Aberto</span>
          )}
        </div>
      ))}
    </div>
  );
}
