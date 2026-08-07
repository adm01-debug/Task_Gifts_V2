import { memo, useRef, useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/hooks/useHaptics";

interface SwipeAction {
  icon: React.ReactNode;
  label: string;
  color: string;
  textColor?: string;
  onAction: () => void;
}

interface SwipeableListItemProps {
  children: React.ReactNode;
  className?: string;
  /** Left swipe action (revealed when swiping right) */
  leftAction?: SwipeAction;
  /** Right swipe action (revealed when swiping left) */
  rightAction?: SwipeAction;
  /** Swipe threshold to trigger action (default: 100) */
  threshold?: number;
  /** Whether to auto-close after action */
  autoClose?: boolean;
  /** Disable swipe */
  disabled?: boolean;
}

/**
 * SwipeableListItem - List item with swipe actions
 * 
 * Features:
 * - Swipe left/right to reveal actions
 * - Haptic feedback
 * - Auto-snap back or execute action
 * - Smooth animations
 */
export const SwipeableListItem = memo(function SwipeableListItem({
  children,
  className,
  leftAction,
  rightAction,
  threshold = 100,
  autoClose = true,
  disabled = false,
}: SwipeableListItemProps) {
  const x = useMotionValue(0);
  const haptic = useHapticFeedback();
  const [isDragging, setIsDragging] = useState(false);
  const hasTriggeredHaptic = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Transform for action backgrounds
  const leftBgOpacity = useTransform(x, [0, threshold], [0, 1]);
  const rightBgOpacity = useTransform(x, [-threshold, 0], [1, 0]);
  
  // Scale for action icons
  const leftIconScale = useTransform(x, [0, threshold * 0.5, threshold], [0.5, 0.8, 1]);
  const rightIconScale = useTransform(x, [-threshold, -threshold * 0.5, 0], [1, 0.8, 0.5]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    hasTriggeredHaptic.current = false;
  }, []);

  const handleDrag = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const currentX = info.offset.x;
    
    // Trigger haptic at threshold
    if (!hasTriggeredHaptic.current) {
      if ((leftAction && currentX > threshold) || (rightAction && currentX < -threshold)) {
        haptic.buttonPress();
        hasTriggeredHaptic.current = true;
      }
    }
  }, [leftAction, rightAction, threshold, haptic]);

  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const currentX = info.offset.x;

    if (leftAction && currentX > threshold) {
      haptic.trigger("success");
      leftAction.onAction();
    } else if (rightAction && currentX < -threshold) {
      haptic.trigger("success");
      rightAction.onAction();
    }

    hasTriggeredHaptic.current = false;
  }, [leftAction, rightAction, threshold, haptic]);

  if (disabled || (!leftAction && !rightAction)) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)}>
      {/* Left action background */}
      {leftAction && (
        <motion.div
          className="absolute inset-y-0 left-0 flex items-center justify-start pl-4"
          style={{
            opacity: leftBgOpacity,
            backgroundColor: leftAction.color,
            width: threshold + 20,
          }}
        >
          <motion.div
            style={{ scale: leftIconScale }}
            className={cn(
              "flex flex-col items-center gap-1",
              leftAction.textColor || "text-white"
            )}
          >
            {leftAction.icon}
            <span className="text-xs font-medium">{leftAction.label}</span>
          </motion.div>
        </motion.div>
      )}

      {/* Right action background */}
      {rightAction && (
        <motion.div
          className="absolute inset-y-0 right-0 flex items-center justify-end pr-4"
          style={{
            opacity: rightBgOpacity,
            backgroundColor: rightAction.color,
            width: threshold + 20,
          }}
        >
          <motion.div
            style={{ scale: rightIconScale }}
            className={cn(
              "flex flex-col items-center gap-1",
              rightAction.textColor || "text-white"
            )}
          >
            {rightAction.icon}
            <span className="text-xs font-medium">{rightAction.label}</span>
          </motion.div>
        </motion.div>
      )}

      {/* Swipeable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: rightAction ? -threshold - 20 : 0, right: leftAction ? threshold + 20 : 0 }}
        dragElastic={0.1}
        style={{ x }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className={cn(
          "relative z-10 bg-background touch-pan-y",
          isDragging && "cursor-grabbing"
        )}
      >
        {children}
      </motion.div>
    </div>
  );
});
