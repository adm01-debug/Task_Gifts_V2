import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Swords, Check, X, Zap, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DuelWithProfiles } from "@/services/duelsService";
import { formatDistanceToNow, differenceInSeconds } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DuelCardProps {
  duel: DuelWithProfiles;
  userId: string;
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  pendingAction?: { duelId: string; type: 'accept' | 'decline' | 'cancel' } | null;
}

export const DuelCard = forwardRef<HTMLDivElement, DuelCardProps>(({ duel, userId, onAccept, onDecline, onCancel, pendingAction }, ref) => {
  const isThisDuelPending = pendingAction?.duelId === duel.id;
  const isAccepting = isThisDuelPending && pendingAction?.type === 'accept';
  const isDeclining = isThisDuelPending && pendingAction?.type === 'decline';
  const isCancelling = isThisDuelPending && pendingAction?.type === 'cancel';
  const isChallenger = duel.challenger_id === userId;
  const opponent = isChallenger ? duel.opponent : duel.challenger;
  const myXpGained = isChallenger ? duel.challenger_xp_gained : duel.opponent_xp_gained;
  const opponentXpGained = isChallenger ? duel.opponent_xp_gained : duel.challenger_xp_gained;

  const getTimeRemaining = () => {
    if (!duel.ends_at) return null;
    const remaining = differenceInSeconds(new Date(duel.ends_at), new Date());
    if (remaining <= 0) return "Encerrado";
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = () => {
    switch (duel.status) {
      case 'pending': return 'bg-warning/20 text-warning border-warning/30';
      case 'accepted': return 'bg-primary/20 text-primary border-primary/30';
      case 'active': return 'bg-success/20 text-success border-success/30';
      case 'completed': return 'bg-secondary/20 text-secondary border-secondary/30';
      case 'declined': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'cancelled': return 'bg-muted text-muted-foreground border-muted';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = () => {
    switch (duel.status) {
      case 'pending': return isChallenger ? 'Aguardando' : 'Desafio Recebido';
      case 'accepted': return 'Iniciando...';
      case 'active': return 'Em Andamento';
      case 'completed': return duel.winner_id === userId ? 'Vitória!' : duel.winner_id ? 'Derrota' : 'Empate';
      case 'declined': return 'Recusado';
      case 'cancelled': return 'Cancelado';
      default: return duel.status;
    }
  };

  const isWinner = duel.status === 'completed' && duel.winner_id === userId;

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className={`relative p-5 rounded-2xl border bg-card overflow-hidden ${isWinner ? 'border-gold/50 shadow-[0_0_30px_hsl(var(--gold)/0.2)]' : 'border-border'}`}>
      {isWinner && <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-transparent pointer-events-none" />}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor()}`}>{getStatusLabel()}</div>
          {duel.status === 'active' && <div className="flex items-center gap-1 text-sm text-muted-foreground"><Timer className="w-4 h-4" /><span>{getTimeRemaining()}</span></div>}
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl font-bold mb-2">
              {isChallenger ? duel.challenger?.display_name?.charAt(0).toUpperCase() : duel.opponent?.display_name?.charAt(0).toUpperCase()}
            </div>
            <p className="text-sm font-medium truncate">Você</p>
            {(duel.status === 'active' || duel.status === 'completed') && <p className="text-lg font-bold text-xp">+{myXpGained} XP</p>}
          </div>
          <div className="relative">
            <motion.div animate={duel.status === 'active' ? { scale: [1, 1.1, 1] } : {}} transition={{ repeat: Infinity, duration: 2 }} className="w-12 h-12 rounded-full bg-gradient-to-br from-destructive to-warning flex items-center justify-center">
              <Swords className="w-6 h-6 text-white" />
            </motion.div>
          </div>
          <div className="flex-1 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-accent to-secondary flex items-center justify-center text-xl font-bold mb-2">{opponent?.display_name?.charAt(0).toUpperCase() || "?"}</div>
            <p className="text-sm font-medium truncate">{opponent?.display_name || "Oponente"}</p>
            {(duel.status === 'active' || duel.status === 'completed') ? <p className="text-lg font-bold text-xp">+{opponentXpGained} XP</p> : <p className="text-xs text-muted-foreground">Nível {opponent?.level || 1}</p>}
          </div>
        </div>

        {duel.status === 'active' && (
          <div className="mb-4">
            <div className="h-3 rounded-full bg-muted overflow-hidden flex">
              <motion.div initial={{ width: "50%" }} animate={{ width: `${myXpGained + opponentXpGained > 0 ? (myXpGained / (myXpGained + opponentXpGained)) * 100 : 50}%` }} className="h-full bg-gradient-to-r from-primary to-secondary" />
              <motion.div initial={{ width: "50%" }} animate={{ width: `${myXpGained + opponentXpGained > 0 ? (opponentXpGained / (myXpGained + opponentXpGained)) * 100 : 50}%` }} className="h-full bg-gradient-to-r from-accent to-warning" />
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1"><Zap className="w-4 h-4 text-xp" /><span className="font-semibold">{duel.xp_reward} XP</span></div>
          <div className="flex items-center gap-1"><span className="text-gold">🪙</span><span className="font-semibold">{duel.coin_reward}</span></div>
        </div>

        {duel.message && <p className="text-sm text-muted-foreground text-center italic mb-4">"{duel.message}"</p>}

        {duel.status === 'pending' && !isChallenger && onAccept && onDecline && (
          <div className="flex gap-2">
            <Button onClick={onAccept} className="flex-1 bg-success hover:bg-success/90" disabled={isAccepting || isDeclining}>
              {isAccepting ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              {isAccepting ? "Aceitando..." : "Aceitar"}
            </Button>
            <Button onClick={onDecline} variant="outline" className="flex-1 border-destructive text-destructive hover:bg-destructive/10" disabled={isAccepting || isDeclining}><X className="w-4 h-4 mr-2" />Recusar</Button>
          </div>
        )}

        {duel.status === 'pending' && isChallenger && onCancel && (
          <Button onClick={onCancel} variant="outline" className="w-full" disabled={isCancelling}>{isCancelling ? "Cancelando..." : "Cancelar Desafio"}</Button>
        )}

        <p className="text-xs text-muted-foreground text-center mt-3">{formatDistanceToNow(new Date(duel.created_at), { addSuffix: true, locale: ptBR })}</p>
      </div>
    </motion.div>
  );
});
DuelCard.displayName = "DuelCard";
