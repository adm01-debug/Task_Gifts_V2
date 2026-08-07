import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * useIsMobile - Detects if viewport is mobile size
 * Returns object with isMobile and isHydrated to prevent layout shift
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

/**
 * useIsMobileWithHydration - Same as useIsMobile but with hydration state
 * Use this when you need to prevent layout shift / FOUC
 */
export function useIsMobileWithHydration() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    setIsHydrated(true);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return { 
    isMobile: !!isMobile, 
    isHydrated 
  };
}
