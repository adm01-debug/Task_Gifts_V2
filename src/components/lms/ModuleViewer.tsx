import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import DOMPurify from "dompurify";
import { 
   X, CheckCircle2, ChevronLeft, ChevronRight, 
   Video, FileText, HelpCircle, Layers, Play, Clock, Star, Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { TrailModule } from "@/services/trailsService";
import { useAuth } from "@/hooks/useAuth";
import {
  clearResume,
  describeResume,
  loadResume,
  safeResumePosition,
  saveResume,
  type ResumableContentType,
  type ResumeState,
} from "@/lib/playerResume";

/** Estado parcial reportado pelos conteúdos para persistência de retomada. */
interface ProgressSnapshot {
  position: number;
  answers?: number[];
  checked?: number[];
}

/**
 * Atalhos de teclado do player. Ignora eventos originados em campos editáveis
 * para não sequestrar a digitação do usuário.
 */
function useContentShortcuts(handler: (key: string) => void, enabled = true) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable) return;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      handlerRef.current(event.key);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

interface FlashCard {
  front: string;
  back: string;
}

interface ChecklistItem {
  text: string;
  checked?: boolean;
}

interface ModuleViewerProps {
  module: TrailModule;
  onComplete: (score?: number) => void;
  onClose: () => void;
}

 function VideoContent({ videoUrl }: { videoUrl: string }) {
   const isYoutube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
   const [isPlaying, setIsPlaying] = useState(false);

   if (isYoutube) {
    const videoId = videoUrl.includes("youtu.be") 
      ? videoUrl.split("/").pop() 
      : new URL(videoUrl).searchParams.get("v");
    
    return (
      <div className="group relative aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl ring-1 ring-white/10">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <div className="absolute inset-0 pointer-events-none border-[6px] border-white/5 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="relative group aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-2xl ring-1 ring-white/10">
      {!isPlaying ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-10 transition-all group-hover:bg-black/40">
          <div className="relative">
            <motion.div 
              className="absolute inset-0 rounded-full bg-primary/20"
              animate={{ scale: [1, 1.4], opacity: [1, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.button
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsPlaying(true)}
              className="relative w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_0_50px_rgba(var(--primary),0.5)] z-20"
            >
              <Play className="h-10 w-10 ml-1 fill-current" />
            </motion.button>
          </div>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-12 text-white font-bold tracking-widest uppercase text-xs"
          >
            Clique para Iniciar
          </motion.p>
        </div>
      ) : null}
      <video 
        src={videoUrl} 
        controls={isPlaying}
        autoPlay={isPlaying}
        className="w-full h-full object-cover" 
      />
      <div className="absolute inset-0 pointer-events-none border-[6px] border-white/5 rounded-2xl" />
    </div>
  );
 }

function TextContent({ content }: { content: { text?: string; html?: string } }) {
  // Sanitize HTML content to prevent XSS attacks
  const sanitizedHtml = useMemo(() => {
    if (!content.html) return null;
    return DOMPurify.sanitize(content.html, {
      ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'span', 'div'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
      ALLOW_DATA_ATTR: false,
    });
  }, [content.html]);

  if (sanitizedHtml) {
    return (
      <div 
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    );
  }

  return (
    <div className="prose prose-invert max-w-none whitespace-pre-wrap">
      {content.text || "Conteúdo não disponível"}
    </div>
  );
}

function QuizContent({ 
  questions, 
  onComplete,
  initialPosition = 0,
  initialAnswers,
  onProgress,
}: { 
  questions: QuizQuestion[]; 
  onComplete: (score: number) => void;
  initialPosition?: number;
  initialAnswers?: number[];
  onProgress?: (snapshot: ProgressSnapshot) => void;
}) {
  const [currentQuestion, setCurrentQuestion] = useState(initialPosition);
  const [answers, setAnswers] = useState<number[]>(initialAnswers ?? []);
  const [showResults, setShowResults] = useState(false);

  const report = useCallback(
    (position: number, nextAnswers: number[]) => {
      onProgress?.({ position, answers: nextAnswers });
    },
    [onProgress],
  );

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
    report(currentQuestion, newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      const next = currentQuestion + 1;
      setCurrentQuestion(next);
      report(next, answers);
    } else {
      setShowResults(true);
    }
  };

  const handlePrev = useCallback(() => {
    setCurrentQuestion((prev) => {
      const next = Math.max(0, prev - 1);
      report(next, answers);
      return next;
    });
  }, [answers, report]);

  // Teclado: 1..9 seleciona alternativa, setas navegam entre questões.
  useContentShortcuts((key) => {
    if (showResults) return;
    const numeric = Number.parseInt(key, 10);
    if (!Number.isNaN(numeric) && numeric >= 1 && numeric <= questions[currentQuestion]?.options.length) {
      handleAnswer(numeric - 1);
      return;
    }
    if (key === "ArrowLeft") handlePrev();
    if (key === "ArrowRight" && answers[currentQuestion] !== undefined) handleNext();
  }, questions.length > 0);

  const calculateScore = () => {
    const correct = questions.reduce((acc, q, i) => {
      return acc + (answers[i] === q.correct ? 1 : 0);
    }, 0);
    return Math.round((correct / questions.length) * 100);
  };

  if (showResults) {
    const score = calculateScore();
    const passed = score >= 70;

    return (
      <div className="text-center py-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${
            passed ? "bg-emerald-500/20" : "bg-red-500/20"
          }`}
        >
          <span className="text-4xl font-bold">{score}%</span>
        </motion.div>
        
        <h3 className="text-xl font-semibold mb-2">
          {passed ? "🎉 Parabéns!" : "😕 Quase lá!"}
        </h3>
        <p className="text-muted-foreground mb-6">
          {passed 
            ? `Você acertou ${answers.filter((a, i) => a === questions[i].correct).length} de ${questions.length} questões!`
            : "Você precisa de 70% para passar. Tente novamente!"}
        </p>
        
         <Button 
           onClick={() => onComplete(score)} 
           disabled={!passed}
           className="w-full h-14 font-black uppercase tracking-widest text-xs gap-3 shadow-lg rounded-xl"
         >
           <CheckCircle2 className="h-5 w-5" />
           {passed ? "Finalizar Protocolo de Quiz" : "Repetir Avaliação"}
         </Button>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground" aria-live="polite">
          Questão {currentQuestion + 1} de {questions.length}
        </span>
        <Progress value={(currentQuestion / questions.length) * 100} className="w-32 h-2" />
      </div>

      <h3 className="text-lg font-medium">{question.question}</h3>

      <RadioGroup
        value={answers[currentQuestion]?.toString()}
        onValueChange={(value) => handleAnswer(parseInt(value))}
        className="space-y-3"
      >
        {question.options.map((option, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Label
              htmlFor={`option-${index}`}
              className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                answers[currentQuestion] === index
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <RadioGroupItem value={index.toString()} id={`option-${index}`} />
              <span>{option}</span>
            </Label>
          </motion.div>
        ))}
      </RadioGroup>

      <div className="flex justify-between pt-8 gap-4">
        <Button
          variant="outline"
          className="h-12 px-6 font-bold tracking-tight rounded-xl border-2"
          onClick={handlePrev}
          disabled={currentQuestion === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>
        <Button
          className="flex-1 h-12 font-black tracking-widest uppercase text-xs shadow-lg shadow-primary/20 rounded-xl"
          onClick={handleNext}
          disabled={answers[currentQuestion] === undefined}
        >
          {currentQuestion === questions.length - 1 ? "Finalizar Protocolo" : "Próxima Fase"}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function FlashcardsContent({ 
  cards,
  onComplete,
  initialPosition = 0,
  initialReviewed,
  onProgress,
}: { 
  cards: FlashCard[];
  onComplete: () => void;
  initialPosition?: number;
  initialReviewed?: number[];
  onProgress?: (snapshot: ProgressSnapshot) => void;
}) {
  const [currentCard, setCurrentCard] = useState(initialPosition);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewed, setReviewed] = useState<Set<number>>(new Set(initialReviewed ?? []));

  const handleNext = () => {
    const nextReviewed = new Set([...reviewed, currentCard]);
    setReviewed(nextReviewed);
    setIsFlipped(false);

    const next = currentCard < cards.length - 1 ? currentCard + 1 : currentCard;
    setCurrentCard(next);
    onProgress?.({ position: next, checked: [...nextReviewed] });
  };

  const handlePrev = () => {
    setIsFlipped(false);
    const next = Math.max(0, currentCard - 1);
    setCurrentCard(next);
    onProgress?.({ position: next, checked: [...reviewed] });
  };

  // Teclado: espaço/Enter gira o card, setas navegam.
  useContentShortcuts((key) => {
    if (key === " " || key === "Enter") {
      setIsFlipped((flipped) => !flipped);
      return;
    }
    if (key === "ArrowLeft" && currentCard > 0) handlePrev();
    if (key === "ArrowRight" && currentCard < cards.length - 1) handleNext();
  }, cards.length > 0);

  const allReviewed = reviewed.size === cards.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Card {currentCard + 1} de {cards.length}
        </span>
        <Progress value={(reviewed.size / cards.length) * 100} className="w-32 h-2" />
      </div>

      <div 
        role="button"
        tabIndex={0}
        aria-pressed={isFlipped}
        aria-label={`Flashcard ${currentCard + 1} de ${cards.length}. Pressione espaço para girar.`}
        className="relative h-80 cursor-pointer perspective-2000 group rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={() => setIsFlipped(!isFlipped)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsFlipped((flipped) => !flipped);
          }
        }}
      >
        <motion.div
          className="absolute inset-0 rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-8 flex flex-col items-center justify-center text-center shadow-2xl backface-hidden preserve-3d"
          animate={{ 
            rotateY: isFlipped ? 180 : 0,
            z: isFlipped ? 0 : 50
          }}
          transition={{ 
            duration: 0.7,
            type: "spring",
            stiffness: 200,
            damping: 20
          }}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="absolute top-6 left-6 flex items-center gap-2 opacity-50">
             <Layers className="h-4 w-4 text-primary" />
             <span className="text-[10px] font-black uppercase tracking-tighter">Flashcard</span>
          </div>
          <div className="space-y-6 translate-z-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest border border-primary/20">
              Pergunta
            </div>
            <h4 className="text-3xl font-black leading-tight text-foreground tracking-tight">{cards[currentCard].front}</h4>
            <div className="flex flex-col items-center gap-2 mt-8 animate-bounce">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Toque para Girar</span>
              <ChevronRight className="h-4 w-4 rotate-90 text-primary" />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="absolute inset-0 rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-background to-emerald-500/5 p-8 flex flex-col items-center justify-center text-center shadow-2xl preserve-3d"
          initial={{ rotateY: 180 }}
          animate={{ 
            rotateY: isFlipped ? 0 : -180,
            z: isFlipped ? 50 : 0
          }}
          transition={{ 
            duration: 0.7,
            type: "spring",
            stiffness: 200,
            damping: 20
          }}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="absolute top-6 right-6">
             <CheckCircle2 className="h-8 w-8 text-emerald-500/40" />
          </div>
          <div className="space-y-6 translate-z-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-black uppercase tracking-widest border border-emerald-500/20">
              Resposta
            </div>
            <p className="text-3xl font-black leading-tight text-foreground tracking-tight">{cards[currentCard].back}</p>
          </div>
        </motion.div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handlePrev} disabled={currentCard === 0}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>
        
         {allReviewed ? (
           <Button 
             onClick={() => onComplete()} 
             className="flex-1 h-12 font-black tracking-widest uppercase text-xs shadow-lg shadow-primary/20 rounded-xl gap-2"
           >
             <CheckCircle2 className="h-4 w-4" />
             Protocolo Concluído
           </Button>
         ) : (
          <Button onClick={handleNext} disabled={currentCard === cards.length - 1}>
            Próximo
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

function ChecklistContent({ 
  items: initialItems,
  onComplete,
  initialChecked,
  onProgress,
}: { 
  items: ChecklistItem[];
  onComplete: () => void;
  initialChecked?: number[];
  onProgress?: (snapshot: ProgressSnapshot) => void;
}) {
  const [items, setItems] = useState(() =>
    initialItems.map((item, index) => ({ ...item, checked: initialChecked?.includes(index) ?? false })),
  );

  const toggleItem = (index: number) => {
    const newItems = items.map((item, i) => (i === index ? { ...item, checked: !item.checked } : item));
    setItems(newItems);
    onProgress?.({
      position: index,
      checked: newItems.map((item, i) => (item.checked ? i : -1)).filter((i) => i >= 0),
    });
  };

  const allChecked = items.every(i => i.checked);

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Complete todas as tarefas para avançar:
      </p>

      <div className="space-y-3">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Label
              htmlFor={`checklist-item-${index}`}
              className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                item.checked
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Checkbox
                id={`checklist-item-${index}`}
                checked={item.checked}
                onCheckedChange={() => toggleItem(index)}
              />
              <span className={item.checked ? "line-through text-muted-foreground" : ""}>
                {item.text}
              </span>
            </Label>
          </motion.div>
        ))}
      </div>

       <Button 
         onClick={() => onComplete()} 
         disabled={!allChecked}
         className="w-full h-14 font-black uppercase tracking-widest text-xs gap-3 shadow-lg shadow-emerald-500/20 rounded-xl"
       >
         <CheckCircle2 className="h-5 w-5" />
         Validar Checklist
       </Button>
    </div>
  );
}

export default function ModuleViewer({ module, onComplete, onClose }: ModuleViewerProps) {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const content = module.content as Record<string, unknown>;
  const contentType = module.content_type as ResumableContentType;

  /** Estado salvo lido uma única vez na montagem (sincronia com o storage local). */
  const [savedResume] = useState<ResumeState | null>(() => loadResume(user?.id, module.id));
  const [resumeApplied, setResumeApplied] = useState(false);
  const [resumeDismissed, setResumeDismissed] = useState(false);

  const totalItems = useMemo(() => {
    if (contentType === "quiz") return ((content.questions as QuizQuestion[]) || []).length;
    if (contentType === "flashcard") return ((content.cards as FlashCard[]) || []).length;
    if (contentType === "checklist") return ((content.items as ChecklistItem[]) || []).length;
    return 0;
  }, [content, contentType]);

  const showResumeBanner = Boolean(savedResume) && !resumeApplied && !resumeDismissed && totalItems > 0;
  const startPosition = resumeApplied ? safeResumePosition(savedResume, totalItems) : 0;
  const startAnswers = resumeApplied ? savedResume?.answers : undefined;
  const startChecked = resumeApplied ? savedResume?.checked : undefined;

  const handleProgress = useCallback(
    (snapshot: ProgressSnapshot) => {
      saveResume(user?.id, {
        moduleId: module.id,
        contentType,
        position: snapshot.position,
        answers: snapshot.answers,
        checked: snapshot.checked,
        updatedAt: Date.now(),
      });
    },
    [contentType, module.id, user?.id],
  );

  /** Conclusão limpa a retomada — o módulo deixa de estar "em andamento". */
  const handleComplete = useCallback(
    (score?: number) => {
      clearResume(user?.id, module.id);
      onComplete(score);
    },
    [module.id, onComplete, user?.id],
  );

  // Acessibilidade: foco inicial, ESC para sair e armadilha de foco no diálogo.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusables = containerRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const renderContent = () => {
    switch (module.content_type) {
      case "video":
        return (
          <div className="space-y-4">
            <VideoContent videoUrl={module.video_url || ""} />
             <Button 
               onClick={() => handleComplete()} 
               className="w-full h-14 font-black uppercase tracking-widest text-xs gap-3 shadow-lg shadow-emerald-500/20 rounded-xl"
             >
               <CheckCircle2 className="h-5 w-5" />
               Validar Visualização
             </Button>
          </div>
        );

      case "text":
        return (
          <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto p-4 rounded-lg bg-muted/50">
              <TextContent content={content as { text?: string; html?: string }} />
            </div>
             <Button 
               onClick={() => handleComplete()} 
               className="w-full h-14 font-black uppercase tracking-widest text-xs gap-3 shadow-lg shadow-emerald-500/20 rounded-xl"
             >
               <CheckCircle2 className="h-5 w-5" />
               Confirmar Leitura
             </Button>
          </div>
        );

      case "quiz":
        return (
          <QuizContent 
            questions={(content.questions as QuizQuestion[]) || []} 
            onComplete={handleComplete}
            initialPosition={startPosition}
            initialAnswers={startAnswers}
            onProgress={handleProgress}
          />
        );

      case "flashcard":
        return (
          <FlashcardsContent 
            cards={(content.cards as FlashCard[]) || []} 
            onComplete={() => handleComplete()}
            initialPosition={startPosition}
            initialReviewed={startChecked}
            onProgress={handleProgress}
          />
        );

      case "checklist":
        return (
          <ChecklistContent 
            items={(content.items as ChecklistItem[]) || []} 
            onComplete={() => handleComplete()}
            initialChecked={startChecked}
            onProgress={handleProgress}
          />
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Tipo de conteúdo não suportado</p>
            <Button onClick={() => handleComplete()} className="mt-4">
              Pular Módulo
            </Button>
          </div>
        );
    }
  };

   return (
     <motion.div
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       exit={{ opacity: 0 }}
       ref={containerRef}
       role="dialog"
       aria-modal="true"
       aria-labelledby="module-viewer-title"
       className="fixed inset-0 z-[100] bg-background/98 backdrop-blur-xl overflow-y-auto"
     >
       <div className="container max-w-4xl mx-auto px-4 py-8 md:py-12">
         {/* Top Navigation */}
         <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-4">
             <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
               <Layers className="h-6 w-6" />
             </div>
             <div>
               <div className="flex items-center gap-2 mb-1">
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-2 py-0.5 rounded-sm">
                   Módulo em Curso
                 </span>
               </div>
               <h2 id="module-viewer-title" className="text-2xl font-black tracking-tight">{module.title}</h2>
             </div>
           </div>
           
           <Button 
             variant="ghost" 
             size="icon" 
             onClick={onClose} 
             className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors h-12 w-12"
           >
             <X className="h-6 w-6" />
           </Button>
         </div>

         {showResumeBanner && savedResume && (
           <div
             role="status"
             className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4"
           >
             <p className="text-sm font-semibold text-foreground">
               {describeResume(savedResume, totalItems)}
             </p>
             <div className="flex gap-2">
               <Button size="sm" onClick={() => setResumeApplied(true)}>
                 Retomar
               </Button>
               <Button
                 size="sm"
                 variant="ghost"
                 onClick={() => {
                   clearResume(user?.id, module.id);
                   setResumeDismissed(true);
                 }}
               >
                 Começar do início
               </Button>
             </div>
           </div>
         )}

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           {/* Main Content Area */}
           <div className="lg:col-span-8 space-y-6">
             <Card className="border-none bg-card/50 shadow-2xl shadow-primary/5 ring-1 ring-white/10 overflow-hidden">
               <CardContent className="p-0">
                 <div className="p-6 md:p-8">
                   {renderContent()}
                 </div>
               </CardContent>
             </Card>

             {module.description && (
               <div className="p-6 rounded-2xl bg-muted/30 border border-border/50">
                 <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Sobre este módulo</h4>
                 <p className="text-muted-foreground leading-relaxed">{module.description}</p>
               </div>
             )}
           </div>

           {/* Sidebar Info */}
           <div className="lg:col-span-4 space-y-6">
             <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
               <CardHeader className="pb-4">
                 <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                   <Trophy className="h-4 w-4 text-primary" />
                   Recompensas
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-primary/10">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                       <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                     </div>
                     <span className="text-sm font-bold">XP Bonus</span>
                   </div>
                   <span className="text-xl font-black text-amber-500">+{module.xp_reward}</span>
                 </div>

                 <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-primary/10">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                       <Clock className="h-5 w-5 text-primary" />
                     </div>
                     <span className="text-sm font-bold">Duração</span>
                   </div>
                   <span className="text-lg font-black">{module.duration_minutes} min</span>
                 </div>
               </CardContent>
             </Card>

             <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-6">
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                   <CheckCircle2 className="h-5 w-5" />
                 </div>
                 <span className="font-bold text-emerald-500">Foco Total</span>
               </div>
               <p className="text-xs text-emerald-600/80 leading-relaxed font-medium">
                 Você está no modo de aprendizagem profunda. Complete as atividades para validar seu progresso na trilha.
               </p>
             </div>
           </div>
         </div>
       </div>
     </motion.div>
   );
}
