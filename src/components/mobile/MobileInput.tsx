import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface MobileInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Input type with mobile-optimized keyboard */
  mobileType?: "text" | "email" | "tel" | "number" | "search" | "url" | "password";
}

/**
 * MobileInput - Input optimized for mobile devices
 * Automatically sets inputMode and autocomplete for better UX
 */
export const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  ({ mobileType = "text", className, ...props }, ref) => {
    const inputModeMap: Record<string, React.HTMLAttributes<HTMLInputElement>['inputMode']> = {
      email: "email",
      tel: "tel",
      number: "numeric",
      search: "search",
      url: "url",
    };
    const autoCompleteMap: Record<string, string> = {
      email: "email",
      tel: "tel",
      password: "current-password",
    };

    return (
      <input
        ref={ref}
        type={mobileType}
        inputMode={inputModeMap[mobileType]}
        autoComplete={autoCompleteMap[mobileType] || "off"}
        autoCapitalize={mobileType === "email" ? "none" : undefined}
        autoCorrect={mobileType === "email" ? "off" : undefined}
        className={cn(
          "flex h-12 w-full rounded-xl border border-input bg-background px-4 py-3",
          "text-base ring-offset-background", // 16px prevents iOS zoom
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "touch-manipulation", // Prevents 300ms delay
          className
        )}
        {...props}
      />
    );
  }
);

MobileInput.displayName = "MobileInput";
