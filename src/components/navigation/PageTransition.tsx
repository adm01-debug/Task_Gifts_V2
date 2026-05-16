import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode, forwardRef } from "react";

interface PageTransitionProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
}

/**
 * PageTransition - Fornece uma animação de transição suave entre páginas
 * Pode ser estendido para suportar diferentes tipos de animações (slide, fade, scale)
 */
export const PageTransition = forwardRef<HTMLDivElement, PageTransitionProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{
          duration: 0.3,
          ease: [0.22, 1, 0.36, 1], // Custom cubic-bezier for smoother feel
        }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

PageTransition.displayName = "PageTransition";