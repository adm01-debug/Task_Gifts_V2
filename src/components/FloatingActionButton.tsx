import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface FABAction {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  color?: "primary" | "secondary" | "accent" | "success" | "warning";
}

interface FloatingActionButtonProps {
  actions: FABAction[];
  position?: "bottom-right" | "bottom-left" | "bottom-center";
  showLabels?: boolean;
}

const colorClasses = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
  accent: "bg-accent text-accent-foreground hover:bg-accent/90",
  success: "bg-success text-success-foreground hover:bg-success/90",
  warning: "bg-warning text-warning-foreground hover:bg-warning/90",
};

const positionClasses = {
  "bottom-right": "bottom-20 right-4",
  "bottom-left": "bottom-20 left-4",
  "bottom-center": "bottom-20 left-1/2 -translate-x-1/2",
};

export function FloatingActionButton({
  actions,
  position = "bottom-right",
  showLabels = true,
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleActionClick = useCallback((action: FABAction) => {
    action.onClick();
    setIsOpen(false);
  }, [setIsOpen]);

  const closeMenu = useCallback(() => setIsOpen(false), [setIsOpen]);
  const toggleMenu = useCallback(() => setIsOpen(prev => !prev), [setIsOpen]);

  // Only show on mobile
  if (!isMobile) return null;

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
            onClick={closeMenu}
          />
        )}
      </AnimatePresence>

      {/* FAB Container */}
      <div className={cn("fixed z-50", positionClasses[position])}>
        {/* Action Buttons */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-16 right-0 flex flex-col-reverse gap-3 items-end"
            >
              {actions.map((action, index) => {
                const Icon = action.icon;
                const color = action.color || "secondary";

                  return (
                    <motion.button
                      key={action.label}
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0, 
                        scale: 1,
                        transition: { delay: index * 0.05 }
                      }}
                      exit={{ 
                        opacity: 0, 
                        y: 10, 
                        scale: 0.8,
                        transition: { delay: (actions.length - index) * 0.03 }
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleActionClick(action)}
                      className="flex items-center gap-3"
                      aria-label={action.label}
                  >
                    {showLabels && (
                      <span className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm font-medium shadow-lg">
                        {action.label}
                      </span>
                    )}
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center shadow-lg",
                        colorClasses[color]
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleMenu}
          aria-label={isOpen ? "Fechar menu de ações" : "Abrir menu de ações"}
          aria-expanded={isOpen}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center shadow-xl",
            "bg-primary text-primary-foreground",
            "transition-transform duration-200"
          )}
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </motion.div>
        </motion.button>
      </div>
    </>
  );
}