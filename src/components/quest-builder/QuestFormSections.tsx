import { AnimatePresence, motion } from "framer-motion";
import { Target, Users, Clock, Tag, X, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { IconPicker } from "@/components/quest-builder/IconPicker";
import { QuestStepEditor } from "@/components/quest-builder/QuestStepEditor";

interface QuestStep {
  id: string;
  title: string;
  description: string;
  xpReward: number;
}

interface BasicInfoSectionProps {
  icon: string;
  setIcon: (v: string) => void;
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  difficulty: string;
  setDifficulty: (v: string) => void;
  xpReward: number;
  setXpReward: (v: number) => void;
  coinReward: number;
  setCoinReward: (v: number) => void;
}

export function BasicInfoSection({
  icon, setIcon, title, setTitle, description, setDescription,
  difficulty, setDifficulty, xpReward, setXpReward, coinReward, setCoinReward,
}: BasicInfoSectionProps) {
  return (
    <section className="space-y-6 rounded-xl border border-border/50 bg-card p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Target className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Informações Básicas</h2>
      </div>
      <div className="flex gap-4">
        <div>
          <Label className="mb-2 block text-sm">Ícone</Label>
          <IconPicker value={icon} onChange={setIcon} />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <Label htmlFor="title">Título da Quest *</Label>
            <Input id="title" placeholder="Ex: Onboarding de Novos Colaboradores" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
          </div>
        </div>
      </div>
      <div>
        <Label htmlFor="description">Descrição *</Label>
        <Textarea id="description" placeholder="Descreva os objetivos..." value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 min-h-[100px]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="difficulty">Dificuldade</Label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger id="difficulty" className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">🟢 Fácil</SelectItem>
              <SelectItem value="medium">🟡 Médio</SelectItem>
              <SelectItem value="hard">🟠 Difícil</SelectItem>
              <SelectItem value="expert">🔴 Expert</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="xp">XP (Conclusão)</Label>
          <Input id="xp" type="number" min={0} value={xpReward} onChange={(e) => setXpReward(parseInt(e.target.value) || 0)} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="coins">Coins (Conclusão)</Label>
          <Input id="coins" type="number" min={0} value={coinReward} onChange={(e) => setCoinReward(parseInt(e.target.value) || 0)} className="mt-1" />
        </div>
      </div>
    </section>
  );
}

interface AdvancedSectionProps {
  hasDeadline: boolean;
  setHasDeadline: (v: boolean) => void;
  deadlineDays: number | null;
  setDeadlineDays: (v: number | null) => void;
  hasMaxParticipants: boolean;
  setHasMaxParticipants: (v: boolean) => void;
  maxParticipants: number | null;
  setMaxParticipants: (v: number | null) => void;
  tags: string[];
  tagInput: string;
  setTagInput: (v: string) => void;
  addTag: () => void;
  removeTag: (tag: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

export function AdvancedSection({
  hasDeadline, setHasDeadline, deadlineDays, setDeadlineDays,
  hasMaxParticipants, setHasMaxParticipants, maxParticipants, setMaxParticipants,
  tags, tagInput, setTagInput, addTag, removeTag, handleKeyDown,
}: AdvancedSectionProps) {
  return (
    <section className="space-y-6 rounded-xl border border-border/50 bg-card p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
          <Users className="h-5 w-5 text-accent" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Configurações Avançadas</h2>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">Prazo para conclusão</p>
              <p className="text-sm text-muted-foreground">Definir tempo limite para completar</p>
            </div>
          </div>
          <Switch checked={hasDeadline} onCheckedChange={setHasDeadline} />
        </div>
        <AnimatePresence>
          {hasDeadline && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="flex items-center gap-2 pl-12">
                <Input type="number" min={1} value={deadlineDays || ""} onChange={(e) => setDeadlineDays(parseInt(e.target.value) || null)} placeholder="7" className="w-24" />
                <span className="text-sm text-muted-foreground">dias para completar</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">Limite de participantes</p>
              <p className="text-sm text-muted-foreground">Restringir número de vagas</p>
            </div>
          </div>
          <Switch checked={hasMaxParticipants} onCheckedChange={setHasMaxParticipants} />
        </div>
        <AnimatePresence>
          {hasMaxParticipants && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="flex items-center gap-2 pl-12">
                <Input type="number" min={1} value={maxParticipants || ""} onChange={(e) => setMaxParticipants(parseInt(e.target.value) || null)} placeholder="20" className="w-24" />
                <span className="text-sm text-muted-foreground">participantes máximos</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <Label>Tags</Label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <motion.div key={tag} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <Badge variant="secondary" className="gap-1 pr-1">
                #{tag}
                <button type="button" onClick={() => removeTag(tag)} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </motion.div>
          ))}
          <Input placeholder="Adicionar tag..." value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleKeyDown} onBlur={addTag} className="w-32 flex-shrink-0" />
        </div>
      </div>
    </section>
  );
}

interface StepsSectionProps {
  steps: QuestStep[];
  onStepsChange: (steps: QuestStep[]) => void;
  totalXP: number;
}

export function StepsSection({ steps, onStepsChange, totalXP }: StepsSectionProps) {
  return (
    <section className="space-y-6 rounded-xl border border-border/50 bg-card p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
            <Sparkles className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Etapas da Trilha</h2>
            <p className="text-sm text-muted-foreground">Total: {totalXP} XP</p>
          </div>
        </div>
      </div>
      <QuestStepEditor steps={steps} onStepsChange={onStepsChange} />
    </section>
  );
}
