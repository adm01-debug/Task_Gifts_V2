import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, X } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export function KeyboardShortcutsHelp() {
  const { showHelp, setShowHelp, shortcutGroups, gPressed } = useKeyboardShortcuts();

  return (
    <>
      {/* G-pressed indicator */}
      <AnimatePresence>
        {gPressed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium shadow-lg"
          >
            <div className="flex items-center gap-2">
              <Keyboard className="w-4 h-4" />
              <span>Pressione uma tecla para navegar...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shortcuts help dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              Atalhos de Teclado
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {shortcutGroups.map((group) => (
              <div key={group.label}>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                  {group.label}
                </h4>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.key}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {group.label.includes("G +") && (
                          <>
                            <Badge variant="outline" className="font-mono text-xs">
                              G
                            </Badge>
                            <span className="text-muted-foreground">+</span>
                          </>
                        )}
                        <Badge variant="outline" className="font-mono text-xs uppercase">
                          {shortcut.key === "?" ? "Shift + /" : shortcut.key}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Pressione <Badge variant="outline" className="font-mono text-xs mx-1">?</Badge> a qualquer momento para ver esta ajuda
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
