import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * useSmartBack - Provides intelligent back navigation
 * Falls back to a default route if there's no browser history
 */
export function useSmartBack(fallbackPath = "/") {
  const navigate = useNavigate();
  const location = useLocation();
  const hasHistory = useRef(false);

  useEffect(() => {
    // After first navigation, we know there's history
    if (location.key !== "default") {
      hasHistory.current = true;
    }
  }, [location.key]);

  const goBack = useCallback(() => {
    if (hasHistory.current && window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  }, [navigate, fallbackPath]);

  return { goBack, canGoBack: hasHistory.current };
}

/**
 * useScrollRestoration - Restores scroll position on back navigation
 */
export function useScrollRestoration() {
  const location = useLocation();
  const scrollPositions = useRef<Map<string, number>>(new Map());

  // Save scroll position before leaving
  useEffect(() => {
    const saveScroll = () => {
      scrollPositions.current.set(location.pathname, window.scrollY);
    };

    window.addEventListener("beforeunload", saveScroll);
    
    return () => {
      saveScroll();
      window.removeEventListener("beforeunload", saveScroll);
    };
  }, [location.pathname]);

  // Restore scroll position on navigation
  useEffect(() => {
    const savedPosition = scrollPositions.current.get(location.pathname);
    if (savedPosition !== undefined) {
      requestAnimationFrame(() => {
        window.scrollTo(0, savedPosition);
      });
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);
}
