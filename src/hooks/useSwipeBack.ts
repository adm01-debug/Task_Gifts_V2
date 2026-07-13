import { useCallback, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useHapticFeedback } from "@/hooks/useHaptics";

interface SwipeBackOptions {
  /** Minimum horizontal distance to trigger navigation (default: 80) */
  threshold?: number;
  /** Maximum vertical distance allowed (default: 100) */
  maxVertical?: number;
  /** Edge width from left where swipe can start (default: 30) */
  edgeWidth?: number;
  /** Callback when navigation is triggered */
  onNavigate?: () => void;
  /** Disable the gesture */
  disabled?: boolean;
}

interface SwipeState {
  startX: number;
  startY: number;
  currentX: number;
  isSwiping: boolean;
  progress: number;
}

/**
 * useSwipeBack - iOS-like swipe back gesture for mobile navigation
 * 
 * Features:
 * - Edge-triggered (starts from left edge only)
 * - Haptic feedback on trigger
 * - Progress indicator for visual feedback
 * - Respects vertical scrolling
 */
export function useSwipeBack({
  threshold = 80,
  maxVertical = 100,
  edgeWidth = 30,
  onNavigate,
  disabled = false,
}: SwipeBackOptions = {}) {
  const navigate = useNavigate();
  const haptic = useHapticFeedback();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [swipeState, setSwipeState] = useState<SwipeState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    isSwiping: false,
    progress: 0,
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled) return;
    
    const touch = e.touches[0];
    
    // Only start if touch begins near left edge
    if (touch.clientX > edgeWidth) return;
    
    setSwipeState({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      isSwiping: true,
      progress: 0,
    });
  }, [disabled, edgeWidth]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!swipeState.isSwiping) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeState.startX;
    const deltaY = Math.abs(touch.clientY - swipeState.startY);
    
    // Cancel if vertical movement is too large (user is scrolling)
    if (deltaY > maxVertical) {
      setSwipeState(prev => ({ ...prev, isSwiping: false, progress: 0 }));
      return;
    }
    
    // Only track positive (right) swipes
    if (deltaX < 0) {
      setSwipeState(prev => ({ ...prev, isSwiping: false, progress: 0 }));
      return;
    }
    
    const progress = Math.min(deltaX / threshold, 1);
    
    setSwipeState(prev => ({
      ...prev,
      currentX: touch.clientX,
      progress,
    }));
    
    // Haptic feedback when threshold is reached
    if (progress >= 1 && swipeState.progress < 1) {
      haptic.trigger("selection");
    }
  }, [swipeState.isSwiping, swipeState.startX, swipeState.startY, swipeState.progress, threshold, maxVertical, haptic]);

  const handleTouchEnd = useCallback(() => {
    if (!swipeState.isSwiping) return;
    
    const shouldNavigate = swipeState.progress >= 1;
    
    if (shouldNavigate) {
      haptic.trigger("success");
      onNavigate?.();
      navigate(-1);
    }
    
    setSwipeState({
      startX: 0,
      startY: 0,
      currentX: 0,
      isSwiping: false,
      progress: 0,
    });
  }, [swipeState.isSwiping, swipeState.progress, navigate, haptic, onNavigate]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || disabled) return;
    
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("touchcancel", handleTouchEnd);
    
    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, disabled]);

  return {
    containerRef,
    isSwiping: swipeState.isSwiping,
    progress: swipeState.progress,
    swipeDistance: swipeState.currentX - swipeState.startX,
  };
}
