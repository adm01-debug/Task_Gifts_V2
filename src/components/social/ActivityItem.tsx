import { motion } from "framer-motion";
import { Heart, MessageCircle, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ActivityItemProps {
  activity: {
    id: string;
    userName: string;
    avatarUrl?: string | null;
    message: string;
    icon: React.ReactNode;
    color: string;
    createdAt: string;
    metadata?: Record<string, unknown>;
    type: string;
  };
  index: number;
  isLast: boolean;
  isLiked: boolean;
  onLike: (id: string) => void;
}

export function ActivityItem({ activity, index, isLast, isLiked, onLike }: ActivityItemProps) {
  return (
    <motion.div
      key={activity.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.5) }}
      className="group relative"
    >
      {!isLast && (
        <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gradient-to-b from-border to-transparent" />
      )}
      <div className="flex items-start gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="relative shrink-0">
          <Avatar className="h-10 w-10 border-2 border-background shadow-md">
            <AvatarImage src={activity.avatarUrl || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
              {activity.userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <motion.div
            className="absolute -bottom-1 -right-1 text-base bg-background rounded-full p-0.5 shadow-sm"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
          >
            {activity.icon}
          </motion.div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-relaxed">
            <span className={cn("font-medium", activity.color)}>{activity.userName}</span>{" "}
            <span className="text-muted-foreground">{activity.message.replace(activity.userName, "").trim()}</span>
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: ptBR })}
            </span>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <motion.button
                onClick={() => onLike(activity.id)}
                className={cn("flex items-center gap-1 text-xs transition-colors", isLiked ? "text-pink-500" : "text-muted-foreground hover:text-pink-500")}
                whileTap={{ scale: 0.9 }}
              >
                <motion.div animate={isLiked ? { scale: [1, 1.3, 1] } : {}}>
                  <Heart className="h-3.5 w-3.5" fill={isLiked ? "currentColor" : "none"} />
                </motion.div>
              </motion.button>
              <button className="text-muted-foreground hover:text-primary transition-colors"><MessageCircle className="h-3.5 w-3.5" /></button>
              <button className="text-muted-foreground hover:text-amber-500 transition-colors"><Sparkles className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </div>
         {activity.metadata?.xp_amount !== undefined && (
           <Badge variant="outline" className="shrink-0 text-amber-500 border-amber-500/30 bg-amber-500/10">
             +{String(activity.metadata.xp_amount)} XP
           </Badge>
         )}
      </div>
    </motion.div>
  );
}
