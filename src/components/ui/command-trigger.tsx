import { motion } from "framer-motion";
import { Command, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CommandTriggerProps {
  onClick?: () => void;
  className?: string;
  variant?: "default" | "compact" | "pill";
}

/**
 * CommandTrigger - Visual button to open Command Palette (Cmd+K)
 * Shows keyboard shortcut and animates on hover
 */
export function CommandTrigger({ 
  onClick, 
  className,
  variant = "default" 
}: CommandTriggerProps) {
  const [isMac, setIsMac] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
  }, []);

  const handleClick = () => {
    // Dispatch keyboard event to trigger Command Palette
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: isMac,
      ctrlKey: !isMac,
      bubbles: true,
    });
    document.dispatchEvent(event);
    onClick?.();
  };

  if (variant === "compact") {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
          "bg-muted/60 hover:bg-muted border border-border/50",
          "transition-all duration-200",
          className
        )}
        aria-label="Abrir paleta de comandos"
      >
        <Search className="w-4 h-4 text-muted-foreground" />
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-background/80 rounded border border-border/50">
          {isMac ? "⌘" : "Ctrl"}K
        </kbd>
      </motion.button>
    );
  }

  if (variant === "pill") {
    return (
      <motion.button
        whileHover={{ scale: 1.02, boxShadow: "0 4px 20px -4px hsl(var(--primary) / 0.3)" }}
        whileTap={{ scale: 0.98 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={handleClick}
        className={cn(
          "relative flex items-center gap-2 px-4 py-2 rounded-full",
          "bg-gradient-to-r from-primary/10 to-accent/10",
          "hover:from-primary/20 hover:to-accent/20",
          "border border-primary/20 hover:border-primary/40",
          "transition-all duration-300",
          className
        )}
        aria-label="Abrir paleta de comandos"
      >
        <motion.div
          animate={{ rotate: isHovered ? 360 : 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Command className="w-4 h-4 text-primary" />
        </motion.div>
        <span className="text-sm font-medium text-foreground/80">
          Busca rápida
        </span>
        <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-background/80 border border-border/50">
          <kbd className="text-[10px] font-mono text-muted-foreground">
            {isMac ? "⌘" : "Ctrl"}
          </kbd>
          <kbd className="text-[10px] font-mono text-muted-foreground">K</kbd>
        </div>

        {/* Animated glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 blur-xl -z-10"
          animate={{ 
            opacity: isHovered ? 0.6 : 0,
            scale: isHovered ? 1.1 : 1 
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.button>
    );
  }

  // Default variant
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleClick}
      className={cn(
        "relative flex items-center gap-3 w-full max-w-xs px-4 py-2.5 rounded-xl",
        "bg-muted/50 hover:bg-muted",
        "border border-border/50 hover:border-border",
        "transition-all duration-200",
        "group",
        className
      )}
      aria-label="Abrir paleta de comandos"
    >
      <Search className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      <span className="flex-1 text-left text-sm text-muted-foreground group-hover:text-foreground/70 transition-colors">
        Buscar...
      </span>
      <div className="flex items-center gap-1">
        <kbd className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-mono text-muted-foreground bg-background rounded border border-border shadow-sm">
          {isMac ? "⌘" : "Ctrl"}
        </kbd>
        <kbd className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-mono text-muted-foreground bg-background rounded border border-border shadow-sm">
          K
        </kbd>
      </div>

      {/* Pulse animation on hover */}
      <motion.div
        className="absolute inset-0 rounded-xl border-2 border-primary/30"
        initial={{ opacity: 0, scale: 1 }}
        animate={{ 
          opacity: isHovered ? [0, 0.5, 0] : 0,
          scale: isHovered ? [1, 1.02, 1] : 1 
        }}
        transition={{ 
          duration: 1.5,
          repeat: isHovered ? Infinity : 0,
          ease: "easeInOut"
        }}
      />
    </motion.button>
  );
}

/**
 * FloatingCommandHint - Floating hint that appears occasionally
 */
export function FloatingCommandHint() {
  const [visible, setVisible] = useState(false);
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
    
    // Show hint after 30 seconds, then hide after 5 seconds
    const showTimer = setTimeout(() => setVisible(true), 30000);
    
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (visible) {
      const hideTimer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(hideTimer);
    }
  }, [visible]);

  const handleClick = () => {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: isMac,
      ctrlKey: !isMac,
      bubbles: true,
    });
    document.dispatchEvent(event);
    setVisible(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, x: 20 }}
      animate={{ 
        opacity: visible ? 1 : 0,
        y: visible ? 0 : 20,
        x: 0,
        pointerEvents: visible ? "auto" : "none"
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="fixed bottom-24 right-6 z-50"
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-2xl"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Command className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium">Dica: Use atalhos!</p>
          <p className="text-xs text-muted-foreground">
            Pressione <kbd className="px-1 bg-muted rounded">{isMac ? "⌘" : "Ctrl"}+K</kbd> para busca rápida
          </p>
        </div>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            setVisible(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              setVisible(false);
            }
          }}
          className="p-1 hover:bg-muted rounded-full text-muted-foreground cursor-pointer"
          aria-label="Fechar"
        >
          ×
        </span>
      </motion.button>
    </motion.div>
  );
}
