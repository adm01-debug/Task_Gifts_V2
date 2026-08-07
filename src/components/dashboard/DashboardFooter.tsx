import { memo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Shield, Wifi, Cpu, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CommandStatusBar - High-end status bar for the dashboard
 * Replaces the simple footer with a tactical command center feel
 */
export const DashboardFooter = memo(function DashboardFooter() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <footer 
      className="sticky bottom-0 z-30 w-full px-4 md:px-8 py-2.5 bg-background/40 backdrop-blur-xl border-t border-border/50 hidden md:block"
      role="contentinfo"
    >
      <div className="flex items-center justify-between gap-6 max-w-[1800px] mx-auto">
        {/* System Stats */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-success animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Systems Online</span>
          </div>
          <div className="h-4 w-px bg-border/40" />
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Security: Max</span>
          </div>
          <div className="h-4 w-px bg-border/40" />
          <div className="flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5 text-secondary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Latency: 12ms</span>
          </div>
        </div>

        {/* Center Tagline */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[11px] font-bold text-muted-foreground/60 tracking-[0.3em] uppercase hidden lg:block"
        >
          Operando em <span className="text-primary">Modo Elite</span> • Rumo ao 10/10
        </motion.p>

        {/* Tactical Info */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 group cursor-help">
            <Cpu className="w-3.5 h-3.5 text-accent transition-transform group-hover:rotate-45" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Engine v4.2.0</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-1 bg-primary/5 rounded-lg border border-primary/20">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-black tracking-tighter text-primary font-mono tabular-nums">
              {formattedTime}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
});
