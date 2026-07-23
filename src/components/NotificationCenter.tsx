import { useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Trophy, 
  Zap, 
  Target, 
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  Brain,
  Flag,
  Megaphone,
  PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  useNotifications, 
  useMarkAsRead, 
  useMarkAllAsRead, 
  useDeleteNotification,
  useClearAllNotifications 
} from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Notification } from "@/services/notificationsService";

const notificationIcons: Record<string, React.ReactNode> = {
   achievement: <Trophy className="w-4 h-4 text-amber-500 drop-shadow-glow-sm" />,
   level_up: <TrendingUp className="w-4 h-4 text-emerald-500 drop-shadow-glow-sm" />,
   xp: <Zap className="w-4 h-4 text-primary animate-pulse" />,
   quest: <Target className="w-4 h-4 text-sky-500" />,
   leaderboard: <TrendingUp className="w-4 h-4 text-indigo-500" />,
   competency_gap: <AlertTriangle className="w-4 h-4 text-rose-500" />,
   development_tip: <Lightbulb className="w-4 h-4 text-amber-400" />,
   competency_celebration: <Sparkles className="w-4 h-4 text-emerald-400 animate-spin-slow" />,
   churn_risk: <Brain className="w-4 h-4 text-orange-500" />,
   campaign_enrolled: <Megaphone className="w-4 h-4 text-primary" />,
   campaign_progress: <TrendingUp className="w-4 h-4 text-sky-500" />,
   campaign_milestone: <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />,
   campaign_completed: <PartyPopper className="w-4 h-4 text-emerald-500" />,
   campaign_closed: <Flag className="w-4 h-4 text-amber-500" />,
   info: <Bell className="w-4 h-4 text-muted-foreground" />,
};

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (notification: Notification) => void;
}

const NotificationItem = memo(({ notification, onMarkRead, onDelete, onNavigate }: NotificationItemProps) => {
  const icon = notificationIcons[notification.type] || notificationIcons.info;
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { 
    addSuffix: true, 
    locale: ptBR 
  });
  const data = (notification.data ?? {}) as Record<string, unknown>;
  const url = typeof data.url === "string" ? data.url : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
       className={cn(
         "p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-all group relative overflow-hidden",
         url && "cursor-pointer",
         !notification.read && "bg-primary/5 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-primary before:rounded-r-full"
       )}
      role={url ? "button" : undefined}
      tabIndex={url ? 0 : undefined}
      onClick={url ? () => onNavigate(notification) : undefined}
      onKeyDown={
        url
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onNavigate(notification);
              }
            }
          : undefined
      }
    >
      <div className="flex items-start gap-3">
         <div className={cn(
           "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110",
           notification.read ? "bg-muted/50 text-muted-foreground" : "bg-primary/10 ring-1 ring-primary/20"
         )}>
          {icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
             <h4 className={cn(
               "text-xs font-black uppercase tracking-tight truncate leading-none",
               notification.read ? "text-muted-foreground/60" : "text-foreground"
             )}>
              {notification.title}
            </h4>
            {!notification.read && (
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
            )}
          </div>
           {notification.message && (
             <p className={cn(
               "text-xs line-clamp-2 mt-1 font-medium leading-relaxed",
               notification.read ? "text-muted-foreground/40" : "text-muted-foreground"
             )}>
               {notification.message}
             </p>
           )}
           <div className="flex items-center gap-2 mt-2">
             <div className="w-1 h-1 rounded-full bg-primary/30" />
             <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">
               {timeAgo}
             </p>
           </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!notification.read && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead(notification.id);
              }}
              aria-label="Marcar como lida"
            >
              <Check className="w-3 h-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            aria-label="Excluir notificação"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
});

NotificationItem.displayName = "NotificationItem";

export const NotificationCenter = () => {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, isLoading, realtimeEnabled } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();
  const clearAll = useClearAllNotifications();

  const handleMarkRead = useCallback((id: string) => {
    markAsRead.mutate(id);
  }, [markAsRead]);

  const handleDelete = useCallback((id: string) => {
    deleteNotification.mutate(id);
  }, [deleteNotification]);

  const handleMarkAllRead = useCallback(() => {
    markAllAsRead.mutate();
  }, [markAllAsRead]);

  const handleClearAll = useCallback(() => {
    clearAll.mutate();
  }, [clearAll]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
        >
          <Bell className="w-5 h-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
          {realtimeEnabled && (
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-success animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      
       <PopoverContent 
         className="w-96 p-0 bg-card/60 backdrop-blur-2xl border-white/10 shadow-2xl rounded-3xl overflow-hidden" 
         align="end"
         sideOffset={12}
       >
        {/* Header */}
        <div className="p-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Notificações</h3>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                {unreadCount} novas
              </span>
            )}
          </div>
          {notifications.length > 0 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Ler todas
              </Button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-80">
          {isLoading ? (
            <div className="space-y-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-3 flex items-start gap-3">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-2 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="Sem notificações"
              description="Novas atualizações aparecerão aqui"
              compact
            />
          ) : (
            <AnimatePresence mode="popLayout">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkRead}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-8 text-xs text-destructive hover:text-destructive"
              onClick={handleClearAll}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Limpar todas
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
