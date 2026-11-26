import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  useCreateDemographicAttribute,
  useDeleteDemographicAttribute,
  useDemographicAttributes,
  useSetDemographicOrder,
  useUpdateDemographicAttribute,
} from "@/hooks/useDemographics";
import {
  ATTRIBUTE_TYPES,
  ehTipoComOpcoes,
  lerOpcoes,
  rotuloTipo,
  type DemographicAttribute,
  type DemographicAttributeType,
} from "@/services/demographicsService";
import { logger } from "@/services/loggingService";

interface FormState {
  name: string;
  name_en: string;
  name_es: string;
  attribute_type: DemographicAttributeType;
  options: string[];
  is_required: boolean;
  is_visible_in_reports: boolean;
  is_restricted: boolean;
  allow_prefer_not_answer: boolean;
  order_index: number;
  is_active: boolean;
}

const FORM_VAZIO: FormState = {
  name: "",
  name_en: "",
  name_es: "",
  attribute_type: "single_select",
  options: [],
  is_required: false,
  is_visible_in_reports: true,
  is_restricted: false,
  allow_prefer_not_answer: true,
  order_index: 0,
  is_active: true,
};

const paraForm = (atributo: DemographicAttribute): FormState => ({
  name: atributo.name,
  name_en: atributo.name_en ?? "",
  name_es: atributo.name_es ?? "",
  attribute_type: atributo.attribute_type as DemographicAttributeType,
  options: lerOpcoes(atributo.options),
  is_required: atributo.is_required,
  is_visible_in_reports: atributo.is_visible_in_reports,
  is_restricted: atributo.is_restricted,
  allow_prefer_not_answer: atributo.allow_prefer_not_answer,
  order_index: atributo.order_index,
  is_active: atributo.is_active,
});

/**
 * Cadastro dos atributos demograficos (`demographic_attributes`). Substitui o
 * SQL manual no Dashboard: sem esta tela, criar um perfil demografico exigia
 * INSERT direto no banco.
 *
 * `order_index` define a ordem em que o colaborador responde no perfil; as
 * setas trocam a posicao com o vizinho.
 */
export function DemographicAttributesManager({ podeEditar }: { podeEditar: boolean }) {
  const { data: atributos = [], isLoading, isError, refetch } = useDemographicAttributes();
  const create = useCreateDemographicAttribute();
  const update = useUpdateDemographicAttribute();
  const remove = useDeleteDemographicAttribute();
  const setOrder = useSetDemographicOrder();

  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<DemographicAttribute | null>(null);
  const [form, setForm] = useState<FormState>(FORM_VAZIO);
  const [excluindo, setExcluindo] = useState<DemographicAttribute | null>(null);

  const proximaOrdem = useMemo(
    () => atributos.reduce((maior, a) => Math.max(maior, a.order_index), -1) + 1,
    [atributos],
  );

  const abrirNovo = () => {
    setEditando(null);
    setForm({ ...FORM_VAZIO, order_index: proximaOrdem });
    setFormOpen(true);
  };

  const abrirEdicao = (atributo: DemographicAttribute) => {
    setEditando(atributo);
    setForm(paraForm(atributo));
    setFormOpen(true);
  };

  const salvar = async () => {
    const nome = form.name.trim();
    if (!nome) {
      toast.error("Dê um nome ao atributo");
      return;
    }
    const opcoes = form.options.map((o) => o.trim()).filter(Boolean);
    if (ehTipoComOpcoes(form.attribute_type) && opcoes.length === 0) {
      toast.error("Escolha única e múltipla escolha precisam de pelo menos uma opção");
      return;
    }
    if (new Set(opcoes).size !== opcoes.length) {
      toast.error("Há opções repetidas na lista");
      return;
    }

    const payload = {
      name: nome,
      name_en: form.name_en.trim() || null,
      name_es: form.name_es.trim() || null,
      attribute_type: form.attribute_type,
      options: ehTipoComOpcoes(form.attribute_type) ? opcoes : [],
      is_required: form.is_required,
      is_visible_in_reports: form.is_visible_in_reports,
      is_restricted: form.is_restricted,
      allow_prefer_not_answer: form.allow_prefer_not_answer,
      order_index: form.order_index,
      is_active: form.is_active,
    };

    try {
      if (editando) {
        await update.mutateAsync({ id: editando.id, updates: payload });
        toast.success(`Atributo "${nome}" atualizado`);
      } else {
        await create.mutateAsync(payload);
        toast.success(`Atributo "${nome}" criado`);
      }
      setFormOpen(false);
      setEditando(null);
    } catch (err: unknown) {
      logger.error("Falha ao salvar atributo demografico", String(err));
      toast.error(
        String(err).includes("duplicate")
          ? "Já existe um atributo com esse nome"
          : "Não foi possível salvar o atributo",
      );
    }
  };

  const alternarAtivo = async (atributo: DemographicAttribute) => {
    try {
      await update.mutateAsync({
        id: atributo.id,
        updates: { is_active: !atributo.is_active },
      });
      toast.success(
        atributo.is_active
          ? `"${atributo.name}" saiu do perfil dos colaboradores`
          : `"${atributo.name}" voltou ao perfil dos colaboradores`,
      );
    } catch (err: unknown) {
      logger.error("Falha ao alternar atributo", String(err));
      toast.error("Não foi possível alterar o atributo");
    }
  };

  /**
   * Move o atributo uma posicao. A ordem exibida e' (order_index, name), entao
   * trocar apenas os numeros deixaria dois atributos empatados parados — o que
   * a edicao permite acontecer. Aqui a lista exibida e' reindexada e so' as
   * linhas cuja posicao mudou sao gravadas, com indices distintos.
   */
  const mover = async (atributo: DemographicAttribute, direcao: -1 | 1) => {
    const ordenados = [...atributos].sort(
      (a, b) => a.order_index - b.order_index || a.name.localeCompare(b.name),
    );
    const posicao = ordenados.findIndex((a) => a.id === atributo.id);
    const destino = posicao + direcao;
    if (posicao < 0 || destino < 0 || destino >= ordenados.length) return;

    const reordenados = [...ordenados];
    [reordenados[posicao], reordenados[destino]] = [
      reordenados[destino],
      reordenados[posicao],
    ];

    const mudancas = reordenados
      .map((a, indice) => ({ id: a.id, orderIndex: indice }))
      .filter(({ id, orderIndex }) => {
        const atual = ordenados.findIndex((a) => a.id === id);
        return atual !== orderIndex;
      });

    try {
      for (const mudanca of mudancas) {
        await setOrder.mutateAsync(mudanca);
      }
    } catch (err: unknown) {
      logger.error("Falha ao reordenar atributo", String(err));
      toast.error("Não foi possível reordenar");
    }
  };

  const excluir = async () => {
    if (!excluindo) return;
    const alvo = excluindo;
    try {
      await remove.mutateAsync(alvo.id);
      setExcluindo(null);
      toast.success(`Atributo "${alvo.name}" excluído`);
    } catch (err: unknown) {
      logger.error("Falha ao excluir atributo", String(err));
      toast.error("Não foi possível excluir o atributo");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
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
            Não foi possível carregar os atributos demográficos.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-1 h-3 w-3" aria-hidden />
          Tentar de novo
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-muted-foreground">
            {atributos.length} atributo(s). Os ativos aparecem no perfil do colaborador, na ordem abaixo.
          </p>
        </div>
        {podeEditar && (
          <Button type="button" size="sm" onClick={abrirNovo}>
            <Plus className="mr-1 h-4 w-4" aria-hidden />
            Novo atributo
          </Button>
        )}
      </div>

      {!podeEditar && (
        <div className="flex items-start gap-2 rounded-lg border border-border/50 bg-muted/40 p-3">
          <Lock className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden />
          <p className="text-xs text-muted-foreground">
            Apenas administradores criam, editam, reordenam e excluem atributos. Você pode consultar.
          </p>
        </div>
      )}

      {atributos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <p className="text-sm font-medium">Nenhum atributo demográfico cadastrado</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Sem atributos, nada aparece no perfil do colaborador e a aba de valores fica vazia.
            </p>
            {podeEditar && (
              <Button type="button" className="mt-4" size="sm" onClick={abrirNovo}>
                <Plus className="mr-1 h-4 w-4" aria-hidden />
                Criar o primeiro
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {atributos.map((atributo, indice) => (
            <Card key={atributo.id} className="border-border/50">
              <CardContent className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{atributo.name}</span>
                    <Badge variant="secondary">{rotuloTipo(atributo.attribute_type)}</Badge>
                    {!atributo.is_active && <Badge variant="outline">Inativo</Badge>}
                    {atributo.is_required && <Badge variant="outline">Obrigatório</Badge>}
                    {!atributo.is_visible_in_reports && <Badge variant="outline">Fora dos relatórios</Badge>}
                    {atributo.is_restricted && (
                      <Badge variant="outline" className="border-amber-500/50 text-amber-600">
                        Restrito
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {ehTipoComOpcoes(atributo.attribute_type)
                      ? `Opções: ${lerOpcoes(atributo.options).join(" · ") || "nenhuma"}`
                      : ATTRIBUTE_TYPES.find((t) => t.value === atributo.attribute_type)?.hint}
                  </p>
                </div>

                {podeEditar && (
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={indice === 0}
                      onClick={() => mover(atributo, -1)}
                      aria-label={`Mover ${atributo.name} para cima`}
                    >
                      <ArrowUp className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={indice === atributos.length - 1}
                      onClick={() => mover(atributo, 1)}
                      aria-label={`Mover ${atributo.name} para baixo`}
                    >
                      <ArrowDown className="h-4 w-4" aria-hidden />
                    </Button>
                    <Switch
                      checked={atributo.is_active}
                      onCheckedChange={() => alternarAtivo(atributo)}
                      aria-label={`Ativar ou desativar ${atributo.name}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => abrirEdicao(atributo)}
                      aria-label={`Editar ${atributo.name}`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setExcluindo(atributo)}
                      aria-label={`Excluir ${atributo.name}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" aria-hidden />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar atributo" : "Novo atributo demográfico"}</DialogTitle>
            <DialogDescription>
              O que for cadastrado aqui vira uma pergunta no perfil do colaborador.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="attr-name">Nome (pt-BR)</Label>
                <Input
                  id="attr-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex.: Estado civil"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="attr-name-en">Nome (inglês)</Label>
                <Input
                  id="attr-name-en"
                  value={form.name_en}
                  onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="attr-name-es">Nome (espanhol)</Label>
                <Input
                  id="attr-name-es"
                  value={form.name_es}
                  onChange={(e) => setForm((f) => ({ ...f, name_es: e.target.value }))}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="attr-type">Tipo de resposta</Label>
                <Select
                  value={form.attribute_type}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, attribute_type: v as DemographicAttributeType }))
                  }
                >
                  <SelectTrigger id="attr-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ATTRIBUTE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  {ATTRIBUTE_TYPES.find((t) => t.value === form.attribute_type)?.hint}
                </p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="attr-order">Ordem no perfil</Label>
                <Input
                  id="attr-order"
                  type="number"
                  value={form.order_index}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, order_index: Number(e.target.value) || 0 }))
                  }
                />
                <p className="text-[11px] text-muted-foreground">
                  Menor número aparece antes. Empate desempata pelo nome.
                </p>
              </div>
            </div>

            {ehTipoComOpcoes(form.attribute_type) && (
              <div className="space-y-2">
                <Label>Opções de resposta</Label>
                {form.options.length === 0 && (
                  <p className="text-xs text-muted-foreground">Nenhuma opção ainda.</p>
                )}
                {form.options.map((opcao, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={opcao}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          options: f.options.map((o, j) => (j === i ? e.target.value : o)),
                        }))
                      }
                      placeholder={`Opção ${i + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setForm((f) => ({ ...f, options: f.options.filter((_, j) => j !== i) }))
                      }
                      aria-label={`Remover opção ${i + 1}`}
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForm((f) => ({ ...f, options: [...f.options, ""] }))}
                >
                  <Plus className="mr-1 h-3 w-3" aria-hidden />
                  Adicionar opção
                </Button>
              </div>
            )}

            <div className="grid gap-2 md:grid-cols-2">
              {(
                [
                  ["is_active", "Ativo", "Fora do ar, o colaborador não vê nem responde."],
                  ["is_required", "Resposta obrigatória", "O colaborador não consegue salvar sem responder."],
                  ["is_visible_in_reports", "Visível em relatórios", "Desligado, o valor só aparece no painel de uso interno."],
                  ["is_restricted", "Restrito", "Desligado dos relatórios: só administradores veem os valores."],
                  ["allow_prefer_not_answer", "Permitir “prefiro não responder”", "O colaborador pode recusar a resposta."],
                ] as Array<[keyof FormState, string, string]>
              ).map(([campo, titulo, ajuda]) => (
                <div
                  key={String(campo)}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border/40 p-3"
                >
                  <div>
                    <Label htmlFor={`attr-${String(campo)}`} className="text-sm font-medium">
                      {titulo}
                    </Label>
                    <p className="text-[11px] text-muted-foreground">{ajuda}</p>
                  </div>
                  <Switch
                    id={`attr-${String(campo)}`}
                    checked={Boolean(form[campo])}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, [campo]: v }))}
                    aria-label={titulo}
                  />
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={salvar} disabled={create.isPending || update.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!excluindo} onOpenChange={(v) => !v && setExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{excluindo?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              As respostas já dadas pelos colaboradores para este atributo são apagadas junto — o
              banco remove em cascata e não há como recuperar. Para parar de perguntar sem perder o
              histórico, desative o atributo no botão “Ativo”.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={excluir}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default DemographicAttributesManager;