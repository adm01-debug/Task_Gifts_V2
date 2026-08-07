import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic, type HapticStyle } from "@/hooks/useHaptics";
import { useSoundFeedback } from "@/hooks/useFeedback";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:shadow-[0_0_0_5px_hsl(var(--ring)/0.15)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4.5 [&_svg]:shrink-0 active:scale-[0.96] active:brightness-95",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg focus-visible:shadow-glow-primary",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md focus-visible:ring-destructive",
        outline: "border-2 border-border bg-transparent hover:bg-muted hover:border-primary/50 text-foreground focus-visible:border-primary",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/85 shadow-sm hover:shadow-md focus-visible:shadow-glow-secondary",
        success: "bg-success text-success-foreground hover:bg-success/90 shadow-sm hover:shadow-md focus-visible:ring-success focus-visible:shadow-glow-success",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 shadow-sm hover:shadow-md focus-visible:ring-warning",
        ghost: "hover:bg-muted hover:text-foreground focus-visible:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto focus-visible:ring-0 focus-visible:underline",
        hero: "bg-gradient-to-r from-primary via-accent to-secondary text-white hover:opacity-90 shadow-lg hover:shadow-xl transform hover:scale-[1.02] hover:-translate-y-0.5",
        glass: "backdrop-blur-xl bg-card/40 text-foreground border border-border/60 hover:bg-card/60 hover:border-primary/40",
        glow: "bg-primary/10 text-primary border-2 border-primary/30 hover:bg-primary/20 hover:border-primary/50 hover:shadow-glow-primary",
        premium: "bg-gradient-to-r from-gold via-warning to-gold text-gold-foreground font-bold hover:shadow-glow-primary transform hover:scale-[1.02]",
        subtle: "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
      },
      size: {
        default: "h-11 min-h-[44px] px-6 py-2",
        sm: "h-10 min-h-[44px] rounded-md px-4 text-xs",
        lg: "h-14 min-h-[44px] rounded-xl px-10 text-base",
        xl: "h-16 min-h-[44px] rounded-2xl px-12 text-lg font-bold",
        icon: "h-11 w-11 min-h-[44px] min-w-[44px]",
        "icon-sm": "h-10 w-10 min-h-[44px] min-w-[44px] rounded-md",
        "icon-lg": "h-12 w-12 min-h-[44px] min-w-[44px] rounded-xl",
        "icon-xs": "h-9 w-9 min-h-[36px] min-w-[36px] rounded",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  haptic?: HapticStyle;
  sound?: "click" | "success" | "error" | "achievement";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, loadingText, haptic, sound, children, disabled, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const { playSound } = useSoundFeedback();
    
    if (asChild) {
      return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
    }
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Priority haptic
      if (haptic && haptic !== "none") {
        triggerHaptic(haptic);
      } else {
        // Default haptics based on variant
        if (variant === "hero" || variant === "premium") triggerHaptic("success");
        else if (variant === "destructive") triggerHaptic("error");
        else if (size === "xl") triggerHaptic("medium");
        else triggerHaptic("light");
      }

      // Sound feedback
      if (sound) {
        playSound(sound);
      } else {
        // Default sounds based on variant
        if (variant === "hero" || variant === "premium" || variant === "success") playSound("success");
        else if (variant === "destructive" || variant === "warning") playSound("error");
        else playSound("click");
      }

      onClick?.(e);
    };

    return (
      <Comp 
        className={cn(buttonVariants({ variant, size, className }))} 
        ref={ref} 
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
