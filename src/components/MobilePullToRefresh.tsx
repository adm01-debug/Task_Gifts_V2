 import { ReactNode } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import { Loader2, RefreshCw } from "lucide-react";
 import { usePullToRefresh } from "@/hooks/usePullToRefresh";
 import { cn } from "@/lib/utils";
 
 interface MobilePullToRefreshProps {
   children: ReactNode;
   onRefresh: () => Promise<void>;
   disabled?: boolean;
   className?: string;
 }
 
 export function MobilePullToRefresh({
   children,
   onRefresh,
   disabled = false,
   className,
 }: MobilePullToRefreshProps) {
   const { pullDistance, isRefreshing, containerRef, progress } = usePullToRefresh({
     onRefresh,
     disabled,
   });
 
   return (
     <div 
       ref={containerRef} 
       className={cn("relative overflow-hidden", className)}
     >
       <div 
         className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-50"
         style={{ 
           transform: `translateY(${pullDistance - 40}px)`,
           opacity: progress
         }}
       >
         <div className={cn(
           "bg-background shadow-lg border border-border/50 rounded-full p-2 flex items-center justify-center transition-transform",
           isRefreshing && "animate-spin"
         )}>
           {isRefreshing ? (
             <Loader2 className="w-5 h-5 text-primary" />
           ) : (
             <RefreshCw 
               className="w-5 h-5 text-primary" 
               style={{ transform: `rotate(${progress * 360}deg)` }}
             />
           )}
         </div>
       </div>
 
       <motion.div
         animate={{ y: pullDistance }}
         transition={isRefreshing ? { type: "spring", stiffness: 300, damping: 30 } : { duration: 0 }}
       >
         {children}
       </motion.div>
     </div>
   );
 }
