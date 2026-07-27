import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useSalesCampaigns } from "@/hooks/useSalesCampaigns";
import { useDepartments } from "@/hooks/useDepartments";

interface CreateCampaignDialogProps {
  trigger?: React.ReactNode;
}

export function CreateCampaignDialog({ trigger }: CreateCampaignDialogProps) {
  const { create, isCreating } = useSalesCampaigns();
  const { data: departments = [] } = useDepartments();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    product_name: "",
    sku: "",
    metric_key: "sales_amount",
    metric_unit: "BRL",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 30 * 24 * 3600_000).toISOString().slice(0, 10),
    target_global: 100000,
    target_individual_default: 5000,
    xp_reward: 500,
    coin_reward: 100,
    status: "draft" as "draft" | "active",
    department_id: "all" as string,
    team_pool_xp: 0,
    team_pool_coins: 0,
    team_share: "proportional" as "proportional" | "equal",
  });

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    const { department_id, team_pool_xp, team_pool_coins, team_share, ...rest } = form;
    const usesTeamSplit = team_pool_xp > 0 || team_pool_coins > 0;
    create(
      {
        ...rest,
        department_id: department_id === "all" ? null : department_id,
        split_rule: usesTeamSplit
          ? { type: "team_split", team_pool_xp, team_pool_coins, team_share }
          : { type: "proportional" },
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Nova Campanha
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Campanha de Vendas</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Nome*</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Blitz Fevereiro — Upsell Premium"
            />
          </div>
          <div className="grid gap-2">
            <Label>Descrição</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mecânica, público-alvo, prêmios extras..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Produto</Label>
              <Input value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} placeholder="Ex: Kit Premium" />
            </div>
            <div className="grid gap-2">
              <Label>SKU</Label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Ex: SKU-12345" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Início*</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Fim*</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Métrica</Label>
              <Select value={form.metric_key} onValueChange={(v) => setForm({ ...form, metric_key: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales_amount">Valor de vendas (R$)</SelectItem>
                  <SelectItem value="units_sold">Unidades vendidas</SelectItem>
                  <SelectItem value="new_customers">Novos clientes</SelectItem>
                  <SelectItem value="upsell_count">Upsells realizados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Unidade</Label>
              <Input value={form.metric_unit} onChange={(e) => setForm({ ...form, metric_unit: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Meta Global</Label>
              <Input type="number" value={form.target_global} onChange={(e) => setForm({ ...form, target_global: Number(e.target.value) })} />
            </div>
            <div className="grid gap-2">
              <Label>Meta Individual Padrão</Label>
              <Input type="number" value={form.target_individual_default} onChange={(e) => setForm({ ...form, target_individual_default: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>XP ao bater meta</Label>
              <Input type="number" value={form.xp_reward} onChange={(e) => setForm({ ...form, xp_reward: Number(e.target.value) })} />
            </div>
            <div className="grid gap-2">
              <Label>Moedas ao bater meta</Label>
              <Input type="number" value={form.coin_reward} onChange={(e) => setForm({ ...form, coin_reward: Number(e.target.value) })} />
            </div>
          </div>
          <div className="rounded-lg border border-dashed p-3 space-y-3">
            <p className="text-sm font-semibold">Prêmio coletivo (meta por equipe)</p>
            <p className="text-xs text-muted-foreground">
              Preencha para habilitar o rateio <code>team_split</code>. O prêmio é dividido entre os
              membros da equipe que bater a meta coletiva.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>XP do pool da equipe</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.team_pool_xp}
                  onChange={(e) => setForm({ ...form, team_pool_xp: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Moedas do pool da equipe</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.team_pool_coins}
                  onChange={(e) => setForm({ ...form, team_pool_coins: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Forma de rateio</Label>
              <Select
                value={form.team_share}
                onValueChange={(v: "proportional" | "equal") => setForm({ ...form, team_share: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="proportional">Proporcional à contribuição</SelectItem>
                  <SelectItem value="equal">Igualitário entre os membros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Departamento / Segmento</Label>
              <Select
                value={form.department_id}
                onValueChange={(v) => setForm({ ...form, department_id: v })}
              >
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Restrinja quem pode participar. "Todos" libera a campanha para toda a organização.
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Status inicial</Label>
              <Select value={form.status} onValueChange={(v: "draft" | "active") => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="active">Ativa (já publicar)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isCreating || !form.name.trim()}>
            {isCreating ? "Criando..." : "Criar campanha"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}