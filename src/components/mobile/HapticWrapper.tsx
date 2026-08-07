import { useCallback, ComponentType } from "react";
import { useHapticFeedback } from "@/hooks/useHaptics";

/**
 * Higher-order component that adds haptic feedback to any clickable component
 */
export function withHapticFeedback<P extends { onClick?: (...args: unknown[]) => void }>(
  WrappedComponent: ComponentType<P>,
  feedbackType: "button" | "success" | "error" | "selection" = "button"
) {
  return function ComponentWithHaptic(props: P) {
    const haptic = useHapticFeedback();

    const handleClick = useCallback(
      (...args: unknown[]) => {
        switch (feedbackType) {
          case "success":
            haptic.questCompleted();
            break;
          case "error":
            haptic.error();
            break;
          case "selection":
            haptic.trigger("selection");
            break;
          default:
            haptic.buttonPress();
        }
        props.onClick?.(...args);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [haptic, props.onClick]
    );

    return <WrappedComponent {...props} onClick={handleClick} />;
  };
}

/**
 * Hook to create haptic-enabled click handlers
 */
export function useHapticClick<T extends (...args: unknown[]) => void>(
  handler: T,
  type: "button" | "success" | "error" | "selection" = "button"
): T {
  const haptic = useHapticFeedback();

  return useCallback(
    ((...args: unknown[]) => {
      switch (type) {
        case "success":
          haptic.questCompleted();
          break;
        case "error":
          haptic.error();
          break;
        case "selection":
          haptic.trigger("selection");
          break;
        default:
          haptic.buttonPress();
      }
      return handler(...args);
    }) as T,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [haptic, handler, type]
  );
}
