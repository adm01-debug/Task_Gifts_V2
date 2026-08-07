import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, Play, Check, RotateCcw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOnboardingTour } from "@/contexts/OnboardingTourContext";
import { cn } from "@/lib/utils";

interface TourLauncherProps {
  className?: string;
  variant?: "floating" | "inline" | "minimal";
}

/**
 * TourLauncher - Button/menu to start available tours
 */
export const TourLauncher = memo(function TourLauncher({
  className,
  variant = "floating",
}: TourLauncherProps) {
  const { availableTours, completedTours, startTour, resetTourProgress, isActive } = useOnboardingTour();
  const [isOpen, setIsOpen] = useState(false);

  const incompleteTours = availableTours.filter((t) => !completedTours.includes(t.id));
  const hasIncompleteTours = incompleteTours.length > 0;

  if (availableTours.length === 0 || isActive) return null;

  if (variant === "minimal") {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn("gap-2", className)}
        onClick={() => incompleteTours[0] && startTour(incompleteTours[0].id)}
        disabled={!hasIncompleteTours}
      >
        <HelpCircle className="h-4 w-4" />
        Iniciar tour
      </Button>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        {variant === "floating" ? (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "fixed bottom-24 right-4 z-50 w-12 h-12 rounded-full",
              "bg-primary text-primary-foreground shadow-lg",
              "flex items-center justify-center",
              "hover:shadow-xl transition-shadow",
              className
            )}
          >
            <HelpCircle className="h-6 w-6" />
            {hasIncompleteTours && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
                {incompleteTours.length}
              </span>
            )}
          </motion.button>
        ) : (
          <Button variant="outline" size="sm" className={cn("gap-2", className)}>
            <HelpCircle className="h-4 w-4" />
            Tours disponíveis
            {hasIncompleteTours && (
              <Badge variant="secondary" className="ml-1">
                {incompleteTours.length}
              </Badge>
            )}
          </Button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center justify-between">
          Tours Guiados
          {completedTours.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => resetTourProgress()}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Resetar
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <AnimatePresence>
          {availableTours.map((tour, index) => {
            const isCompleted = completedTours.includes(tour.id);
            
            return (
              <motion.div
                key={tour.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <DropdownMenuItem
                  onClick={() => {
                    startTour(tour.id);
                    setIsOpen(false);
                  }}
                  className="flex items-start gap-3 p-3 cursor-pointer"
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      isCompleted
                        ? "bg-green-500/10 text-green-500"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{tour.name}</span>
                      {isCompleted && (
                        <Badge variant="secondary" className="text-[10px] px-1.5">
                          Concluído
                        </Badge>
                      )}
                    </div>
                    {tour.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {tour.description}
                      </p>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {tour.steps.length} passos
                    </span>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </DropdownMenuItem>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {availableTours.length === 0 && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Nenhum tour disponível
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
