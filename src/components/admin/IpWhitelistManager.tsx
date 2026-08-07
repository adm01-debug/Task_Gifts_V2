import { useState } from "react";
import { useIpWhitelist } from "@/hooks/useIpWhitelist";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Plus, Trash2, Edit, RefreshCw, Clock, CheckCircle, XCircle, Globe } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function IpWhitelistManager() {
  const {
    whitelist,
    accessLogs,
    isLoading,
    isLoadingLogs,
    addIp,
    updateIp,
    deleteIp,
    toggleStatus,
    isAdding,
    validateIp,
    refetch,
    refetchLogs,
  } = useIpWhitelist();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newIp, setNewIp] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newExpiresAt, setNewExpiresAt] = useState("");
  const [ipError, setIpError] = useState("");

  const handleAddIp = () => {
    if (!newIp.trim()) {
      setIpError("IP é obrigatório");
      return;
    }
    
    if (!validateIp(newIp.trim())) {
      setIpError("Formato de IP inválido");
      return;
    }

    addIp({
      ip_address: newIp.trim(),
      description: newDescription.trim() || undefined,
      expires_at: newExpiresAt || undefined,
    });

    setNewIp("");
    setNewDescription("");
    setNewExpiresAt("");
    setIpError("");
    setIsAddDialogOpen(false);
  };

  const handleUpdateDescription = (id: string, description: string) => {
    updateIp({ id, input: { description } });
    setEditingId(null);
  };

  const getStatusBadge = (entry: typeof whitelist[0]) => {
    if (!entry.is_active) {
      return <Badge variant="secondary">Inativo</Badge>;
    }
    if (entry.expires_at && new Date(entry.expires_at) < new Date()) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Ativo</Badge>;
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Whitelist de IPs</CardTitle>
              <CardDescription>Gerencie IPs confiáveis com acesso permitido</CardDescription>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar IP
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar IP à Whitelist</DialogTitle>
                <DialogDescription>
                  Adicione um endereço IP ou range CIDR para permitir acesso
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="ip">Endereço IP *</Label>
                  <Input
                    id="ip"
                    placeholder="192.168.1.1 ou 10.0.0.0/24"
                    value={newIp}
                    onChange={(e) => {
                      setNewIp(e.target.value);
                      setIpError("");
                    }}
                    className={ipError ? "border-destructive" : ""}
                  />
                  {ipError && <p className="text-sm text-destructive">{ipError}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    placeholder="Ex: Escritório principal"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expires">Data de Expiração (opcional)</Label>
                  <Input
                    id="expires"
                    type="datetime-local"
                    value={newExpiresAt}
                    onChange={(e) => setNewExpiresAt(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddIp} disabled={isAdding}>
                  {isAdding ? "Adicionando..." : "Adicionar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="whitelist" className="space-y-4">
          <TabsList>
            <TabsTrigger value="whitelist" className="gap-2">
              <Globe className="h-4 w-4" />
              IPs ({whitelist.length})
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <Clock className="h-4 w-4" />
              Logs de Acesso
            </TabsTrigger>
          </TabsList>

          <TabsContent value="whitelist" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => refetch()} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : whitelist.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum IP na whitelist</p>
                <p className="text-sm">Adicione IPs confiáveis para controlar o acesso</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead>Criado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {whitelist.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono">{entry.ip_address}</TableCell>
                      <TableCell>
                        {editingId === entry.id ? (
                          <Input
                            defaultValue={entry.description || ""}
                            onBlur={(e) => handleUpdateDescription(entry.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleUpdateDescription(entry.id, e.currentTarget.value);
                              }
                              if (e.key === "Escape") {
                                setEditingId(null);
                              }
                            }}
                            autoFocus
                            className="h-8"
                          />
                        ) : (
                          <span 
                            className="cursor-pointer hover:underline"
                            onClick={() => setEditingId(entry.id)}
                          >
                            {entry.description || <span className="text-muted-foreground italic">Sem descrição</span>}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(entry)}</TableCell>
                      <TableCell>
                        {entry.expires_at ? (
                          <span className="text-sm">
                            {format(new Date(entry.expires_at), "dd/MM/yyyy HH:mm")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Nunca</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(entry.created_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={entry.is_active}
                            onCheckedChange={(checked) => 
                              toggleStatus({ id: entry.id, isActive: checked })
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingId(entry.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover IP</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja remover {entry.ip_address} da whitelist?
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteIp(entry.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => refetchLogs()} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
            </div>

            {isLoadingLogs ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : accessLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum log de acesso</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Razão</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {log.was_allowed ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{log.ip_address}</TableCell>
                      <TableCell className="text-sm">{log.endpoint || "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.reason || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
