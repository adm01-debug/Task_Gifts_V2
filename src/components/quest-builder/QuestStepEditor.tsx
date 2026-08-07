import { motion, Reorder } from "framer-motion";
import { GripVertical, Plus, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface QuestStep {
  id: string;
  title: string;
  description: string;
  xpReward: number;
}

interface QuestStepEditorProps {
  steps: QuestStep[];
  onStepsChange: (steps: QuestStep[]) => void;
}

export function QuestStepEditor({ steps, onStepsChange }: QuestStepEditorProps) {
  const addStep = () => {
    const newStep: QuestStep = {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      xpReward: 25,
    };
    onStepsChange([...steps, newStep]);
  };

  const updateStep = (id: string, field: keyof QuestStep, value: string | number) => {
    onStepsChange(
      steps.map((step) =>
        step.id === id ? { ...step, [field]: value } : step
      )
    );
  };

  const removeStep = (id: string) => {
    onStepsChange(steps.filter((step) => step.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Etapas da Trilha</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addStep}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Etapa
        </Button>
      </div>

      {steps.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 p-8"
        >
          <div className="mb-4 rounded-full bg-primary/10 p-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <p className="mb-2 text-center font-medium text-foreground">
            Nenhuma etapa adicionada
          </p>
          <p className="mb-4 text-center text-sm text-muted-foreground">
            Crie etapas para guiar os colaboradores pela trilha de aprendizado
          </p>
          <Button type="button" variant="default" onClick={addStep} className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Primeira Etapa
          </Button>
        </motion.div>
      ) : (
        <Reorder.Group
          axis="y"
          values={steps}
          onReorder={onStepsChange}
          className="space-y-3"
        >
          {steps.map((step, index) => (
            <Reorder.Item key={step.id} value={step}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="group relative rounded-lg border border-border/50 bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  {/* Drag handle */}
                  <div className="flex cursor-grab items-center pt-2 text-muted-foreground transition-colors hover:text-foreground active:cursor-grabbing">
                    <GripVertical className="h-5 w-5" />
                  </div>

                  {/* Step number */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Input
                          placeholder="Título da etapa"
                          value={step.title}
                          onChange={(e) => updateStep(step.id, "title", e.target.value)}
                          className="border-muted-foreground/20"
                        />
                      </div>
                      <div className="w-28">
                        <div className="relative">
                          <Input
                            type="number"
                            min={0}
                            value={step.xpReward}
                            onChange={(e) =>
                              updateStep(step.id, "xpReward", parseInt(e.target.value) || 0)
                            }
                            className="border-muted-foreground/20 pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            XP
                          </span>
                        </div>
                      </div>
                    </div>

                    <Textarea
                      placeholder="Descrição detalhada da etapa (opcional)"
                      value={step.description}
                      onChange={(e) => updateStep(step.id, "description", e.target.value)}
                      className="min-h-[60px] resize-none border-muted-foreground/20"
                    />
                  </div>

                  {/* Delete button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStep(step.id)}
                    className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    aria-label="Remover etapa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      {steps.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addStep}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            Adicionar mais uma etapa
          </Button>
        </motion.div>
      )}
    </div>
  );
}
