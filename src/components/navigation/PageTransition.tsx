  import { motion, HTMLMotionProps } from "framer-motion";
 import { ReactNode, forwardRef } from "react";
 import { useLocation } from "react-router-dom";

interface PageTransitionProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
}

/**
 * PageTransition - Fornece uma animação de transição suave entre páginas
 * Pode ser estendido para suportar diferentes tipos de animações (slide, fade, scale)
 */
 export const PageTransition = forwardRef<HTMLDivElement, PageTransitionProps>(
   ({ children, className, ...props }, ref) => {
     const location = useLocation();
     
      return (
        <motion.div
          key={location.pathname}
          ref={ref}
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
          transition={{
            duration: 0.25,
            ease: [0.23, 1, 0.32, 1],
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