import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

// Mobile-optimized page variants (iOS-like slide)
const mobileVariants = {
  initial: {
    opacity: 0,
    x: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    x: -20,
    scale: 0.98,
  },
};

// Desktop page variants (fade and slide up)
const desktopVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -10,
  },
};

// Reduced motion variants (simple fade)
const reducedMotionVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const mobileTransition = {
  type: "spring" as const,
  stiffness: 380,
  damping: 35,
  mass: 0.8,
};

const desktopTransition = {
  type: "tween" as const,
  ease: "easeOut" as const,
  duration: 0.3,
};

const reducedMotionTransition = {
  duration: 0.15,
};

export function PageTransition({ children, className = "" }: PageTransitionProps) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();

  // Select appropriate variants and transition
  const variants = prefersReducedMotion 
    ? reducedMotionVariants 
    : isMobile 
      ? mobileVariants 
      : desktopVariants;

  const transition = prefersReducedMotion
    ? reducedMotionTransition
    : isMobile
      ? mobileTransition
      : desktopTransition;

  // Focus management: move focus to main content after route change
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Small delay to wait for animation
    const timer = setTimeout(() => {
      const mainContent = document.getElementById("main-content");
      if (mainContent) {
        mainContent.focus({ preventScroll: true });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        ref={containerRef}
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={transition}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Staggered children animation for lists
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

// Mobile-optimized stagger (faster)
export const mobileStaggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.03,
    },
  },
};

export const mobileStaggerItem = {
  initial: { opacity: 0, x: 15 },
  animate: { opacity: 1, x: 0 },
};
