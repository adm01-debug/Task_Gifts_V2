import { useState, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToggleReaction } from "@/hooks/useActivityReactions";
import { useAuth } from "@/hooks/useAuth";
import { AVAILABLE_REACTIONS, ReactionCount } from "@/services/activityReactionsService";
import { cn } from "@/lib/utils";

interface ActivityReactionsProps {
  activityId: string;
  reactions: ReactionCount[];
}

export const ActivityReactions = memo(function ActivityReactions({ activityId, reactions }: ActivityReactionsProps) {
  const { user } = useAuth();
  const toggleReaction = useToggleReaction();
  const [isOpen, setIsOpen] = useState(false);

  const handleReaction = useCallback((emoji: string) => {
    if (!user) return;
    toggleReaction.mutate({ activityId, userId: user.id, emoji });
    setIsOpen(false);
  }, [user, toggleReaction, activityId]);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Existing reactions */}
      <AnimatePresence mode="popLayout">
        {reactions.map((reaction) => (
          <motion.button
            key={reaction.emoji}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleReaction(reaction.emoji)}
            className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-colors",
              reaction.userReacted
                ? "bg-primary/20 border border-primary/30"
                : "bg-muted/50 border border-transparent hover:bg-muted"
            )}
          >
            <span>{reaction.emoji}</span>
            <span className={cn("font-medium", reaction.userReacted && "text-primary")}>
              {reaction.count}
            </span>
          </motion.button>
        ))}
      </AnimatePresence>

      {/* Add reaction button */}
      {user && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full opacity-50 hover:opacity-100 transition-opacity"
            >
              <Smile className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" side="top" align="start">
            <div className="flex items-center gap-1">
              {AVAILABLE_REACTIONS.map((emoji) => (
                <motion.button
                  key={emoji}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleReaction(emoji)}
                  className="text-xl p-1 hover:bg-muted rounded transition-colors"
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
});
