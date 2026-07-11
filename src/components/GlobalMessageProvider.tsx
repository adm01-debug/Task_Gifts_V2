import { useState, useEffect, useCallback, ReactNode, createContext, useContext } from "react";
import { AlertCircle, X, CheckCircle2, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export type MessageType = "error" | "success" | "info" | "warning";

interface Message {
  id: string;
  type: MessageType;
  title?: string;
  text: string;
  duration?: number;
}

interface GlobalMessageContextType {
  showMessage: (text: string, type?: MessageType, title?: string, duration?: number) => void;
  hideMessage: (id: string) => void;
}

const GlobalMessageContext = createContext<GlobalMessageContextType | undefined>(undefined);

export function GlobalMessageProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);

  const hideMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  const showMessage = useCallback((text: string, type: MessageType = "info", title?: string, duration: number = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setMessages((prev) => [...prev, { id, type, title, text, duration }]);

    if (duration > 0) {
      setTimeout(() => hideMessage(id), duration);
    }
  }, [hideMessage]);

  // Expose to global window for non-hook usage (like loggingService)
  useEffect(() => {
    (window as Window & { __GLOBAL_MESSAGE_SYSTEM__?: { showMessage: typeof showMessage } }).__GLOBAL_MESSAGE_SYSTEM__ = {
      showMessage,
    };
  }, [showMessage]);

  return (
    <GlobalMessageContext.Provider value={{ showMessage, hideMessage }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className={cn(
                "pointer-events-auto relative p-4 rounded-xl border shadow-lg flex gap-3 overflow-hidden",
                msg.type === "error" && "bg-destructive/10 border-destructive/20 text-destructive",
                msg.type === "success" && "bg-green-500/10 border-green-500/20 text-green-600",
                msg.type === "warning" && "bg-yellow-500/10 border-yellow-500/20 text-yellow-700",
                msg.type === "info" && "bg-primary/10 border-primary/20 text-primary"
              )}
            >
              <div className="flex-shrink-0 mt-0.5">
                {msg.type === "error" && <AlertCircle className="w-5 h-5" />}
                {msg.type === "success" && <CheckCircle2 className="w-5 h-5" />}
                {msg.type === "warning" && <AlertCircle className="w-5 h-5" />}
                {msg.type === "info" && <Info className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                {msg.title && <h4 className="font-bold text-sm mb-1">{msg.title}</h4>}
                <p className="text-sm leading-relaxed opacity-90">{msg.text}</p>
              </div>
              <button 
                onClick={() => hideMessage(msg.id)}
                className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
              
              {msg.duration && msg.duration > 0 && (
                <motion.div 
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: msg.duration / 1000, ease: "linear" }}
                  className={cn(
                    "global-message-progress",
                    msg.type === "error" && "global-message-progress-error",
                    msg.type === "success" && "global-message-progress-success",
                    msg.type === "warning" && "global-message-progress-warning",
                    msg.type === "info" && "global-message-progress-info"
                  )}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </GlobalMessageContext.Provider>
  );
}

export const useGlobalMessage = () => {
  const context = useContext(GlobalMessageContext);
  if (!context) throw new Error("useGlobalMessage must be used within GlobalMessageProvider");
  return context;
};
