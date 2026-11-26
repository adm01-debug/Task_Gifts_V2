import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, RefreshCw, Save, ShieldQuestion, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  useClearDemographicValue,
  useDemographicAttributes,
  useMyDemographicValues,
  useSaveDemographicValue,
} from "@/hooks/useDemographics";
import {
  ehPreferNotAnswer,
  ehTipoComOpcoes,
  lerOpcoes,
  PREFER_NOT_ANSWER,
  type DemographicAttribute,
  type DemographicValue,
} from "@/services/demographicsService";
import { logger } from "@/services/loggingService";

interface Rascunho {
  value: string;
  valuesArray: string[];
  numberValue: string;
  dateValue: string;
  preferNotAnswer: boolean;
}

const RASCUNHO_VAZIO: Rascunho = {
  value: "",
  valuesArray: [],
  numberValue: "",
  dateValue: "",
  preferNotAnswer: false,
};

const doValorSalvo = (valor: DemographicValue | undefined): Rascunho => {
  if (!valor) return { ...RASCUNHO_VAZIO };
  const preferNotAnswer = ehPreferNotAnswer(valor.values_array);
  return {
    value: valor.value ?? "",
    valuesArray:
      !preferNotAnswer && Array.isArray(valor.values_array)
        ? valor.values_array.filter((v): v is string => typeof v === "string")
        : [],
    numberValue: valor.number_value === null || valor.number_value === undefined ? "" : String(valor.number_value),
    dateValue: valor.date_value ?? "",
    preferNotAnswer,
  };
};

const igual = (a: Rascunho, b: Rascunho) =>
  a.value === b.value &&
  a.numberValue === b.numberValue &&
  a.dateValue === b.dateValue &&
  a.preferNotAnswer === b.preferNotAnswer &&
  a.valuesArray.slice().sort().join("|") === b.valuesArray.slice().sort().join("|");

const temResposta = (r: Rascunho) =>
  r.preferNotAnswer ||
  !!r.value.trim() ||
  !!r.numberValue.trim() ||
  !!r.dateValue.trim() ||
  r.valuesArray.length > 0;

const AtributoCampo = ({
  atributo,
  rascunho,
  onChange,
}: {
  atributo: DemographicAttribute;
  rascunho: Rascunho;
  onChange: (r: Rascunho) => void;
}) => {
  const opcoes = lerOpcoes(atributo.options);
  const desabilitado = rascunho.preferNotAnswer;

  switch (atributo.attribute_type) {
    case "number":
      return (
        <Input
          type="number"
          value={rascunho.numberValue}
          disabled={desabilitado}
          onChange={(e) => onChange({ ...rascunho, numberValue: e.target.value })}
          placeholder="Somente números"
          aria-label={atributo.name}
        />
      );
    case "date":
      return (
        <Input
          type="date"
          value={rascunho.dateValue}
          disabled={desabilitado}
          onChange={(e) => onChange({ ...rascunho, dateValue: e.target.value })}
          aria-label={atributo.name}
        />
      );
    case "single_select":
      return (
        <Select
          value={desabilitado ? "" : rascunho.value}
          onValueChange={(v) => onChange({ ...rascunho, value: v })}
          disabled={desabilitado}
        >
          <SelectTrigger aria-label={atributo.name}>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {opcoes.map((opcao) => (
              <SelectItem key={opcao} value={opcao}>
                {opcao}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "multi_select":
      return (
        <div className="flex flex-wrap gap-3">
          {opcoes.map((opcao) => (
            <label key={opcao} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={rascunho.valuesArray.includes(opcao)}
                disabled={desabilitado}
                onCheckedChange={(v) =>
                  onChange({
                    ...rascunho,
                    valuesArray: v
                      ? [...rascunho.valuesArray, opcao]
                      : rascunho.valuesArray.filter((o) => o !== opcao),
                  })
                }
              />
              {opcao}
            </label>
          ))}
        </div>
      );
    case "calculated":
      return (
        <p className="rounded-md border border-border/40 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Preenchido automaticamente pelo sistema — não editável aqui.
        </p>
      );
    default:
      return (
        <Input
          value={rascunho.value}
          disabled={desabilitado}
          onChange={(e) => onChange({ ...rascunho, value: e.target.value })}
          placeholder="Digite sua resposta"
          aria-label={atributo.name}
        />
      );
  }
};

/**
 * Dados demograficos do proprio colaborador. Cada resposta vive em uma linha de
 * `user_demographic_values`; o que nao for respondido nao gera linha.
 *
 * Os atributos `is_required` precisam de resposta (ou do "prefiro nao
 * responder", quando `allow_prefer_not_answer` esta ligado) para que o
 * formulario salve.
 */
export function MyDemographicValuesCard() {
  const { data: atributos = [], isLoading: carregandoAtributos, isError: erroAtributos, refetch: refetchAtributos } =
    useDemographicAttributes({ onlyActive: true });
  const { data: valores = [], isLoading: carregandoValores, isError: erroValores, refetch: refetchValores } =
    useMyDemographicValues();
  const salvar = useSaveDemographicValue();
  const limpar = useClearDemographicValue();

  const [rascunhos, setRascunhos] = useState<Record<string, Rascunho>>({});
  const [originais, setOriginais] = useState<Record<string, Rascunho>>({});

  const carregando = carregandoAtributos || carregandoValores;
  const erro = erroAtributos || erroValores;

  useEffect(() => {
    if (carregando) return;
    const porAtributo = new Map<string, DemographicValue>();
    valores.forEach((v) => porAtributo.set(v.attribute_id, v));
    const inicial: Record<string, Rascunho> = {};
    atributos.forEach((a) => {
      inicial[a.id] = doValorSalvo(porAtributo.get(a.id));
    });
    setRascunhos(inicial);
    setOriginais(inicial);
  }, [atributos, valores, carregando]);

  const editaveis = useMemo(
    () => atributos.filter((a) => a.attribute_type !== "calculated"),
    [atributos],
  );

  const alterados = useMemo(
    () => editaveis.filter((a) => rascunhos[a.id] && !igual(rascunhos[a.id], originais[a.id])),
    [editaveis, rascunhos, originais],
  );

  const salvarTudo = async () => {
    const faltando = editaveis.filter(
      (a) => a.is_required && !temResposta(rascunhos[a.id] ?? RASCUNHO_VAZIO),
    );
    if (faltando.length > 0) {
      toast.error(
        `Responda: ${faltando.map((a) => a.name).join(", ")}`,
      );
      return;
    }

    try {
      for (const atributo of alterados) {
        const r = rascunhos[atributo.id];
        if (!temResposta(r)) {
          await limpar.mutateAsync(atributo.id);
          continue;
        }
        await salvar.mutateAsync({
          attributeId: atributo.id,
          value: r.preferNotAnswer ? null : r.value.trim() || null,
          valuesArray: r.preferNotAnswer
            ? [PREFER_NOT_ANSWER]
            : atributo.attribute_type === "multi_select"
              ? r.valuesArray
              : [],
          numberValue:
            !r.preferNotAnswer && atributo.attribute_type === "number" && r.numberValue.trim()
              ? Number(r.numberValue)
              : null,
          dateValue:
            !r.preferNotAnswer && atributo.attribute_type === "date" && r.dateValue.trim()
              ? r.dateValue
              : null,
        });
      }
      setOriginais(rascunhos);
      toast.success(
        alterados.length === 1 ? "Resposta salva" : `${alterados.length} respostas salvas`,
      );
    } catch (err: unknown) {
      logger.error("Falha ao salvar dados demograficos", String(err));
      toast.error("Não foi possível salvar suas respostas");
    }
  };

  const limparAtributo = async (atributo: DemographicAttribute) => {
    try {
      await limpar.mutateAsync(atributo.id);
      const vazio = { ...RASCUNHO_VAZIO };
      setRascunhos((r) => ({ ...r, [atributo.id]: vazio }));
      setOriginais((o) => ({ ...o, [atributo.id]: vazio }));
      toast.success(`Resposta de "${atributo.name}" removida`);
    } catch (err: unknown) {
      logger.error("Falha ao limpar resposta demografica", String(err));
      toast.error("Não foi possível remover a resposta");
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldQuestion className="h-4 w-4 text-primary" aria-hidden />
          Perfil demográfico
        </CardTitle>
        <CardDescription>
          Informações usadas em relatórios de diversidade e nos filtros do sistema. Você controla o
          que responde e pode remover a resposta depois.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {carregando ? (
          <Skeleton className="h-10 w-full" />
        ) : erro ? (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" aria-hidden />
              <p className="text-xs text-muted-foreground">
                Não foi possível carregar seus dados demográficos. Nada foi alterado.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                refetchAtributos();
                refetchValores();
              }}
            >
              <RefreshCw className="mr-1 h-3 w-3" aria-hidden />
              Tentar de novo
            </Button>
          </div>
        ) : editaveis.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum atributo demográfico está ativo no momento.
          </p>
        ) : (
          <div className="space-y-4">
            {editaveis.map((atributo) => {
              const r = rascunhos[atributo.id] ?? RASCUNHO_VAZIO;
              const jaRespondeu = temResposta(originais[atributo.id] ?? RASCUNHO_VAZIO);
              return (
                <div key={atributo.id} className="space-y-2 rounded-lg border border-border/40 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Label className="text-sm font-medium">{atributo.name}</Label>
                      {atributo.is_required && <Badge variant="outline">Obrigatório</Badge>}
                    </div>
                    {jaRespondeu && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={limpar.isPending}
                        onClick={() => limparAtributo(atributo)}
                      >
                        <Trash2 className="mr-1 h-3 w-3" aria-hidden />
                        Remover resposta
                      </Button>
                    )}
                  </div>

                  <AtributoCampo
                    atributo={atributo}
                    rascunho={r}
                    onChange={(novo) => setRascunhos((atual) => ({ ...atual, [atributo.id]: novo }))}
                  />

                  {atributo.allow_prefer_not_answer && (
                    <div className="flex items-center justify-between gap-4 rounded-md border border-border/40 bg-muted/20 px-3 py-2">
                      <div>
                        <Label
                          htmlFor={`pref-${atributo.id}`}
                          className="text-xs font-medium"
                        >
                          Prefiro não responder
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Registra a recusa em vez de deixar em branco.
                        </p>
                      </div>
                      <Switch
                        id={`pref-${atributo.id}`}
                        checked={r.preferNotAnswer}
                        onCheckedChange={(v) =>
                          setRascunhos((atual) => ({
                            ...atual,
                            [atributo.id]: {
                              ...(atual[atributo.id] ?? RASCUNHO_VAZIO),
                              preferNotAnswer: v,
                            },
                          }))
                        }
                        aria-label={`Prefiro não responder — ${atributo.name}`}
                      />
                    </div>
                  )}

                  {ehTipoComOpcoes(atributo.attribute_type) && lerOpcoes(atributo.options).length === 0 && (
                    <p className="text-[11px] text-destructive">
                      Este atributo está sem opções cadastradas — avise um administrador.
                    </p>
                  )}
                </div>
              );
            })}

            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-muted-foreground">
                {alterados.length === 0
                  ? "Sem alterações para salvar"
                  : `${alterados.length} resposta(s) alterada(s)`}
              </span>
              <Button
                type="button"
                onClick={salvarTudo}
                disabled={alterados.length === 0 || salvar.isPending || limpar.isPending}
              >
                <Save className="mr-1 h-4 w-4" aria-hidden />
                Salvar respostas
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MyDemographicValuesCard;