import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, AlertTriangle, Clock, RotateCcw, XCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { usePenaltyRules, useUpdatePenaltyRule, useCreatePenaltyRule, useTaskPenalties } from "@/hooks/usePositions";
import { PenaltyRule } from "@/services/positionsService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const PenaltyRulesManager = () => {
  const { data: rules = [], isLoading } = usePenaltyRules();
  const { data: recentPenalties = [] } = useTaskPenalties();
  const updateRule = useUpdatePenaltyRule();
  const createRule = useCreatePenaltyRule();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PenaltyRule | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    penalty_type: "late",
    trigger_condition: "",
    xp_penalty_percent: 50,
    xp_penalty_fixed: 0,
    coin_penalty_percent: 0,
    coin_penalty_fixed: 0,
    is_escalating: false,
    escalation_multiplier: 1.5,
    is_active: true
  });

  const penaltyTypeIcons: Record<string, React.ReactNode> = {
    late: <Clock className="h-4 w-4 text-yellow-500" />,
    rework: <RotateCcw className="h-4 w-4 text-orange-500" />,
    incomplete: <XCircle className="h-4 w-4 text-red-500" />,
    quality: <AlertTriangle className="h-4 w-4 text-purple-500" />
  };

  const penaltyTypeLabels: Record<string, string> = {
    late: "Atraso",
    rework: "Retrabalho",
    incomplete: "Incompleto",
    quality: "Qualidade"
  };

  const handleSave = async () => {
    if (!form.name || !form.trigger_condition) return;
    
    if (editingRule) {
      await updateRule.mutateAsync({ id: editingRule.id, updates: form });
    } else {
      await createRule.mutateAsync(form);
    }
    
    setIsDialogOpen(false);
    setEditingRule(null);
    resetForm();
  };

  const openEditDialog = (rule: PenaltyRule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name,
      description: rule.description || "",
      penalty_type: rule.penalty_type,
      trigger_condition: rule.trigger_condition,
      xp_penalty_percent: rule.xp_penalty_percent || 0,
      xp_penalty_fixed: rule.xp_penalty_fixed || 0,
      coin_penalty_percent: rule.coin_penalty_percent || 0,
      coin_penalty_fixed: rule.coin_penalty_fixed || 0,
      is_escalating: rule.is_escalating,
      escalation_multiplier: rule.escalation_multiplier || 1.5,
      is_active: rule.is_active
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      penalty_type: "late",
      trigger_condition: "",
      xp_penalty_percent: 50,
      xp_penalty_fixed: 0,
      coin_penalty_percent: 0,
      coin_penalty_fixed: 0,
      is_escalating: false,
      escalation_multiplier: 1.5,
      is_active: true
    });
  };

  const toggleRuleActive = async (rule: PenaltyRule) => {
    await updateRule.mutateAsync({ 
      id: rule.id, 
      updates: { is_active: !rule.is_active } 
    });
  };

  // Agrupar regras por tipo
  const groupedRules = rules.reduce((acc, rule) => {
    const type = rule.penalty_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(rule);
    return acc;
  }, {} as Record<string, PenaltyRule[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-destructive/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <CardTitle>Regras de Penalidade</CardTitle>
                <CardDescription>
                  Configure as regras automáticas de penalização por atraso, retrabalho e qualidade
                </CardDescription>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingRule(null); resetForm(); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Regra
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingRule ? "Editar Regra" : "Nova Regra de Penalidade"}</DialogTitle>
                  <DialogDescription>
                    Configure quando e quanto será penalizado automaticamente
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Nome da Regra *</Label>
                    <Input 
                      value={form.name} 
                      onChange={(e) => setForm({ ...form, name: e.target.value })} 
                      placeholder="Ex: Atraso Leve (até 24h)"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Descrição</Label>
                    <Textarea 
                      value={form.description} 
                      onChange={(e) => setForm({ ...form, description: e.target.value })} 
                      placeholder="Quando essa regra se aplica..."
                    />
                  </div>
                  <div>
                    <Label>Tipo de Penalidade</Label>
                    <Select value={form.penalty_type} onValueChange={(v) => setForm({ ...form, penalty_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="late">Atraso</SelectItem>
                        <SelectItem value="rework">Retrabalho</SelectItem>
                        <SelectItem value="incomplete">Incompleto</SelectItem>
                        <SelectItem value="quality">Qualidade</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Condição de Disparo *</Label>
                    <Input 
                      value={form.trigger_condition} 
                      onChange={(e) => setForm({ ...form, trigger_condition: e.target.value })} 
                      placeholder="Ex: late_hours > 24"
                    />
                  </div>
                  <div>
                    <Label>Penalidade XP (%)</Label>
                    <Input 
                      type="number" 
                      value={form.xp_penalty_percent} 
                      onChange={(e) => setForm({ ...form, xp_penalty_percent: parseInt(e.target.value) || 0 })} 
                    />
                  </div>
                  <div>
                    <Label>Penalidade XP (fixo)</Label>
                    <Input 
                      type="number" 
                      value={form.xp_penalty_fixed} 
                      onChange={(e) => setForm({ ...form, xp_penalty_fixed: parseInt(e.target.value) || 0 })} 
                    />
                  </div>
                  <div>
                    <Label>Penalidade Moedas (%)</Label>
                    <Input 
                      type="number" 
                      value={form.coin_penalty_percent} 
                      onChange={(e) => setForm({ ...form, coin_penalty_percent: parseInt(e.target.value) || 0 })} 
                    />
                  </div>
                  <div>
                    <Label>Penalidade Moedas (fixo)</Label>
                    <Input 
                      type="number" 
                      value={form.coin_penalty_fixed} 
                      onChange={(e) => setForm({ ...form, coin_penalty_fixed: parseInt(e.target.value) || 0 })} 
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={form.is_escalating} 
                      onCheckedChange={(c) => setForm({ ...form, is_escalating: c })} 
                    />
                    <Label>Escalonamento (aumenta com reincidência)</Label>
                  </div>
                  {form.is_escalating && (
                    <div>
                      <Label>Multiplicador</Label>
                      <Input 
                        type="number" 
                        step="0.1"
                        value={form.escalation_multiplier} 
                        onChange={(e) => setForm({ ...form, escalation_multiplier: parseFloat(e.target.value) || 1.5 })} 
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={form.is_active} 
                      onCheckedChange={(c) => setForm({ ...form, is_active: c })} 
                    />
                    <Label>Regra ativa</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleSave} disabled={updateRule.isPending || createRule.isPending}>
                    {editingRule ? "Salvar" : "Criar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Regras por Tipo */}
      <div className="grid gap-6 md:grid-cols-2">
        {Object.entries(groupedRules).map(([type, typeRules]) => (
          <Card key={type}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                {penaltyTypeIcons[type]}
                {penaltyTypeLabels[type] || type}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {typeRules.map((rule, index) => (
                  <motion.div
                    key={rule.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      rule.is_active ? "bg-muted/50" : "bg-muted/20 opacity-60"
                    }`}
                  >
                    <div>
                      <p className="font-medium text-sm">{rule.name}</p>
                      <p className="text-xs text-muted-foreground">
                        -{rule.xp_penalty_percent}% XP
                        {rule.is_escalating && " (escalonável)"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={rule.is_active} 
                        onCheckedChange={() => toggleRuleActive(rule)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(rule)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Penalidades Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Penalidades Recentes</CardTitle>
          <CardDescription>Últimas penalidades aplicadas no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>XP Deduzido</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPenalties.slice(0, 20).map((penalty) => (
                  <TableRow key={penalty.id}>
                    <TableCell className="text-sm">
                      {format(new Date(penalty.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        {penaltyTypeIcons[penalty.penalty_type]}
                        {penaltyTypeLabels[penalty.penalty_type] || penalty.penalty_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-red-400 font-medium">
                      -{penalty.xp_deducted} XP
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {penalty.reason || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
