import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { securityService, type BlockedIP } from "@/services/securityService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Ban, Globe, Trash2, Clock, ShieldOff, Search, Plus, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export function BlockedIPsPanel() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newIP, setNewIP] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newBlockType, setNewBlockType] = useState("manual");
  const [newDuration, setNewDuration] = useState("60");

  const { data: blockedIPs, isLoading } = useQuery({
    queryKey: ["blocked-ips"],
    queryFn: securityService.getBlockedIPs,
  });

  const unblockMutation = useMutation({
    mutationFn: securityService.unblockIP,
    onSuccess: () => {
      toast.success("IP desbloqueado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["blocked-ips"] });
      queryClient.invalidateQueries({ queryKey: ["security-stats"] });
    },
    onError: () => {
      toast.error("Erro ao desbloquear IP");
    },
  });

  const blockMutation = useMutation({
    mutationFn: async () => {
      const expiresAt = newDuration === "permanent" 
        ? null 
        : new Date(Date.now() + parseInt(newDuration) * 60 * 1000).toISOString();

      await securityService.blockIP({
        ip_address: newIP,
        reason: newReason,
        block_type: newBlockType,
        is_permanent: newDuration === "permanent",
        expires_at: expiresAt,
      });
    },
    onSuccess: () => {
      toast.success("IP bloqueado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["blocked-ips"] });
      queryClient.invalidateQueries({ queryKey: ["security-stats"] });
      setIsAddDialogOpen(false);
      setNewIP("");
      setNewReason("");
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("duplicate")) {
        toast.error("Este IP já está bloqueado");
      } else {
        toast.error("Erro ao bloquear IP");
      }
    },
  });

  const filteredIPs = blockedIPs?.filter(
    (ip) =>
      ip.ip_address.includes(search) ||
      ip.reason.toLowerCase().includes(search.toLowerCase())
  );

  const getBlockTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      rate_limit: "bg-orange-500/10 text-orange-500",
      manual: "bg-blue-500/10 text-blue-500",
      suspicious: "bg-purple-500/10 text-purple-500",
      brute_force: "bg-red-500/10 text-red-500",
    };
    return colors[type] || "bg-gray-500/10 text-gray-500";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-red-500" />
            IPs Bloqueados
          </CardTitle>
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar IP ou motivo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Bloquear IP
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bloquear IP Manualmente</DialogTitle>
                  <DialogDescription>
                    Adicione um IP à lista de bloqueio
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Endereço IP</Label>
                    <Input
                      placeholder="192.168.1.1"
                      value={newIP}
                      onChange={(e) => setNewIP(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Motivo</Label>
                    <Input
                      placeholder="Motivo do bloqueio"
                      value={newReason}
                      onChange={(e) => setNewReason(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Select value={newBlockType} onValueChange={setNewBlockType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="suspicious">Suspeito</SelectItem>
                        <SelectItem value="brute_force">Brute Force</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Duração</Label>
                    <Select value={newDuration} onValueChange={setNewDuration}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutos</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                        <SelectItem value="1440">24 horas</SelectItem>
                        <SelectItem value="10080">7 dias</SelectItem>
                        <SelectItem value="43200">30 dias</SelectItem>
                        <SelectItem value="permanent">Permanente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => blockMutation.mutate()}
                    disabled={blockMutation.isPending || !newIP || !newReason}
                  >
                    {blockMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Ban className="w-4 h-4 mr-2" />
                    )}
                    Bloquear IP
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredIPs?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShieldOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum IP bloqueado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Violações</TableHead>
                <TableHead>Bloqueado em</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead className="w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIPs?.map((ip) => (
                <TableRow key={ip.id}>
                  <TableCell className="font-mono flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    {ip.ip_address}
                    {ip.is_permanent && (
                      <Badge variant="destructive" className="text-xs">
                        Permanente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getBlockTypeBadge(ip.block_type)}>
                      {ip.block_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {ip.reason}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{ip.violation_count}x</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(ip.blocked_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-sm">
                    {ip.is_permanent ? (
                      <span className="text-red-500">Nunca</span>
                    ) : ip.expires_at ? (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(ip.expires_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => unblockMutation.mutate(ip.id)}
                      disabled={unblockMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
