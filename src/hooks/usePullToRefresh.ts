 import { useState, useEffect, useCallback, useRef } from "react";
 
 interface PullToRefreshOptions {
   onRefresh: () => Promise<void>;
   threshold?: number;
   disabled?: boolean;
 }
 
 export function usePullToRefresh({
   onRefresh,
   threshold = 80,
   disabled = false,
 }: PullToRefreshOptions) {
   const [pullDistance, setPullDistance] = useState(0);
   const [isRefreshing, setIsRefreshing] = useState(false);
   const startY = useRef(0);
   const containerRef = useRef<HTMLDivElement>(null);
 
   const handleTouchStart = useCallback((e: TouchEvent) => {
     if (disabled || isRefreshing || window.scrollY > 0) return;
     startY.current = e.touches[0].clientY;
   }, [disabled, isRefreshing]);
 
   const handleTouchMove = useCallback((e: TouchEvent) => {
     if (disabled || isRefreshing || startY.current === 0) return;
     
     const y = e.touches[0].clientY;
     const distance = y - startY.current;
 
     if (distance > 0 && window.scrollY === 0) {
       // Apply resistance
       const dampedDistance = Math.min(distance * 0.4, threshold + 20);
       setPullDistance(dampedDistance);
       
       if (dampedDistance > threshold && e.cancelable) {
         e.preventDefault();
       }
     }
   }, [disabled, isRefreshing, threshold]);
 
   const handleTouchEnd = useCallback(async () => {
     if (disabled || isRefreshing || startY.current === 0) return;
 
     if (pullDistance >= threshold) {
       setIsRefreshing(true);
       setPullDistance(threshold);
       
       try {
         await onRefresh();
       } finally {
         setIsRefreshing(false);
         setPullDistance(0);
       }
     } else {
       setPullDistance(0);
     }
     
     startY.current = 0;
   }, [disabled, isRefreshing, pullDistance, threshold, onRefresh]);
 
   useEffect(() => {
     const el = containerRef.current;
     if (!el) return;
 
     el.addEventListener("touchstart", handleTouchStart, { passive: true });
     el.addEventListener("touchmove", handleTouchMove, { passive: false });
     el.addEventListener("touchend", handleTouchEnd);
 
     return () => {
       el.removeEventListener("touchstart", handleTouchStart);
       el.removeEventListener("touchmove", handleTouchMove);
       el.removeEventListener("touchend", handleTouchEnd);
     };
   }, [handleTouchStart, handleTouchMove, handleTouchEnd]);
 
   return {
     pullDistance,
     isRefreshing,
     containerRef,
     progress: Math.min(pullDistance / threshold, 1),
   };
 }
