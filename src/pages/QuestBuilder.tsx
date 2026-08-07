import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Save, Eye, EyeOff, Sparkles, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { QuestPreview } from "@/components/quest-builder/QuestPreview";
import { PageShell } from "@/components/navigation";
import { logger } from "@/services/loggingService";
import { BasicInfoSection, AdvancedSection, StepsSection } from "@/components/quest-builder/QuestFormSections";

interface QuestStep {
  id: string;
  title: string;
  description: string;
  xpReward: number;
}

export default function QuestBuilder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📚");
  const [difficulty, setDifficulty] = useState("medium");
  const [xpReward, setXpReward] = useState(100);
  const [coinReward, setCoinReward] = useState(50);
  const [deadlineDays, setDeadlineDays] = useState<number | null>(null);
  const [maxParticipants, setMaxParticipants] = useState<number | null>(null);
  const [hasDeadline, setHasDeadline] = useState(false);
  const [hasMaxParticipants, setHasMaxParticipants] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [steps, setSteps] = useState<QuestStep[]>([]);
  const [showPreview, setShowPreview] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const addTag = () => { if (tagInput.trim() && !tags.includes(tagInput.trim())) { setTags([...tags, tagInput.trim()]); setTagInput(""); } };
  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } };
  const calculateTotalXP = () => xpReward + steps.reduce((acc, step) => acc + step.xpReward, 0);

  const handleSave = async (status: "draft" | "active") => {
    if (!user) { toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" }); return; }
    if (!title.trim()) { toast({ title: "Campo obrigatório", description: "Adicione um título.", variant: "destructive" }); return; }
    if (!description.trim()) { toast({ title: "Campo obrigatório", description: "Adicione uma descrição.", variant: "destructive" }); return; }

    setIsSaving(true);
    try {
      const { data: quest, error: questError } = await supabase.from("custom_quests").insert({
        title: title.trim(), description: description.trim(), icon, difficulty: difficulty as "easy" | "medium" | "hard" | "expert",
        xp_reward: xpReward, coin_reward: coinReward, status: status as "draft" | "active" | "archived",
        deadline_days: hasDeadline ? deadlineDays : null, max_participants: hasMaxParticipants ? maxParticipants : null,
        tags, created_by: user.id,
      }).select().single();
      if (questError) throw questError;

      if (steps.length > 0 && quest) {
        const { error: stepsError } = await supabase.from("quest_steps").insert(
          steps.map((step, index) => ({ quest_id: quest.id, title: step.title, description: step.description, order_index: index, xp_reward: step.xpReward }))
        );
        if (stepsError) throw stepsError;
      }

      setSaveSuccess(true);
      toast({ title: status === "active" ? "Quest Publicada!" : "Rascunho Salvo!", description: status === "active" ? "A quest está disponível." : "Você pode continuar editando." });
      setTimeout(() => navigate("/manager"), 1500);
    } catch (err: unknown) {
      logger.apiError('handleSave', err, 'QuestBuilder');
      toast({ title: "Erro ao salvar", description: err instanceof Error ? err.message : "Ocorreu um erro.", variant: "destructive" });
    } finally { setIsSaving(false); }
  };

  return (
    <PageShell title="Criar Nova Quest" backFallback="/manager">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4 py-6 border-b border-border/50 bg-background/50 backdrop-blur-lg sticky top-0 z-40">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Criar Nova Quest</h1>
          <p className="text-muted-foreground text-sm">Monte uma trilha de aprendizado para sua equipe</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="hidden gap-2 md:flex">
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{showPreview ? "Ocultar Preview" : "Mostrar Preview"}
          </Button>
          <Button variant="outline" onClick={() => handleSave("draft")} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Salvar Rascunho
          </Button>
          <Button onClick={() => handleSave("active")} disabled={isSaving} className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90">
            {saveSuccess ? <CheckCircle className="h-4 w-4" /> : isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Publicar Quest
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 pb-24">
        <div className={`grid gap-8 ${showPreview ? "lg:grid-cols-2" : "lg:grid-cols-1 max-w-3xl mx-auto"}`}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <BasicInfoSection icon={icon} setIcon={setIcon} title={title} setTitle={setTitle} description={description} setDescription={setDescription} difficulty={difficulty} setDifficulty={setDifficulty} xpReward={xpReward} setXpReward={setXpReward} coinReward={coinReward} setCoinReward={setCoinReward} />
            <AdvancedSection hasDeadline={hasDeadline} setHasDeadline={setHasDeadline} deadlineDays={deadlineDays} setDeadlineDays={setDeadlineDays} hasMaxParticipants={hasMaxParticipants} setHasMaxParticipants={setHasMaxParticipants} maxParticipants={maxParticipants} setMaxParticipants={setMaxParticipants} tags={tags} tagInput={tagInput} setTagInput={setTagInput} addTag={addTag} removeTag={removeTag} handleKeyDown={handleKeyDown} />
            <StepsSection steps={steps} onStepsChange={setSteps} totalXP={calculateTotalXP()} />
          </motion.div>
          <AnimatePresence>
            {showPreview && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="lg:sticky lg:top-24 lg:self-start">
                <div className="mb-4 flex items-center gap-2"><Eye className="h-5 w-5 text-muted-foreground" /><h2 className="font-semibold text-foreground">Preview da Quest</h2></div>
                <QuestPreview title={title} description={description} icon={icon} difficulty={difficulty} xpReward={xpReward} coinReward={coinReward} deadlineDays={hasDeadline ? deadlineDays : null} maxParticipants={hasMaxParticipants ? maxParticipants : null} tags={tags} steps={steps} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageShell>
  );
}
