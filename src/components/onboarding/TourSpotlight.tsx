import { useEffect, useState, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboardingTour, TourStep } from "@/contexts/OnboardingTourContext";
import { cn } from "@/lib/utils";

interface SpotlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TooltipPosition {
  top: number;
  left: number;
  transformOrigin: string;
}

/**
 * TourSpotlight - Renders the spotlight overlay and tooltip for guided tours
 */
export const TourSpotlight = memo(function TourSpotlight() {
  const { activeTour, currentStep, isActive, nextStep, prevStep, skipTour, endTour } = useOnboardingTour();
  const [spotlightPos, setSpotlightPos] = useState<SpotlightPosition | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const step = activeTour?.steps[currentStep];
  const isLastStep = activeTour ? currentStep === activeTour.steps.length - 1 : false;
  const isFirstStep = currentStep === 0;

  // Calculate positions based on target element
  const calculatePositions = useCallback((step: TourStep) => {
    const target = document.querySelector(step.target);
    
    if (!target) {
      // Center spotlight if target not found
      setSpotlightPos(null);
      setTooltipPos({
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
        transformOrigin: "center center",
      });
      return;
    }

    const rect = target.getBoundingClientRect();
    const padding = step.spotlightPadding ?? 8;
    
    setSpotlightPos({
      top: rect.top - padding + window.scrollY,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    // Calculate tooltip position based on placement
    const placement = step.placement ?? "bottom";
    const tooltipWidth = 320;
    const tooltipHeight = 180;
    const gap = 16;

    let tooltipTop: number;
    let tooltipLeft: number;
    let transformOrigin: string;

    switch (placement) {
      case "top":
        tooltipTop = rect.top - tooltipHeight - gap + window.scrollY;
        tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
        transformOrigin = "bottom center";
        break;
      case "left":
        tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
        tooltipLeft = rect.left - tooltipWidth - gap;
        transformOrigin = "right center";
        break;
      case "right":
        tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
        tooltipLeft = rect.right + gap;
        transformOrigin = "left center";
        break;
      case "center":
        tooltipTop = window.innerHeight / 2 - tooltipHeight / 2;
        tooltipLeft = window.innerWidth / 2 - tooltipWidth / 2;
        transformOrigin = "center center";
        break;
      default: // bottom
        tooltipTop = rect.bottom + gap + window.scrollY;
        tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
        transformOrigin = "top center";
    }

    // Clamp to viewport
    tooltipLeft = Math.max(16, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - 16));
    tooltipTop = Math.max(16, tooltipTop);

    setTooltipPos({ top: tooltipTop, left: tooltipLeft, transformOrigin });
  }, []);

  // Update positions when step changes
  useEffect(() => {
    if (!step) {
      setIsVisible(false);
      return;
    }

    // Small delay for mount animation
    const showTimer = setTimeout(() => {
      calculatePositions(step);
      setIsVisible(true);
    }, 100);

    // Scroll target into view
    const target = document.querySelector(step.target);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    // Recalculate on resize
    const handleResize = () => calculatePositions(step);
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(showTimer);
      window.removeEventListener("resize", handleResize);
    };
  }, [step, calculatePositions]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          skipTour();
          break;
        case "ArrowRight":
        case "Enter":
          nextStep();
          break;
        case "ArrowLeft":
          prevStep();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isActive, nextStep, prevStep, skipTour]);

  if (!isActive || !step) return null;

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          key="tour-layer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] pointer-events-none"
        >
          {/* Overlay with spotlight cutout */}
          <div
            className="absolute inset-0 pointer-events-auto"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              skipTour();
            }}
          >
            <svg className="w-full h-full pointer-events-none" style={{ position: "absolute", top: 0, left: 0 }}>
              <defs>
                <mask id="spotlight-mask">
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  {spotlightPos && (
                    <motion.rect
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      x={spotlightPos.left}
                      y={spotlightPos.top}
                      width={spotlightPos.width}
                      height={spotlightPos.height}
                      rx="8"
                      fill="black"
                    />
                  )}
                </mask>
              </defs>
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="rgba(0, 0, 0, 0.75)"
                mask="url(#spotlight-mask)"
              />
            </svg>

            {/* Spotlight border glow */}
            {spotlightPos && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute rounded-lg pointer-events-none"
                style={{
                  top: spotlightPos.top,
                  left: spotlightPos.left,
                  width: spotlightPos.width,
                  height: spotlightPos.height,
                  boxShadow: "0 0 0 2px hsl(var(--primary)), 0 0 20px hsl(var(--primary) / 0.5)",
                }}
              />
            )}
          </div>

          {/* Tooltip */}
          {tooltipPos && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="fixed z-[9999] w-80 bg-card border border-border rounded-xl shadow-2xl p-4 pointer-events-auto"
              style={{
                top: tooltipPos.top,
                left: tooltipPos.left,
                transformOrigin: tooltipPos.transformOrigin,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    Passo {currentStep + 1} de {activeTour?.steps.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -mt-1 -mr-1"
                  onClick={skipTour}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <p className="text-sm text-muted-foreground mb-4">{step.content}</p>

              {/* Progress dots */}
              <div className="flex justify-center gap-1.5 mb-4">
                {activeTour?.steps.map((_, i) => (
                  <motion.div
                    key={i}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      i === currentStep
                        ? "bg-primary"
                        : i < currentStep
                        ? "bg-primary/50"
                        : "bg-muted"
                    )}
                    animate={i === currentStep ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipTour}
                  className="text-muted-foreground"
                >
                  <SkipForward className="h-4 w-4 mr-1" />
                  Pular tour
                </Button>

                <div className="flex gap-2">
                  {!isFirstStep && (
                    <Button variant="outline" size="sm" onClick={prevStep}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                  )}
                  <Button size="sm" onClick={isLastStep ? endTour : nextStep}>
                    {isLastStep ? "Concluir" : "Próximo"}
                    {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
                  </Button>
                </div>
              </div>

              {/* Custom action */}
              {step.action && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full mt-3"
                  onClick={step.action.onClick}
                >
                  {step.action.label}
                </Button>
              )}
            </motion.div>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
});
