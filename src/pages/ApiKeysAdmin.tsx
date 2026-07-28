import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, KeyRound, RotateCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CreateApiKeyDialog } from "@/components/admin/CreateApiKeyDialog";
import { IssuedCredentialDialog } from "@/components/admin/IssuedCredentialDialog";
import {
  ROTATION_MAX_AGE_DAYS,
  deleteApiKey,
  keysNeedingRotation,
  listApiKeys,
  rotateApiSecret,
  setApiKeyActive,
  type ExternalApiKeySummary,
  type IssuedApiCredential,
} from "@/services/apiKeysService";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function ApiKeysAdmin() {
  const queryClient = useQueryClient();
  const [issued, setIssued] = useState<IssuedApiCredential | null>(null);

  useEffect(() => {
    document.title = "Chaves de API — Administração";
  }, []);

  const { data, isLoading, error } = useQuery<ExternalApiKeySummary[]>({
    queryKey: ["external-api-keys"],
    queryFn: listApiKeys,
    staleTime: 30_000,
  });

  const keys = useMemo(() => data || [], [data]);
  const stale = useMemo(() => keysNeedingRotation(keys), [keys]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["external-api-keys"] });

  const rotateMutation = useMutation({
    mutationFn: (id: string) => rotateApiSecret(id),
    onSuccess: (credential) => {
      invalidate();
      setIssued(credential);
      toast.success("Segredo rotacionado. Atualize a integração.");
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Falha ao rotacionar o segredo."),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setApiKeyActive(id, active),
    onSuccess: () => {
      invalidate();
      toast.success("Status atualizado.");
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Falha ao atualizar o status."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteApiKey(id),
    onSuccess: () => {
      invalidate();
      toast.success("Chave removida.");
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Falha ao remover a chave."),
  });

  return (
    <PageShell title="Chaves de API" backFallback="/admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 pb-24 md:p-6 lg:p-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Chaves de API</h1>
              <p className="text-muted-foreground">
                Credenciais de integrações externas — segredos armazenados apenas como hash
              </p>
            </div>
          </div>
          <CreateApiKeyDialog onIssued={setIssued} />
        </header>

        {stale.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Rotação pendente</AlertTitle>
            <AlertDescription>
              {stale.length} chave(s) ativa(s) sem rotação há {ROTATION_MAX_AGE_DAYS} dias ou mais:{" "}
              {stale.map((k) => k.name).join(", ")}.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Chaves cadastradas</CardTitle>
            <CardDescription>
              O segredo é exibido uma única vez, na criação ou na rotação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={`sk-${i}`} className="h-12 w-full" />
                ))}
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro ao carregar</AlertTitle>
                <AlertDescription>
                  Não foi possível listar as chaves de API. Tente novamente.
                </AlertDescription>
              </Alert>
            )}

            {!isLoading && !error && keys.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">
                Nenhuma chave de API cadastrada.
              </p>
            )}

            {!isLoading && !error && keys.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Identificador</TableHead>
                      <TableHead>Permissões</TableHead>
                      <TableHead>Último uso</TableHead>
                      <TableHead>Rotação</TableHead>
                      <TableHead>Ativa</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keys.map((key) => {
                      const overdue = key.days_since_rotation >= ROTATION_MAX_AGE_DAYS;
                      return (
                        <TableRow key={key.id}>
                          <TableCell className="font-medium">
                            {key.name}
                            {key.description && (
                              <p className="text-xs text-muted-foreground">{key.description}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs">{key.api_key}</code>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {key.permissions.map((permission) => (
                                <Badge key={permission} variant="secondary">
                                  {permission}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(key.last_used_at)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={overdue ? "destructive" : "outline"}>
                              {key.days_since_rotation}d
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={key.is_active}
                              aria-label={`Ativar chave ${key.name}`}
                              disabled={toggleMutation.isPending}
                              onCheckedChange={(checked) =>
                                toggleMutation.mutate({ id: key.id, active: checked })
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={rotateMutation.isPending}
                                onClick={() => rotateMutation.mutate(key.id)}
                              >
                                <RotateCw className="mr-1 h-4 w-4" />
                                Rotacionar
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label={`Remover chave ${key.name}`}
                                disabled={deleteMutation.isPending}
                                onClick={() => deleteMutation.mutate(key.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <IssuedCredentialDialog credential={issued} onClose={() => setIssued(null)} />
    </PageShell>
  );
}
