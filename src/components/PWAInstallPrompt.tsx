import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone, Share, Zap, Wifi, Bell, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";

const features = [
  { icon: Zap, text: "Acesso instantâneo", color: "text-xp" },
  { icon: Wifi, text: "Funciona offline", color: "text-success" },
  { icon: Bell, text: "Notificações", color: "text-primary" },
];

export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Check if user has dismissed before
    const hasDismissed = localStorage.getItem("pwa-install-dismissed");
    const dismissedAt = localStorage.getItem("pwa-install-dismissed-at");
    
    // Reset dismissal after 7 days
    if (hasDismissed && dismissedAt) {
      const dismissedDate = new Date(parseInt(dismissedAt));
      const now = new Date();
      const daysSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceDismissed > 7) {
        localStorage.removeItem("pwa-install-dismissed");
        localStorage.removeItem("pwa-install-dismissed-at");
      } else {
        setDismissed(true);
        return;
      }
    }

    // Show prompt after 20 seconds if installable
    if ((isInstallable || isIOS) && !isInstalled) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 20000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, isIOS]);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const success = await promptInstall();
      if (success) {
        setShowPrompt(false);
      }
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem("pwa-install-dismissed", "true");
    localStorage.setItem("pwa-install-dismissed-at", Date.now().toString());
  };

  const handleShowIOSInstructions = () => {
    setShowIOSInstructions(true);
  };

  if (isInstalled || dismissed) return null;

  return (
    <>
      <AnimatePresence>
        {showPrompt && !showIOSInstructions && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-[380px]"
          >
            <div className="relative overflow-hidden bg-card border border-border rounded-2xl shadow-2xl">
              {/* Animated gradient background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10"
                animate={{
                  backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
                }}
                transition={{ duration: 5, repeat: Infinity }}
              />
              
              {/* Sparkle effects */}
              <div className="absolute top-2 right-12">
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Sparkles className="w-4 h-4 text-gold/40" />
                </motion.div>
              </div>
              
              <div className="relative z-10 p-5">
                {/* Close button */}
                <button
                  onClick={handleDismiss}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
                  >
                    <Smartphone className="w-7 h-7 text-primary-foreground" />
                  </motion.div>
                  
                  <div className="flex-1 min-w-0 pr-6">
                    <motion.h3 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="font-bold text-lg text-foreground"
                    >
                      Instalar Task Gifts
                    </motion.h3>
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-sm text-muted-foreground"
                    >
                      {isIOS
                        ? "Adicione à sua tela inicial"
                        : "Tenha o app sempre à mão"}
                    </motion.p>
                  </div>
                </div>

                {/* Features */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="flex items-center justify-between gap-2 mb-5 p-3 rounded-xl bg-muted/30"
                >
                  {features.map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <div className={`p-2 rounded-lg bg-card ${feature.color}`}>
                        <feature.icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {feature.text}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Buttons */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex gap-3"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="flex-1 text-muted-foreground hover:text-foreground"
                  >
                    Agora não
                  </Button>
                  
                  {isIOS ? (
                    <Button 
                      size="sm" 
                      onClick={handleShowIOSInstructions}
                      className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                    >
                      <Share className="w-4 h-4" />
                      Como instalar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleInstall}
                      disabled={installing}
                      className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                    >
                      {installing ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Download className="w-4 h-4" />
                          </motion.div>
                          Instalando...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Instalar App
                        </>
                      )}
                    </Button>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Instructions Modal */}
      <AnimatePresence>
        {showIOSInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
            onClick={() => setShowIOSInstructions(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Como instalar no iPhone</h3>
                  <button
                    onClick={() => setShowIOSInstructions(false)}
                    className="p-1.5 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {[
                    { step: 1, text: "Toque no botão de Compartilhar", icon: Share },
                    { step: 2, text: "Role e toque em \"Adicionar à Tela de Início\"", icon: Smartphone },
                    { step: 3, text: "Toque em \"Adicionar\" no canto superior direito", icon: CheckCircle2 },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.1 }}
                      className="flex items-center gap-4"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Passo {item.step}</span>
                        <p className="text-sm font-medium">{item.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <Button
                  onClick={() => setShowIOSInstructions(false)}
                  className="w-full mt-5"
                >
                  Entendi!
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
