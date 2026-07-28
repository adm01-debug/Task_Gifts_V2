import { useState, useEffect } from "react";
import { Users, Phone, Trophy, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import type { MillionaireQuestion } from "./MillionaireQuiz";
import { getQuizLifeline } from "@/services/quizQuestionsService";
import { logger } from "@/lib/logger";

export const PRIZE_LADDER = [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000];
export const CHECKPOINTS = [4, 9, 14];

export function formatPrize(value: number): string {
  if (value >= 1000000) return `${value / 1000000}M`;
  if (value >= 1000) return `${value / 1000}K`;
  return value.toString();
}

export function AudienceHelp({ question, onClose }: { question: MillionaireQuestion; onClose: () => void }) {
  // A distribuição é calculada no servidor: o gabarito nunca chega ao cliente.
  const [percentages, setPercentages] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    getQuizLifeline(question.id, "audience")
      .then((result) => {
        if (cancelled) return;
        const byId = new Map((result.distribution || []).map((d) => [d.option_id, d.percent]));
        setPercentages(question.options.map((o) => byId.get(o.id) ?? 0));
      })
      .catch((err: unknown) => {
        logger.error("Falha ao consultar ajuda da plateia", err);
        if (!cancelled) setPercentages(question.options.map(() => 0));
      });
    return () => {
      cancelled = true;
    };
  }, [question]);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" />Ajuda da Plateia</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          {question.options.map((option, idx) => (
            <div key={option.id} className="space-y-1">
              <div className="flex justify-between text-sm"><span className="font-medium">{String.fromCharCode(65 + idx)}</span><span>{percentages[idx] || 0}%</span></div>
              <div className="h-8 bg-muted rounded-lg overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${percentages[idx] || 0}%` }} transition={{ duration: 0.5, delay: idx * 0.1 }} className="h-full bg-primary/60" />
              </div>
            </div>
          ))}
        </div>
        <Button onClick={onClose} className="w-full">Fechar</Button>
      </DialogContent>
    </Dialog>
  );
}

export function PhoneHelp({ question, onClose }: { question: MillionaireQuestion; onClose: () => void }) {
  const [message, setMessage] = useState("");
  const [suggestion, setSuggestion] = useState<{ letter: string; confidence: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getQuizLifeline(question.id, "phone")
      .then((result) => {
        if (cancelled) return;
        const idx = question.options.findIndex((o) => o.id === result.suggested_option_id);
        if (idx < 0) return;
        setSuggestion({ letter: String.fromCharCode(65 + idx), confidence: result.confidence ?? 60 });
      })
      .catch((err: unknown) => {
        logger.error("Falha ao consultar ligação para um amigo", err);
      });
    return () => {
      cancelled = true;
    };
  }, [question]);

  useEffect(() => {
    if (!suggestion) return;
    const correctLetter = suggestion.letter;
    const confidence =
      suggestion.confidence >= 85 ? "tenho certeza" : suggestion.confidence >= 70 ? "acho que" : "não tenho certeza, mas chuto";
    const messages = [
      `Hmm, deixa eu pensar... Eu ${confidence} que é a alternativa ${correctLetter}!`,
      `Olha, ${confidence} a resposta é ${correctLetter}.`,
      `Essa é difícil! Mas ${confidence} que a certa é a ${correctLetter}.`,
    ];
    let idx = 0;
    const selected = messages[Math.floor(Math.random() * messages.length)];
    const interval = setInterval(() => { if (idx <= selected.length) { setMessage(selected.slice(0, idx)); idx++; } else { clearInterval(interval); } }, 50);
    return () => clearInterval(interval);
  }, [suggestion]);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Phone className="w-5 h-5 text-emerald-500" />Ligação para um Amigo</DialogTitle></DialogHeader>
        <div className="py-6">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-2xl">🧑‍💼</div>
            <div className="flex-1 p-4 rounded-2xl bg-muted/50 border border-border/50"><p className="text-sm">{message}<span className="animate-pulse">|</span></p></div>
          </div>
        </div>
        <Button onClick={onClose} className="w-full">Desligar</Button>
      </DialogContent>
    </Dialog>
  );
}

export function PrizeLadder({ currentLevel }: { currentLevel: number }) {
  return (
    <Card className="lg:col-span-1 p-4 bg-gradient-to-b from-card to-primary/5 order-2 lg:order-1">
      <h3 className="text-sm font-semibold mb-3 text-center">Prêmios</h3>
      <div className="space-y-1">
        {[...PRIZE_LADDER].reverse().map((prize, idx) => {
          const level = PRIZE_LADDER.length - 1 - idx;
          const isCheckpoint = CHECKPOINTS.includes(level);
          const isCurrent = level === currentLevel;
          const isPassed = level < currentLevel;
          return (
            <div key={level} className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-all ${isCurrent ? 'bg-amber-500/30 text-amber-400 font-bold scale-105' : isPassed ? 'text-emerald-500' : isCheckpoint ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              <span>{level + 1}</span>
              <span className="flex items-center gap-1">{isPassed && <Check className="w-3 h-3" />}{isCheckpoint && !isPassed && "🛡️"}{formatPrize(prize)}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function GameOverScreen({ wonPrize, onRestart }: { wonPrize: number; onRestart: () => void }) {
  const isWinner = wonPrize === 1000000;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
      <motion.div animate={{ scale: [1, 1.1, 1], rotate: isWinner ? [0, 10, -10, 0] : 0 }} transition={{ duration: 0.5, repeat: isWinner ? Infinity : 0, repeatDelay: 2 }}>
        <Trophy className={`w-24 h-24 mx-auto mb-6 ${isWinner ? 'text-amber-400' : 'text-primary'}`} />
      </motion.div>
      <h2 className="text-3xl font-bold mb-2">{isWinner ? "VOCÊ É O MILIONÁRIO! 🎉" : wonPrize > 0 ? "Fim de Jogo!" : "Que pena! 😔"}</h2>
      <p className="text-muted-foreground mb-6">{isWinner ? "Parabéns! Você acertou todas as perguntas!" : wonPrize > 0 ? `Você garantiu ${formatPrize(wonPrize)} pontos!` : "Você não conseguiu nenhum prêmio desta vez."}</p>
      <div className="inline-block mb-8">
        <Card className="p-6 bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30">
          <p className="text-sm text-muted-foreground mb-1">Prêmio Final</p>
          <p className="text-4xl font-bold text-amber-400">🪙 {formatPrize(wonPrize)}</p>
        </Card>
      </div>
      <div className="flex gap-4 justify-center">
        <Button onClick={onRestart} size="lg" className="gap-2"><RotateCcw className="w-4 h-4" />Jogar Novamente</Button>
      </div>
    </motion.div>
  );
}
