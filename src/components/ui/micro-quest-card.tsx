import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, Clock, CheckCircle2, ChevronRight, 
  Sparkles, Coffee, BookOpen, Target, 
  MessageSquare, Trophy, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import confetti from "canvas-confetti";

export interface MicroQuest {
  id: string;
  title: string;
  description: string;
  duration: "2min" | "5min";
  xpReward: number;
  coinReward: number;
  category: "learning" | "social" | "wellness" | "productivity";
  icon: React.ReactNode;
  action?: () => void;
}

const categoryColors = {
  learning: "from-blue-500 to-cyan-500",
  social: "from-pink-500 to-rose-500",
  wellness: "from-green-500 to-emerald-500",
  productivity: "from-purple-500 to-violet-500",
};

const categoryBg = {
  learning: "bg-blue-500/10",
  social: "bg-pink-500/10",
  wellness: "bg-green-500/10",
  productivity: "bg-purple-500/10",
};

interface MicroQuestCardProps {
  quest: MicroQuest;
  onComplete: (questId: string) => void;
  onStart?: (questId: string) => void;
}

export function MicroQuestCard({ quest, onComplete, onStart }: MicroQuestCardProps) {
  const [status, setStatus] = useState<"idle" | "active" | "completed">("idle");
  const [progress, setProgress] = useState(0);

  const handleStart = () => {
    setStatus("active");
    onStart?.(quest.id);
    
    // Simulate progress
    const duration = quest.duration === "2min" ? 2000 : 5000; // Accelerated for demo
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, duration / 20);
  };

  const handleComplete = () => {
    setStatus("completed");
    onComplete(quest.id);
    
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`
        relative overflow-hidden rounded-2xl border transition-all duration-500 group
        ${status === "completed" 
          ? "bg-emerald-500/10 border-emerald-500/30 shadow-glow-sm" 
          : "bg-black/40 border-white/5 backdrop-blur-xl hover:border-primary/40 hover:bg-black/60 shadow-lg"}
      `}
    >
      {/* Scanner effect for active/hover state */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,255,255,0.4)_50%,transparent_100%)] bg-[length:100%_4px] animate-scanline" />
      </div>

      {/* Status Bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${categoryColors[quest.category]} opacity-60`} />
      
      {/* HUD corner accents */}
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/10 group-hover:border-primary/40 transition-colors pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/10 group-hover:border-primary/40 transition-colors pointer-events-none" />

      <div className="p-4 relative z-10">
        <div className="flex items-start gap-4">
          {/* Icon with futuristic container */}
          <div className={`
            p-3 rounded-xl relative overflow-hidden transition-transform duration-500 group-hover:scale-110
            ${categoryBg[quest.category]} border border-white/5 shadow-inner
          `}>
            {/* Pulsing glow background */}
            <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${categoryColors[quest.category]} animate-pulse`} />
            <div className="relative z-10 flex items-center justify-center">
              {quest.icon}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h4 className="font-black text-sm text-white uppercase italic tracking-wider truncate group-hover:text-primary transition-colors">
                {quest.title}
              </h4>
              {status === "completed" && (
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                </div>
              )}
            </div>
            
            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed line-clamp-2 h-8 opacity-80 group-hover:opacity-100 transition-opacity">
              {quest.description}
            </p>

            {/* Meta info with Tactical HUD style */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                <Clock className="w-3 h-3 text-primary" />
                <span className="text-[9px] font-black text-white/70 uppercase tracking-widest">{quest.duration}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                <Zap className="w-3 h-3 text-primary animate-pulse" />
                <span className="text-[9px] font-black text-primary uppercase tracking-widest">+{quest.xpReward} XP</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">+{quest.coinReward}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action area */}
        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-3"
            >
              <Button
                size="sm"
                className={`w-full bg-gradient-to-r ${categoryColors[quest.category]} text-white uppercase font-black text-[10px] italic tracking-[0.2em] shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300`}
                onClick={handleStart}
              >
                <Sparkles className="w-3 h-3 mr-2" />
                INITIATE_TASK
                <ChevronRight className="w-3 h-3 ml-1 animate-bounce-x" />
              </Button>
            </motion.div>
          )}

          {status === "active" && (
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-4 space-y-3"
            >
              <div className="relative h-2 rounded-full bg-white/5 border border-white/10 overflow-hidden">
                <motion.div 
                  className={`h-full bg-gradient-to-r ${categoryColors[quest.category]} relative`}
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                >
                  {/* Progress Glow */}
                  <div className="absolute top-0 bottom-0 right-0 w-4 bg-white/30 blur-sm" />
                </motion.div>
              </div>
              <Button
                size="sm"
                variant="glass"
                className="w-full border-primary/20 hover:border-primary/50 uppercase font-black text-[10px] italic tracking-widest text-primary"
                onClick={handleComplete}
                disabled={progress < 100}
              >
                {progress < 100 ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    EXECUTING_OPERATIONS... {progress}%
                  </div>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 mr-2" />
                    CONFIRM_COMPLETION
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {status === "completed" && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 text-center py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20"
            >
              <div className="inline-flex items-center gap-2 text-emerald-400">
                <Trophy className="w-4 h-4 animate-bounce" />
                <span className="font-black text-[10px] uppercase tracking-widest italic">MISSION_ACCOMPLISHED</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Sample micro-quests
export const sampleMicroQuests: MicroQuest[] = [
  {
    id: "1",
    title: "Café com Propósito",
    description: "Reflita sobre sua maior prioridade do dia",
    duration: "2min",
    xpReward: 25,
    coinReward: 5,
    category: "wellness",
    icon: <Coffee className="w-5 h-5 text-green-500" />,
  },
  {
    id: "2",
    title: "Micro-Leitura",
    description: "Leia um artigo curto sobre sua área",
    duration: "5min",
    xpReward: 50,
    coinReward: 10,
    category: "learning",
    icon: <BookOpen className="w-5 h-5 text-blue-500" />,
  },
  {
    id: "3",
    title: "Agradeça um Colega",
    description: "Envie um elogio rápido para alguém",
    duration: "2min",
    xpReward: 30,
    coinReward: 8,
    category: "social",
    icon: <MessageSquare className="w-5 h-5 text-pink-500" />,
  },
  {
    id: "4",
    title: "Meta Check",
    description: "Revise o progresso de uma meta",
    duration: "2min",
    xpReward: 20,
    coinReward: 5,
    category: "productivity",
    icon: <Target className="w-5 h-5 text-purple-500" />,
  },
];

// Container for micro-quests list
export function MicroQuestsList({
  quests = sampleMicroQuests,
  onComplete,
}: {
  quests?: MicroQuest[];
  onComplete?: (questId: string) => void;
}) {
  const handleComplete = (questId: string) => {
    onComplete?.(questId);
  };

  return (
    <div className="space-y-4" data-tour="micro-quests">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-black text-xs text-white uppercase tracking-[0.2em] italic flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
            <Zap className="w-3 h-3 text-primary animate-pulse" />
          </div>
          Tactical Operations
          <span className="text-[9px] bg-primary text-primary-foreground font-black px-2 py-0.5 rounded-md animate-pulse">
            HOT_TASKS
          </span>
        </h3>
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter opacity-70 italic">
          SYNC_TIME: 2-5M
        </span>
      </div>
      
      <div className="space-y-2">
        {quests.map((quest) => (
          <MicroQuestCard
            key={quest.id}
            quest={quest}
            onComplete={handleComplete}
          />
        ))}
      </div>
    </div>
  );
}
