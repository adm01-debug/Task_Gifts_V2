import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { campaignImportService } from "@/services/campaignImportService";
import { useToast } from "@/hooks/use-toast";

export function useCampaignImports(campaignId: string | undefined) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const imports = useQuery({
    queryKey: ["campaign-imports", campaignId],
    queryFn: () => campaignImportService.listImports(campaignId!),
    enabled: !!campaignId,
    staleTime: 1000 * 30,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["campaign-imports", campaignId] });
    qc.invalidateQueries({ queryKey: ["sales-campaign", campaignId] });
  };

  const applyMut = useMutation({
    mutationFn: (importId: string) => campaignImportService.applyImport(importId),
    onSuccess: (res) => {
      invalidate();
      toast({
        title: "Importação aplicada",
        description: `${res.applied} linha(s) contabilizada(s), ${res.skipped} ignorada(s) por duplicidade.`,
      });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erro ao aplicar importação";
      toast({ title: "Falha na aplicação", description: msg, variant: "destructive" });
    },
  });

  const revertMut = useMutation({
    mutationFn: (importId: string) => campaignImportService.revertImport(importId),
    onSuccess: (res) => {
      invalidate();
      toast({ title: "Lote revertido", description: `${res.reverted} lançamento(s) desfeito(s).` });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erro ao reverter lote";
      toast({ title: "Falha na reversão", description: msg, variant: "destructive" });
    },
  });

  return {
    imports: imports.data ?? [],
    isLoading: imports.isLoading,
    refetch: imports.refetch,
    apply: applyMut.mutate,
    isApplying: applyMut.isPending,
    revert: revertMut.mutate,
    isReverting: revertMut.isPending,
  };
}
