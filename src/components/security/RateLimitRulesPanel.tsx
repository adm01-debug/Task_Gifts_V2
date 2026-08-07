import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { securityService, type RateLimitRule } from "@/services/securityService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { 
  Shield, Plus, Pencil, Trash2, Loader2, Save
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";


export function RateLimitRulesPanel() {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RateLimitRule | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    endpoint_pattern: "",
    requests_per_minute: 60,
    requests_per_hour: 1000,
    block_duration_minutes: 15,
    applies_to_authenticated: true,
    applies_to_anonymous: true,
  });

  const { data: rules, isLoading } = useQuery({
    queryKey: ["rate-limit-rules"],
    queryFn: securityService.getRateLimitRules,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => 
      securityService.toggleRateLimitRule(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rate-limit-rules"] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<RateLimitRule>) => securityService.saveRateLimitRule(data),
    onSuccess: () => {
      toast.success(editingRule ? "Regra atualizada" : "Regra criada");
      queryClient.invalidateQueries({ queryKey: ["rate-limit-rules"] });
      setIsAddDialogOpen(false);
      setEditingRule(null);
      resetForm();
    },
    onError: () => {
      toast.error("Erro ao salvar regra");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: securityService.deleteRateLimitRule,
    onSuccess: () => {
      toast.success("Regra excluída");
      queryClient.invalidateQueries({ queryKey: ["rate-limit-rules"] });
    },
    onError: () => {
      toast.error("Erro ao excluir regra");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      endpoint_pattern: "",
      requests_per_minute: 60,
      requests_per_hour: 1000,
      block_duration_minutes: 15,
      applies_to_authenticated: true,
      applies_to_anonymous: true,
    });
  };

  const openEditDialog = (rule: RateLimitRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      endpoint_pattern: rule.endpoint_pattern,
      requests_per_minute: rule.requests_per_minute,
      requests_per_hour: rule.requests_per_hour,
      block_duration_minutes: rule.block_duration_minutes,
      applies_to_authenticated: rule.applies_to_authenticated,
      applies_to_anonymous: rule.applies_to_anonymous,
    });
    setIsAddDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Regras de Rate Limiting
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) {
              setEditingRule(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Regra
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingRule ? "Editar Regra" : "Nova Regra"}</DialogTitle>
                <DialogDescription>
                  Configure os limites de requisições
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Nome</Label>
                  <Input
                    placeholder="Ex: API Geral"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Padrão do Endpoint</Label>
                  <Input
                    placeholder="Ex: /api/*"
                    value={formData.endpoint_pattern}
                    onChange={(e) => setFormData({ ...formData, endpoint_pattern: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Requisições/min</Label>
                    <Input
                      type="number"
                      value={formData.requests_per_minute}
                      onChange={(e) => setFormData({ ...formData, requests_per_minute: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Requisições/hora</Label>
                    <Input
                      type="number"
                      value={formData.requests_per_hour}
                      onChange={(e) => setFormData({ ...formData, requests_per_hour: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Duração do bloqueio (min)</Label>
                  <Input
                    type="number"
                    value={formData.block_duration_minutes}
                    onChange={(e) => setFormData({ ...formData, block_duration_minutes: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Aplicar a autenticados</Label>
                  <Switch
                    checked={formData.applies_to_authenticated}
                    onCheckedChange={(checked) => setFormData({ ...formData, applies_to_authenticated: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Aplicar a anônimos</Label>
                  <Switch
                    checked={formData.applies_to_anonymous}
                    onCheckedChange={(checked) => setFormData({ ...formData, applies_to_anonymous: checked })}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => saveMutation.mutate(editingRule ? { ...formData, id: editingRule.id } : formData)}
                  disabled={saveMutation.isPending || !formData.name || !formData.endpoint_pattern}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ativo</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Limites</TableHead>
                <TableHead>Bloqueio</TableHead>
                <TableHead>Aplica a</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules?.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: rule.id, is_active: checked })}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded text-sm">{rule.endpoint_pattern}</code>
                  </TableCell>
                  <TableCell className="text-sm">
                    {rule.requests_per_minute}/min, {rule.requests_per_hour}/hora
                  </TableCell>
                  <TableCell>{rule.block_duration_minutes} min</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {rule.applies_to_authenticated && <Badge variant="outline">Auth</Badge>}
                      {rule.applies_to_anonymous && <Badge variant="secondary">Anon</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(rule)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(rule.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
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
