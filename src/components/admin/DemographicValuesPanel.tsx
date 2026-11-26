import { useMemo, useState } from "react";
import { AlertTriangle, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAllDemographicValues } from "@/hooks/useDemographics";
import { useProfilesPublic } from "@/hooks/useProfiles";
import { valorExibivel } from "@/services/demographicsService";
import { format } from "date-fns";

/**
 * Leitura das respostas demograficas por colaborador. Atende a policy
 * "Admins and managers can view demographic values".
 *
 * `is_visible_in_reports = false` separa o que e' uso interno: essas linhas
 * ficam escondidas ate' ligar "Incluir uso interno". Atributo `is_restricted`
 * tem o valor escondido de quem nao e' administrador.
 */
export function DemographicValuesPanel({ ehAdmin }: { ehAdmin: boolean }) {
  const { data: valores = [], isLoading, isError, refetch } = useAllDemographicValues();
  const [incluirInternos, setIncluirInternos] = useState(false);

  const visiveis = useMemo(
    () => valores.filter((v) => incluirInternos || v.demographic_attributes?.is_visible_in_reports !== false),
    [valores, incluirInternos],
  );

  const ids = useMemo(() => Array.from(new Set(visiveis.map((v) => v.user_id))), [visiveis]);
  const { data: perfis = [] } = useProfilesPublic(ids);

  const nomeDe = (userId: string) =>
    perfis.find((p) => p.id === userId)?.display_name || "Colaborador sem nome";

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="flex items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3"
      >
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" aria-hidden />
          <p className="text-xs text-muted-foreground">
            Não foi possível carregar as respostas demográficas.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-1 h-3 w-3" aria-hidden />
          Tentar de novo
        </Button>
      </div>
    );
  }

  const ocultos = valores.length - visiveis.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {visiveis.length} resposta(s) de {ids.length} colaborador(es).
          {ocultos > 0 && !incluirInternos ? ` ${ocultos} de uso interno oculta(s).` : ""}
        </p>
        <div className="flex items-center gap-3 rounded-lg border border-border/40 px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {incluirInternos ? (
              <Eye className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <EyeOff className="h-3.5 w-3.5" aria-hidden />
            )}
            Incluir uso interno
          </div>
          <Switch
            checked={incluirInternos}
            onCheckedChange={setIncluirInternos}
            aria-label="Incluir atributos de uso interno"
          />
        </div>
      </div>

      {visiveis.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <p className="text-sm font-medium">Nenhuma resposta registrada</p>
            <p className="mt-1 text-xs text-muted-foreground">
              As respostas aparecem aqui assim que os colaboradores preencherem os atributos no perfil.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Atributo</TableHead>
                <TableHead>Resposta</TableHead>
                <TableHead className="whitespace-nowrap">Atualizado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.map((valor) => {
                const restrito = valor.demographic_attributes?.is_restricted === true;
                const escondido = restrito && !ehAdmin;
                return (
                  <TableRow key={valor.id}>
                    <TableCell className="whitespace-nowrap">{nomeDe(valor.user_id)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{valor.demographic_attributes?.name ?? "Atributo removido"}</span>
                        {valor.demographic_attributes?.is_visible_in_reports === false && (
                          <Badge variant="outline">Uso interno</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {escondido ? (
                        <span className="text-xs text-muted-foreground">
                          Restrito a administradores
                        </span>
                      ) : (
                        valorExibivel(valor)
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {format(new Date(valor.updated_at), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default DemographicValuesPanel;