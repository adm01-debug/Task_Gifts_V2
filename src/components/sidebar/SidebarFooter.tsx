import { memo, useCallback } from "react";
import { motion } from "framer-motion";
import { Settings, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LanguageSelector } from "@/components/LanguageSelector";

interface SidebarFooterProps {
  collapsed: boolean;
}

export const SidebarFooter = memo(function SidebarFooter({ collapsed }: SidebarFooterProps) {
  const navigate = useNavigate();

  const handleNavigateToSecurity = useCallback(() => navigate("/security"), [navigate]);
  const handleNavigateToProfile = useCallback(() => navigate("/profile"), [navigate]);

  return (
    <div className="mt-auto">
      {/* Language Selector */}
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-3 pb-2"
        >
          <LanguageSelector compact={false} className="w-full" />
        </motion.div>
      )}

      {/* Footer Actions */}
      <div className="p-2 border-t border-sidebar-border space-y-1">
        <motion.button
          whileHover={{ x: collapsed ? 0 : 4 }}
          onClick={handleNavigateToSecurity}
          aria-label="Segurança"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors justify-center lg:justify-start"
        >
          <Shield className="w-5 h-5" />
          {!collapsed && <span className="font-medium text-sm">Segurança</span>}
        </motion.button>
        <motion.button
          whileHover={{ x: collapsed ? 0 : 4 }}
          onClick={handleNavigateToProfile}
          aria-label="Configurações"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors justify-center lg:justify-start"
        >
          <Settings className="w-5 h-5" />
          {!collapsed && <span className="font-medium text-sm">Configurações</span>}
        </motion.button>
      </div>
    </div>
  );
});
