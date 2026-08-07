import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
 import { Lightbulb, Copy, Check, Volume2, VolumeX, RotateCcw, Maximize2, Minimize2, Sparkles, Send, X, Trash2, Bot, User, Loader2, BookOpen, Clock, Zap, Target, Trophy, Flame, TrendingUp, AlertCircle } from "lucide-react";
 import { useHaptics } from "@/hooks/useHaptics";
 import { useSoundEffects } from "@/hooks/useSoundEffects";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAICoach } from "@/hooks/useAICoach";
import { usePublishedTrails } from "@/hooks/useTrails";
import { useCurrentProfile } from "@/hooks/useProfiles";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { aiCoachMessageSchema } from "@/lib/validations";

const QUICK_PROMPTS = [
  { icon: "🎯", text: "Como ganhar mais XP?", category: "xp" },
  { icon: "📚", text: "Sugira trilhas para mim", category: "trails" },
  { icon: "🔥", text: "Explique o sistema de combo", category: "combo" },
  { icon: "🏆", text: "Dicas para subir no ranking", category: "ranking" },
  { icon: "💪", text: "Quais competências desenvolver?", category: "skills" },
  { icon: "🎮", text: "Como funcionam os duelos?", category: "duels" },
  { icon: "📊", text: "Analise minha performance", category: "performance" },
  { icon: "🎁", text: "Como ganhar mais moedas?", category: "coins" },
];

interface TrailCardProps {
  trail: {
    id: string;
    title: string;
    icon?: string | null;
    estimated_hours?: number | null;
    xp_reward?: number | null;
  };
  onNavigate: (id: string) => void;
}

function TrailCard({ trail, onNavigate }: TrailCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onNavigate(trail.id)}
      className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 hover:border-primary/40 transition-all w-full text-left group"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-lg flex-shrink-0">
        {trail.icon || "📚"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
          {trail.title}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          {trail.estimated_hours && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {trail.estimated_hours}h
            </span>
          )}
          {trail.xp_reward && (
            <span className="flex items-center gap-1 text-primary">
              <Zap className="w-3 h-3" />
              {trail.xp_reward} XP
            </span>
          )}
        </div>
      </div>
      <BookOpen className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </motion.button>
  );
}

interface AICoachDialogProps {
  trigger?: React.ReactNode;
}

export function AICoachDialog({ trigger }: AICoachDialogProps = {}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "stats">("chat");
   const { messages, suggestions, isLoading, error, sendMessage, clearMessages } = useAICoach();
   const { vibrate } = useHaptics();
   const { playClickSound, playXPSound } = useSoundEffects();
  const { data: trails } = usePublishedTrails();
  const { data: profile } = useCurrentProfile();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

   useEffect(() => {
     if (scrollRef.current) {
       scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
     }
 
     if (messages.length > 0 && messages[messages.length - 1].role === "assistant" && !isLoading) {
       vibrate("medium");
       playXPSound();
     }
   }, [messages, isLoading, vibrate, playXPSound]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (input.trim() && !isLoading) {
       vibrate("light");
       playClickSound();
       sendMessage(input);
       setInput("");
     }
   };

   const handleQuickPrompt = (prompt: string) => {
     vibrate("light");
     playClickSound();
     sendMessage(prompt);
   };

   const handleNavigateToTrail = (trailId: string) => {
     vibrate("medium");
     playClickSound();
     setOpen(false);
     navigate(`/trails/${trailId}`);
   };

  const handleCopyMessage = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      toast.success("Copiado para a área de transferência!");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const handleRetryMessage = () => {
    if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
      if (lastUserMessage) {
        clearMessages();
        setTimeout(() => sendMessage(lastUserMessage.content), 100);
      }
    }
  };

  // Find trails mentioned in a message
  const findMentionedTrails = (content: string) => {
    if (!trails) return [];
    
    const mentionedTrails: typeof trails = [];
    const lowerContent = content.toLowerCase();
    
    for (const trail of trails) {
      // Check if trail title is mentioned (case insensitive)
      const trailTitleLower = trail.title.toLowerCase();
      if (lowerContent.includes(trailTitleLower) || 
          lowerContent.includes(`"${trailTitleLower}"`) ||
          lowerContent.includes(`"${trail.title}"`) ||
          lowerContent.includes(trail.title)) {
        mentionedTrails.push(trail);
      }
    }
    
    return mentionedTrails.slice(0, 5); // Limit to 5 trails
  };

  const renderMessageContent = (content: string, isAssistant: boolean) => {
    if (!isAssistant) {
      return <p className="whitespace-pre-wrap">{content}</p>;
    }

    const mentionedTrails = findMentionedTrails(content);

    return (
      <div className="space-y-3">
        <p className="whitespace-pre-wrap">{content}</p>
        {mentionedTrails.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground font-medium">Trilhas mencionadas:</p>
            {mentionedTrails.map((trail) => (
              <TrailCard
                key={trail.id}
                trail={trail}
                onNavigate={handleNavigateToTrail}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-accent/20 to-primary/20 border border-accent/30 hover:border-accent/50 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">AI Coach</span>
          </motion.button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              AI Coach
            </DialogTitle>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearMessages}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="py-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 mx-auto flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Olá! Sou seu AI Coach</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Posso ajudar com dúvidas sobre gamificação, sugerir trilhas e dar dicas personalizadas.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <Button
                      key={prompt.text}
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1"
                      onClick={() => handleQuickPrompt(prompt.text)}
                    >
                      <span>{prompt.icon}</span>
                      {prompt.text}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      "flex gap-3",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center flex-shrink-0">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md"
                      )}
                    >
                      {renderMessageContent(msg.content, msg.role === "assistant")}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    )}
                  </motion.div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <motion.div 
                      className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center flex-shrink-0"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </motion.div>
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="w-2 h-2 bg-gradient-to-br from-accent to-primary rounded-full"
                            animate={{
                              y: [0, -6, 0],
                              opacity: [0.5, 1, 0.5],
                              scale: [0.9, 1.1, 0.9],
                            }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                              delay: i * 0.15,
                              ease: "easeInOut",
                            }}
                          />
                        ))}
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          transition={{ delay: 0.5 }}
                          className="text-xs text-muted-foreground ml-2"
                        >
                          Pensando...
                        </motion.span>
                      </div>
                    </div>
                  </motion.div>
                )}
                {/* Follow-up suggestions */}
                {!isLoading && suggestions.length > 0 && messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col gap-2 pt-2"
                  >
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Lightbulb className="w-3 h-3" />
                      <span>Sugestões:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.map((suggestion, idx) => (
                        <motion.button
                          key={idx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4 + idx * 0.1 }}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => sendMessage(suggestion)}
                          className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20 hover:border-accent/40 text-foreground transition-colors"
                        >
                          {suggestion}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>

        {error && (
          <div role="alert" className="px-4 py-2 bg-destructive/10 text-destructive text-sm flex-shrink-0">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 border-t border-border flex gap-2 flex-shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua pergunta..."
            disabled={isLoading}
            className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-shadow disabled:opacity-50"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="rounded-xl h-10 w-10"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
