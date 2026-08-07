import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  content: string;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  iconClassName?: string;
}

export function HelpTooltip({
  content,
  side = "top",
  className,
  iconClassName,
}: HelpTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-full",
              "text-muted-foreground hover:text-foreground transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              className
            )}
          >
            <HelpCircle className={cn("w-4 h-4", iconClassName)} />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Predefined help texts for common features
export const helpTexts = {
  xp: "XP (Pontos de Experiência) são ganhos ao completar atividades. Acumule XP para subir de nível!",
  coins: "Moedas são usadas para comprar recompensas na loja. Ganhe através de quests e desafios.",
  streak: "Streak representa seus dias consecutivos de atividade. Mantenha a sequência para bônus!",
  level: "Seu nível aumenta conforme ganha XP. Níveis mais altos desbloqueiam itens especiais.",
  combo: "Combo multiplica seu XP quando executa ações consecutivas no mesmo dia.",
  quests: "Quests são tarefas diárias que você pode completar para ganhar recompensas.",
  trails: "Trilhas são caminhos de aprendizado com módulos e certificações.",
  kudos: "Kudos são reconhecimentos que você pode enviar para colegas por bom trabalho.",
  duels: "Duelos são desafios 1v1 contra colegas para ver quem ganha mais XP.",
  ranking: "Ranking mostra sua posição entre todos os colaboradores baseado no XP total.",
};
