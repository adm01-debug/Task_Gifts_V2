import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode, forwardRef } from "react";

interface StaggeredContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
  [key: `data-${string}`]: string | undefined;
}

interface StaggeredItemProps {
  children: ReactNode;
  className?: string;
  index?: number;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

export function StaggeredContainer({ 
  children, 
  className,
  staggerDelay = 0.1,
  initialDelay = 0.1,
  ...rest
}: StaggeredContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: initialDelay,
          },
        },
      }}
      className={cn("", className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function StaggeredItem({ 
  children, 
  className,
}: StaggeredItemProps) {
  return (
    <motion.div
      variants={itemVariants}
      className={cn("", className)}
    >
      {children}
    </motion.div>
  );
}

// Grid variant with staggered children
export function StaggeredGrid({ 
  children, 
  className,
  staggerDelay = 0.08,
  initialDelay = 0.15,
}: StaggeredContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: initialDelay,
          },
        },
      }}
      className={cn("grid", className)}
    >
      {children}
    </motion.div>
  );
}

// Fade in from left variant
const slideInLeftVariants: Variants = {
  hidden: { 
    opacity: 0, 
    x: -30,
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 25,
    },
  },
};

// Fade in from right variant
const slideInRightVariants: Variants = {
  hidden: { 
    opacity: 0, 
    x: 30,
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 25,
    },
  },
};

export const StaggeredItemLeft = forwardRef<HTMLDivElement, StaggeredItemProps>(
  function StaggeredItemLeft({ children, className }, ref) {
    return (
      <motion.div
        ref={ref}
        variants={slideInLeftVariants}
        className={cn("", className)}
      >
        {children}
      </motion.div>
    );
  }
);

export const StaggeredItemRight = forwardRef<HTMLDivElement, StaggeredItemProps>(
  function StaggeredItemRight({ children, className }, ref) {
    return (
      <motion.div
        ref={ref}
        variants={slideInRightVariants}
        className={cn("", className)}
      >
        {children}
      </motion.div>
    );
  }
);
