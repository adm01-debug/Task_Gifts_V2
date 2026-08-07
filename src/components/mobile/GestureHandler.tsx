import { memo, ReactNode, useRef, useCallback } from "react";
import { motion, PanInfo, useDragControls } from "framer-motion";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/hooks/useHaptics";

type GestureDirection = "up" | "down" | "left" | "right";

interface GestureHandlerProps {
  children: ReactNode;
  className?: string;
  /** Callback for swipe gestures */
  onSwipe?: (direction: GestureDirection) => void;
  /** Callback for long press */
  onLongPress?: () => void;
  /** Callback for double tap */
  onDoubleTap?: () => void;
  /** Callback for pinch gesture */
  onPinch?: (scale: number) => void;
  /** Minimum swipe distance to trigger */
  swipeThreshold?: number;
  /** Long press duration in ms */
  longPressDuration?: number;
  /** Enable haptic feedback */
  hapticEnabled?: boolean;
  /** Disable all gestures */
  disabled?: boolean;
}

/**
 * GestureHandler - Universal gesture handler for mobile
 */
export const GestureHandler = memo(function GestureHandler({
  children,
  className,
  onSwipe,
  onLongPress,
  onDoubleTap,
  swipeThreshold = 50,
  longPressDuration = 500,
  hapticEnabled = true,
  disabled = false,
}: GestureHandlerProps) {
  const haptic = useHapticFeedback();
  const dragControls = useDragControls();
  
  const longPressTimer = useRef<NodeJS.Timeout>();
  const lastTap = useRef<number>(0);
  const isLongPressing = useRef(false);

  const triggerHaptic = useCallback((type: "selection" | "success" | "medium") => {
    if (hapticEnabled) {
      haptic.trigger(type);
    }
  }, [haptic, hapticEnabled]);

  const handlePointerDown = useCallback(() => {
    if (disabled || !onLongPress) return;
    
    isLongPressing.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPressing.current = true;
      triggerHaptic("medium");
      onLongPress();
    }, longPressDuration);
  }, [disabled, onLongPress, longPressDuration, triggerHaptic]);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    if (disabled || isLongPressing.current) return;
    
    // Double tap detection
    if (onDoubleTap) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        triggerHaptic("selection");
        onDoubleTap();
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }
    }
  }, [disabled, onDoubleTap, triggerHaptic]);

  const handleDragEnd = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled || !onSwipe) return;
    
    const { offset, velocity } = info;
    const absX = Math.abs(offset.x);
    const absY = Math.abs(offset.y);
    
    // Need minimum distance or velocity to trigger
    const triggered = 
      absX > swipeThreshold || 
      absY > swipeThreshold || 
      Math.abs(velocity.x) > 300 || 
      Math.abs(velocity.y) > 300;
    
    if (!triggered) return;
    
    let direction: GestureDirection;
    
    if (absX > absY) {
      direction = offset.x > 0 ? "right" : "left";
    } else {
      direction = offset.y > 0 ? "down" : "up";
    }
    
    triggerHaptic("selection");
    onSwipe(direction);
  }, [disabled, onSwipe, swipeThreshold, triggerHaptic]);

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn("touch-pan-y", className)}
      drag={onSwipe ? true : false}
      dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
      dragElastic={0.1}
      dragControls={dragControls}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => clearTimeout(longPressTimer.current)}
      onDragEnd={handleDragEnd}
    >
      {children}
    </motion.div>
  );
});

// Specialized gesture hooks
export function useSwipeBack(onBack: () => void, threshold = 50) {
  const handleSwipe = useCallback((direction: GestureDirection) => {
    if (direction === "right") {
      onBack();
    }
  }, [onBack]);
  
  return { onSwipe: handleSwipe, swipeThreshold: threshold };
}
