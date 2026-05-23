import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-2xl border bg-card text-card-foreground transition-all duration-500 ease-smooth",
  {
    variants: {
      variant: {
        // Base variants
        default: "shadow-sm border-border/60",
        
        // Hierarchy variants - NEW
        subtle: "shadow-xs border-border/40 bg-card/60 backdrop-blur-sm",
        prominent: "shadow-lg border-border bg-gradient-to-b from-card to-card/95",
        featured: "shadow-xl border-primary/20 bg-gradient-to-br from-card via-card to-primary/5",
        
        // Interactive variants
        elevated: "shadow-md hover:shadow-xl hover:-translate-y-1.5 border-border/80 bg-elevated",
        interactive: "shadow-md hover:shadow-glow-primary hover:border-primary/40 cursor-pointer hover:-translate-y-1.5 border-border active:scale-[0.98]",
        
        // Special effects
        glass: "bg-card/70 backdrop-blur-2xl border-white/20 dark:border-white/10 shadow-xl",
        ghost: "border-transparent shadow-none bg-transparent hover:bg-muted/40",
        outline: "border-2 shadow-none hover:border-primary/40 bg-transparent hover:bg-card/40",
        premium: "bg-gradient-to-br from-card via-card to-primary/10 border-primary/30 shadow-glow-primary",
        
        // Stats and data
        stat: "shadow-md hover:shadow-xl hover:-translate-y-2 border-border/50 relative overflow-hidden group",
        ultra: "bg-card/40 backdrop-blur-[32px] border-white/15 dark:border-white/5 shadow-2xl rounded-[2rem] hover:bg-card/50 hover:border-primary/40 transition-all duration-700 hover:shadow-primary/15 hover:shadow-3xl",
        shimmer: "shadow-sm border-border hover:border-primary/30 overflow-hidden relative after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer-slide after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent",
        glow: "shadow-sm border-border animate-border-glow",
      },
      size: {
        default: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement, 
  React.HTMLAttributes<HTMLDivElement> & { compact?: boolean }
>(({ className, compact, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "flex flex-col space-y-1.5",
      compact ? "p-4" : "p-6",
      className
    )} 
    {...props} 
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 
      ref={ref} 
      className={cn(
        "font-display text-xl font-bold leading-none tracking-tight text-card-foreground", 
        className
      )} 
      {...props} 
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground leading-relaxed", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement, 
  React.HTMLAttributes<HTMLDivElement> & { compact?: boolean }
>(({ className, compact, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      compact ? "p-4 pt-0" : "p-6 pt-0", 
      className
    )} 
    {...props} 
  />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement, 
  React.HTMLAttributes<HTMLDivElement> & { compact?: boolean }
>(({ className, compact, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "flex items-center",
      compact ? "p-4 pt-0" : "p-6 pt-0", 
      className
    )} 
    {...props} 
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };