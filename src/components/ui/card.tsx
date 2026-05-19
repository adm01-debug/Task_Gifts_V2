import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-xl border bg-card text-card-foreground transition-all duration-300",
  {
    variants: {
      variant: {
        // Base variants
        default: "shadow-sm border-border",
        
        // Hierarchy variants - NEW
        subtle: "shadow-xs border-border/60 bg-card/80",
        prominent: "shadow-lg border-border bg-gradient-to-b from-card to-card/95",
        featured: "shadow-xl border-primary/20 bg-gradient-to-br from-card via-card to-primary/5",
        
        // Interactive variants
        elevated: "shadow-md hover:shadow-lg hover:-translate-y-0.5 border-border",
        interactive: "shadow-md hover:shadow-glow-primary hover:border-primary/40 cursor-pointer hover:-translate-y-1 border-border",
        
        // Special effects
        glass: "bg-card/85 backdrop-blur-xl border-border/50 shadow-lg",
        ghost: "border-transparent shadow-none bg-transparent hover:bg-muted/50",
        outline: "border-2 shadow-none hover:border-primary/50 bg-transparent hover:bg-card/50",
        premium: "bg-gradient-to-br from-card via-card to-muted/30 border-primary/20 shadow-glow-primary",
        
        // Stats and data
        stat: "shadow-sm hover:shadow-md hover:-translate-y-1 border-border relative overflow-hidden",
        ultra: "bg-card/40 backdrop-blur-2xl border-white/10 dark:border-white/5 shadow-2xl rounded-3xl hover:bg-card/50 hover:border-primary/30 transition-all duration-500 hover:shadow-primary/10 hover:shadow-2xl",
        shimmer: "shadow-sm border-border hover:border-primary/30",
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