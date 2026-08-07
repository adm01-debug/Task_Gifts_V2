import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface AuctionCountdownProps {
  endsAt: string;
  className?: string;
}

/** Formata o tempo restante de forma estável, sem depender do relógio do servidor. */
function formatRemaining(ms: number): string {
  if (ms <= 0) return "Encerrado";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

export function AuctionCountdown({ endsAt, className }: AuctionCountdownProps) {
  const target = new Date(endsAt).getTime();
  const [remaining, setRemaining] = useState(() => target - Date.now());

  useEffect(() => {
    // Intervalo limpo no unmount para evitar vazamento de timer.
    const id = window.setInterval(() => setRemaining(target - Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  return (
    <span className={className}>
      <Clock className="mr-1 inline h-3.5 w-3.5" aria-hidden />
      {Number.isFinite(target) ? formatRemaining(remaining) : "—"}
    </span>
  );
}
