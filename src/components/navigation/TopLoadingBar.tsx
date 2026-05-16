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
     const startLoading = () => {
       setIsLoading(true);
       setProgress(20);
     };
 
     const completeLoading = () => {
       setProgress(100);
       setTimeout(() => {
         setIsLoading(false);
         setProgress(0);
       }, 250);
     };
 
     startLoading();
     
     const timer = setInterval(() => {
       setProgress((prev) => {
         if (prev >= 95) {
           clearInterval(timer);
           return prev;
         }
         return prev + (prev < 60 ? 10 : 2);
       });
     }, 150);
 
     // This should ideally be triggered by actual content loading, 
     // but for SPA navigation, a small delay is sufficient to feel snappy
     const finishTimer = setTimeout(completeLoading, 300);
 
     return () => {
       clearInterval(timer);
       clearTimeout(finishTimer);
     };
   }, [location.pathname, location.key]);

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