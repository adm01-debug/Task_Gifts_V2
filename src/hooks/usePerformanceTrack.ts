import { useEffect, useRef } from "react";

/**
 * usePerformanceTrack - Hook to measure and log component render performance
 * Useful for validating Skeleton efficiency and identifying slow renders
 */
export function usePerformanceTrack(componentName: string) {
  const mountTime = useRef(performance.now());
  const renderCount = useRef(0);

  useEffect(() => {
    const endTime = performance.now();
    const duration = endTime - mountTime.current;
    
    // Only log in development to keep production logs clean
    if (import.meta.env.DEV) {
      console.groupCollapsed(`⚡ [Performance] ${componentName}`);
      console.log(`Mount time: ${duration.toFixed(2)}ms`);
      console.log(`Timestamp: ${new Date().toISOString()}`);
      console.groupEnd();
    }
    
    return () => {
      if (import.meta.env.DEV) {
        const lifetime = performance.now() - mountTime.current;
        console.log(`⌛ [Performance] ${componentName} unmounted after ${lifetime.toFixed(2)}ms`);
      }
    };
  }, [componentName]);

  // Track re-renders
  useEffect(() => {
    renderCount.current += 1;
    if (import.meta.env.DEV && renderCount.current > 1) {
      console.debug(`🔄 [Performance] ${componentName} re-rendered (${renderCount.current})`);
    }
  });
}
