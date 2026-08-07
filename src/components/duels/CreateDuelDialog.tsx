import { useState, forwardRef } from "react";
import { motion } from "framer-motion";
import { Clock, Check, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePotentialOpponents, useCreateDuel } from "@/hooks/useDuels";

interface CreateDuelDialogProps {
  userId: string;
  onClose: () => void;
}

export const CreateDuelDialog = forwardRef<HTMLDivElement, CreateDuelDialogProps>(({ userId, onClose }, ref) => {
  const [selectedOpponent, setSelectedOpponent] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [duration, setDuration] = useState(24);

  const { data: opponents, isLoading } = usePotentialOpponents(userId);
  const createDuel = useCreateDuel();

  const handleCreate = () => {
    if (!selectedOpponent) return;
    createDuel.mutate({ challengerId: userId, opponentId: selectedOpponent, durationHours: duration, message: message || undefined }, { onSuccess: onClose });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium mb-2 block">Duração do Duelo</label>
        <div className="grid grid-cols-3 gap-2">
          {[12, 24, 48].map(hours => (
            <Button key={hours} variant={duration === hours ? "default" : "outline"} onClick={() => setDuration(hours)} className="flex items-center gap-2"><Clock className="w-4 h-4" />{hours}h</Button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Mensagem (opcional)</label>
        <Input placeholder="Prepare-se para perder! 😈" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={100} />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Escolha seu Oponente</label>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">Carregando...</div>
          ) : opponents?.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">Nenhum oponente disponível</div>
          ) : (
            opponents?.map(opp => (
              <motion.button key={opp.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setSelectedOpponent(opp.id)}
                className={`w-full p-3 rounded-xl border flex items-center gap-3 text-left transition-all ${selectedOpponent === opp.id ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/50'}`}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-secondary flex items-center justify-center text-sm font-bold">{opp.display_name?.charAt(0).toUpperCase() || "?"}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{opp.display_name || "Jogador"}</p>
                  <p className="text-xs text-muted-foreground">Nível {opp.level} • {opp.xp.toLocaleString()} XP</p>
                </div>
                {selectedOpponent === opp.id && <Check className="w-5 h-5 text-primary" />}
              </motion.button>
            ))
          )}
        </div>
      </div>

      <Button onClick={handleCreate} disabled={!selectedOpponent || createDuel.isPending} className="w-full">
        <Swords className="w-4 h-4 mr-2" />{createDuel.isPending ? "Enviando..." : "Enviar Desafio"}
      </Button>
    </div>
  );
});
CreateDuelDialog.displayName = "CreateDuelDialog";
