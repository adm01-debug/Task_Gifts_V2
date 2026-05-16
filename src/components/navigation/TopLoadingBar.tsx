import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

/**
 * TopLoadingBar - Uma barra de progresso discreta no topo da página
 * Ativada durante mudanças de rota para indicar que o conteúdo está carregando
 */
export const TopLoadingBar = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    setProgress(20);
    
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 5;
      });
    }, 100);

    const finishTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 200);
    }, 400); // Simulate page load completion

    return () => {
      clearInterval(timer);
      clearTimeout(finishTimer);
    };
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed top-0 left-0 right-0 h-0.5 bg-primary z-[9999] origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress / 100 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </AnimatePresence>
  );
};