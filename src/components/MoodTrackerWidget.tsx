import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useMoodTracker } from "@/hooks/useMoodTracker";
import { MOOD_OPTIONS, MOOD_FACTORS } from "@/services/moodTrackerService";
import { Heart, Check } from "lucide-react";

export function MoodTrackerWidget() {
  const { todayMood, hasRecordedToday, submitMood, isSubmitting } = useMoodTracker();
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = () => {
    if (!selectedScore) return;
    
    submitMood({
      mood_score: selectedScore,
      factors: selectedFactors,
      note: note || undefined,
    });
    
    setShowForm(false);
    setSelectedScore(null);
    setSelectedFactors([]);
    setNote("");
  };

  const toggleFactor = (factorId: string) => {
    setSelectedFactors(prev => 
      prev.includes(factorId) 
        ? prev.filter(f => f !== factorId)
        : [...prev, factorId]
    );
  };

  if (hasRecordedToday && !showForm) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="text-3xl">{todayMood?.mood_emoji || '😊'}</div>
          <div className="flex-1">
            <p className="text-sm font-medium">Humor de hoje registrado!</p>
            <p className="text-xs text-muted-foreground">
              {MOOD_OPTIONS.find(m => m.score === todayMood?.mood_score)?.label}
            </p>
          </div>
          <Check className="h-5 w-5 text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Heart className="h-4 w-4 text-rose-500" />
          Como você está hoje?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          {MOOD_OPTIONS.map((mood) => (
            <motion.button
              key={mood.score}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedScore(mood.score)}
              className={`text-3xl p-2 rounded-full transition-all ${
                selectedScore === mood.score 
                  ? 'bg-primary/20 ring-2 ring-primary' 
                  : 'hover:bg-muted'
              }`}
            >
              {mood.emoji}
            </motion.button>
          ))}
        </div>

        <AnimatePresence>
          {selectedScore && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <p className="text-sm text-muted-foreground">
                O que está influenciando seu humor? (opcional)
              </p>
              <div className="flex flex-wrap gap-2">
                {MOOD_FACTORS.map((factor) => (
                  <Badge
                    key={factor.id}
                    variant={selectedFactors.includes(factor.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleFactor(factor.id)}
                  >
                    {factor.icon} {factor.label}
                  </Badge>
                ))}
              </div>

              <Textarea
                placeholder="Alguma observação? (opcional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="resize-none"
                rows={2}
              />

              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="w-full"
              >
                Registrar Humor +10 XP
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
