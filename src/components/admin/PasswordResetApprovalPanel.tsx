import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Key,
  Check,
  X,
  Clock,
  AlertCircle,
  Loader2,
  User,
  Calendar,
  MessageSquare,
  Bell,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { passwordResetService, type PasswordResetRequest } from "@/services/passwordResetService";
import { toast } from "sonner";
import { usePasswordResetRealtime } from "@/hooks/usePasswordResetRealtime";

export function PasswordResetApprovalPanel() {
  // Enable realtime notifications
  usePasswordResetRealtime();
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedRequest, setSelectedRequest] = useState<PasswordResetRequest | null>(null);
  const [notes, setNotes] = useState("");
  const [dialogAction, setDialogAction] = useState<"approve" | "reject" | null>(null);
  const queryClient = useQueryClient();

  const { data: pendingRequests = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["password-reset-requests", "pending"],
    queryFn: () => passwordResetService.getPendingTeamRequests(),
  });

  const { data: allRequests = [], isLoading: allLoading } = useQuery({
    queryKey: ["password-reset-requests", "all"],
    queryFn: () => passwordResetService.getAllRequests(),
  });

  const approveMutation = useMutation({
    mutationFn: ({ requestId, notes }: { requestId: string; notes?: string }) =>
      passwordResetService.approveRequest(requestId, notes),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["password-reset-requests"] });
        toast.success("Solicitação aprovada!");
        closeDialog();
      } else {
        toast.error(result.error || "Erro ao aprovar");
      }
    },
    onError: () => toast.error("Erro ao aprovar solicitação"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ requestId, notes }: { requestId: string; notes?: string }) =>
      passwordResetService.rejectRequest(requestId, notes),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["password-reset-requests"] });
        toast.success("Solicitação rejeitada");
        closeDialog();
      } else {
        toast.error(result.error || "Erro ao rejeitar");
      }
    },
    onError: () => toast.error("Erro ao rejeitar solicitação"),
  });

  const openDialog = (request: PasswordResetRequest, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setDialogAction(action);
    setNotes("");
  };

  const closeDialog = () => {
    setSelectedRequest(null);
    setDialogAction(null);
    setNotes("");
  };

  const handleConfirm = () => {
    if (!selectedRequest) return;

    if (dialogAction === "approve") {
      approveMutation.mutate({ requestId: selectedRequest.id, notes });
    } else if (dialogAction === "reject") {
      rejectMutation.mutate({ requestId: selectedRequest.id, notes });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pendente" },
      approved: { variant: "default", label: "Aprovado" },
      rejected: { variant: "destructive", label: "Rejeitado" },
      expired: { variant: "outline", label: "Expirado" },
      completed: { variant: "default", label: "Concluído" },
    };

    const config = variants[status] || { variant: "outline", label: status };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const renderRequestsTable = (requests: PasswordResetRequest[], showActions: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Usuário</TableHead>
          <TableHead>Solicitado em</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Expira em</TableHead>
          {!showActions && <TableHead>Aprovador</TableHead>}
          {showActions && <TableHead className="text-right">Ações</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showActions ? 5 : 5} className="text-center py-8 text-muted-foreground">
              Nenhuma solicitação encontrada
            </TableCell>
          </TableRow>
        ) : (
          requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{request.profiles?.display_name || "Usuário"}</p>
                    <p className="text-xs text-muted-foreground">{request.profiles?.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {formatDistanceToNow(new Date(request.requested_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(request.status)}</TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(request.expires_at), "dd/MM/yyyy HH:mm")}
                </span>
              </TableCell>
              {!showActions && (
                <TableCell>
                  {request.reviewer?.display_name || "-"}
                </TableCell>
              )}
              {showActions && (
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => openDialog(request, "approve")}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => openDialog(request, "reject")}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Aprovação de Reset de Senha
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2 animate-pulse">
                <Bell className="h-3 w-3 mr-1" />
                {pendingRequests.length} nova{pendingRequests.length > 1 ? "s" : ""}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Gerencie as solicitações de redefinição de senha da sua equipe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="h-4 w-4" />
                Pendentes
                {pendingRequests.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {pendingRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <AlertCircle className="h-4 w-4" />
                Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {pendingLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  {renderRequestsTable(pendingRequests, true)}
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="history">
              {allLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  {renderRequestsTable(allRequests.filter(r => r.status !== "pending"), false)}
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={!!dialogAction} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === "approve" ? "Aprovar" : "Rejeitar"} Solicitação
            </DialogTitle>
            <DialogDescription>
              {dialogAction === "approve" 
                ? "Ao aprovar, o usuário poderá redefinir sua senha."
                : "Informe o motivo da rejeição para o usuário."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="font-medium">{selectedRequest?.profiles?.display_name}</p>
              <p className="text-sm text-muted-foreground">{selectedRequest?.profiles?.email}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Observações (opcional)
              </label>
              <Textarea
                placeholder={dialogAction === "reject" 
                  ? "Informe o motivo da rejeição..." 
                  : "Adicione uma observação..."}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button
              variant={dialogAction === "approve" ? "default" : "destructive"}
              onClick={handleConfirm}
              disabled={approveMutation.isPending || rejectMutation.isPending}
            >
              {(approveMutation.isPending || rejectMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {dialogAction === "approve" ? "Aprovar" : "Rejeitar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
