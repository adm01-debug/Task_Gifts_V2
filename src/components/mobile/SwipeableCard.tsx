import { memo, ReactNode, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Trash2, Check, Archive, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/hooks/useHaptics";

type SwipeAction = "delete" | "complete" | "archive" | "custom";

interface SwipeableCardProps {
  children: ReactNode;
  className?: string;
  /** Threshold in pixels to trigger action */
  threshold?: number;
  /** Enable left swipe actions */
  leftActions?: {
    action: SwipeAction;
    icon?: ReactNode;
    color?: string;
    label?: string;
    onAction: () => void;
  }[];
  /** Enable right swipe actions */
  rightActions?: {
    action: SwipeAction;
    icon?: ReactNode;
    color?: string;
    label?: string;
    onAction: () => void;
  }[];
  /** Disable swipe */
  disabled?: boolean;
  /** Called when swipe starts */
  onSwipeStart?: () => void;
  /** Called when swipe ends */
  onSwipeEnd?: () => void;
}

const defaultIcons: Record<SwipeAction, ReactNode> = {
  delete: <Trash2 className="h-5 w-5" />,
  complete: <Check className="h-5 w-5" />,
  archive: <Archive className="h-5 w-5" />,
  custom: <MoreHorizontal className="h-5 w-5" />,
};

const defaultColors: Record<SwipeAction, string> = {
  delete: "bg-destructive text-destructive-foreground",
  complete: "bg-green-500 text-white",
  archive: "bg-blue-500 text-white",
  custom: "bg-muted text-muted-foreground",
};

/**
 * SwipeableCard - Card with swipe gesture actions (mobile)
 */
export const SwipeableCard = memo(function SwipeableCard({
  children,
  className,
  threshold = 80,
  leftActions = [],
  rightActions = [],
  disabled = false,
  onSwipeStart,
  onSwipeEnd,
}: SwipeableCardProps) {
  const haptic = useHapticFeedback();
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasTriggered, setHasTriggered] = useState<"left" | "right" | null>(null);
  
  const x = useMotionValue(0);
  
  // Transforms for action backgrounds
  const leftOpacity = useTransform(x, [0, threshold], [0, 1]);
  const rightOpacity = useTransform(x, [-threshold, 0], [1, 0]);
  const leftScale = useTransform(x, [0, threshold], [0.8, 1]);
  const rightScale = useTransform(x, [-threshold, 0], [1, 0.8]);

  const handleDragStart = () => {
    setIsDragging(true);
    setHasTriggered(null);
    onSwipeStart?.();
  };

  const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    
    // Trigger haptic when crossing threshold
    if (offset > threshold && hasTriggered !== "right") {
      haptic.trigger("selection");
      setHasTriggered("right");
    } else if (offset < -threshold && hasTriggered !== "left") {
      haptic.trigger("selection");
      setHasTriggered("left");
    } else if (Math.abs(offset) < threshold * 0.8 && hasTriggered) {
      setHasTriggered(null);
    }
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    onSwipeEnd?.();
    
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    
    // Check if swipe exceeded threshold or has enough velocity
    const shouldTrigger = Math.abs(offset) > threshold || Math.abs(velocity) > 500;
    
    if (shouldTrigger) {
      if (offset > 0 && rightActions.length > 0) {
        // Right swipe - trigger first right action
        haptic.trigger("success");
        rightActions[0].onAction();
      } else if (offset < 0 && leftActions.length > 0) {
        // Left swipe - trigger first left action
        haptic.trigger("success");
        leftActions[0].onAction();
      }
    }
    
    setHasTriggered(null);
  };

  const hasSwipeActions = leftActions.length > 0 || rightActions.length > 0;

  if (disabled || !hasSwipeActions) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={constraintsRef} className="relative overflow-hidden rounded-lg">
      {/* Right swipe action background (appears on left) */}
      {rightActions.length > 0 && (
        <motion.div
          style={{ opacity: leftOpacity, scale: leftScale }}
          className={cn(
            "absolute inset-y-0 left-0 flex items-center justify-start px-4",
            rightActions[0]?.color || defaultColors[rightActions[0]?.action || "complete"]
          )}
        >
          <div className="flex items-center gap-2">
            {rightActions[0]?.icon || defaultIcons[rightActions[0]?.action || "complete"]}
            {rightActions[0]?.label && (
              <span className="text-sm font-medium">{rightActions[0].label}</span>
            )}
          </div>
        </motion.div>
      )}

      {/* Left swipe action background (appears on right) */}
      {leftActions.length > 0 && (
        <motion.div
          style={{ opacity: rightOpacity, scale: rightScale }}
          className={cn(
            "absolute inset-y-0 right-0 flex items-center justify-end px-4",
            leftActions[0]?.color || defaultColors[leftActions[0]?.action || "delete"]
          )}
        >
          <div className="flex items-center gap-2">
            {leftActions[0]?.label && (
              <span className="text-sm font-medium">{leftActions[0].label}</span>
            )}
            {leftActions[0]?.icon || defaultIcons[leftActions[0]?.action || "delete"]}
          </div>
        </motion.div>
      )}

      {/* Main draggable content */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -150, right: 150 }}
        dragElastic={0.1}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className={cn(
          "relative bg-card z-10 touch-pan-y",
          isDragging && "cursor-grabbing",
          className
        )}
      >
        {children}
      </motion.div>
    </div>
  );
});
