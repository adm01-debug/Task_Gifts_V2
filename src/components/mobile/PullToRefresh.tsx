 import { useState, ReactNode, useRef } from "react";
 import { motion } from "framer-motion";
 import { Loader2, RefreshCw } from "lucide-react";
 import { useHapticFeedback } from "@/hooks/useHaptics";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  disabled?: boolean;
}

export const PullToRefresh = ({ onRefresh, children, disabled }: PullToRefreshProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
   const startY = useRef(0);
   const haptic = useHapticFeedback();
  const MAX_PULL = 80;
  const THRESHOLD = 60;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing || window.scrollY > 0) return;
    startY.current = e.touches[0].pageY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || isRefreshing || window.scrollY > 0) return;
    
    const currentY = e.touches[0].pageY;
     const diff = currentY - startY.current;
     
     if (diff > 0) {
       // Add some resistance
       const pull = Math.min(MAX_PULL, diff * 0.4);
       
       if (pull >= THRESHOLD && pullDistance < THRESHOLD) {
         haptic.trigger("selection");
       }
       
       setPullDistance(pull);
       
       if (pull > 5 && e.cancelable) {
         e.preventDefault();
       }
     }
  };

  const handleTouchEnd = async () => {
     if (pullDistance >= THRESHOLD) {
       setIsRefreshing(true);
       setPullDistance(THRESHOLD);
       haptic.trigger("light");
       try {
         await onRefresh();
         haptic.trigger("success");
       } catch (error) {
         haptic.trigger("error");
       } finally {
         setIsRefreshing(false);
         setPullDistance(0);
       }
     } else {
       setPullDistance(0);
     }
  };

  return (
    <div 
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative overflow-hidden"
    >
      <motion.div
        className="absolute top-0 left-0 right-0 flex justify-center items-center pointer-events-none z-50"
        style={{ height: pullDistance }}
        animate={{ height: pullDistance }}
      >
        <div className="bg-background border shadow-md rounded-full p-2 flex items-center justify-center">
          {isRefreshing ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          ) : (
            <motion.div
              style={{ 
                rotate: pullDistance * 2,
                opacity: pullDistance / THRESHOLD 
              }}
            >
              <RefreshCw className="w-5 h-5 text-primary" />
            </motion.div>
          )}
        </div>
      </motion.div>
      
      <motion.div
        animate={{ y: pullDistance }}
        transition={isRefreshing ? { type: "spring", bounce: 0 } : { type: "tween" }}
      >
        {children}
      </motion.div>
    </div>
  );
};