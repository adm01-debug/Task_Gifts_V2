import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
  badge?: number;
  path: string;
}

interface SidebarNavGroupProps {
  title: string;
  icon: React.ElementType;
  items: NavItem[];
  collapsed: boolean;
  defaultOpen?: boolean;
}

export const SidebarNavGroup = memo(function SidebarNavGroup({
  title,
  icon: GroupIcon,
  items,
  collapsed,
  defaultOpen = false,
}: SidebarNavGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  // Check if any item in this group is active
  const hasActiveItem = items.some(
    (item) => currentPath === item.path || (item.path !== "/" && currentPath.startsWith(item.path))
  );

  // Auto-expand if has active item
  const effectiveOpen = isOpen || hasActiveItem;

  const handleToggle = () => {
    if (!collapsed) {
      setIsOpen(!isOpen);
    }
  };

  const handleItemClick = (item: NavItem) => {
    navigate(item.path);
  };

  // Collapsed mode: show only icons in a vertical list
  if (collapsed) {
    return (
      <div className="space-y-1">
        {items.map((item) => {
          const isActive = currentPath === item.path || (item.path !== "/" && currentPath.startsWith(item.path));
          return (
            <div key={item.label} className="relative group/sidebar-item">
              <motion.button
                onClick={() => handleItemClick(item)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "w-full flex items-center justify-center p-3 rounded-xl transition-all duration-300",
                  "hover:bg-sidebar-accent hover:shadow-glow-primary/10",
                  isActive
                    ? "bg-primary/15 text-primary shadow-glow-primary/5"
                    : "text-sidebar-foreground/70"
                )}
              >
                <div className="relative">
                  <item.icon className={cn("w-5.5 h-5.5 transition-colors", isActive ? "text-primary" : "group-hover/sidebar-item:text-primary/70")} />
                  {item.badge && (
                    <span className="absolute -top-2 -right-2 w-4.5 h-4.5 rounded-full bg-primary text-[10px] font-black flex items-center justify-center text-primary-foreground shadow-sm ring-2 ring-background">
                      {item.badge}
                    </span>
                  )}
                </div>
              </motion.button>
              
              {/* Tooltip label for collapsed mode */}
              <div className="absolute left-full ml-4 px-3 py-2 bg-popover text-popover-foreground text-xs font-bold rounded-lg shadow-xl opacity-0 invisible group-hover/sidebar-item:opacity-100 group-hover/sidebar-item:visible transition-all duration-300 translate-x-[-10px] group-hover/sidebar-item:translate-x-0 z-[60] whitespace-nowrap pointer-events-none border border-border/50 backdrop-blur-md">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Expanded mode: collapsible group
  return (
    <div className="space-y-1">
      {/* Group Header */}
      <motion.button
        onClick={handleToggle}
        whileHover={{ x: 2 }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
          "hover:bg-sidebar-accent/50",
          hasActiveItem ? "text-sidebar-foreground" : "text-sidebar-foreground/60"
        )}
      >
        <GroupIcon className={cn("w-4 h-4", hasActiveItem && "text-primary")} />
        <span className="flex-1 text-left text-xs font-semibold uppercase tracking-wider">
          {title}
        </span>
        <motion.div
          animate={{ rotate: effectiveOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>

      {/* Group Items */}
      <AnimatePresence initial={false}>
        {effectiveOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pl-2 space-y-0.5">
              {items.map((item) => {
                const isActive = currentPath === item.path || (item.path !== "/" && currentPath.startsWith(item.path));
                return (
                  <motion.button
                    key={item.label}
                    onClick={() => handleItemClick(item)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                      "hover:bg-sidebar-accent",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground/70"
                    )}
                  >
                    <div className="relative">
                      <item.icon className={cn("w-4 h-4", isActive && "text-primary")} />
                      {item.badge && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center text-primary-foreground">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="font-medium text-sm">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="sidebarActiveIndicator"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
