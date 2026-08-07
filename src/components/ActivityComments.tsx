import { useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Send, Trash2, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActivityComments, useAddComment, useDeleteComment } from "@/hooks/useActivityComments";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface ActivityCommentsProps {
  activityId: string;
  isOpen: boolean;
  onToggle: () => void;
  commentCount: number;
}

export const ActivityComments = forwardRef<HTMLDivElement, ActivityCommentsProps>(({ 
  activityId, 
  isOpen, 
  onToggle, 
  commentCount 
}, ref) => {
  const { user } = useAuth();
  const { comments, isLoading } = useActivityComments(activityId);
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  const [newComment, setNewComment] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    addComment.mutate(
      { activityId, userId: user.id, content: newComment },
      { onSuccess: () => setNewComment("") }
    );
  };

  const handleDelete = (commentId: string) => {
    setDeletingId(commentId);
    deleteComment.mutate(commentId, {
      onSettled: () => setDeletingId(null),
    });
  };

  return (
    <div ref={ref} className="mt-2">
      {/* Comment toggle button */}
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-1 text-xs transition-colors",
          isOpen ? "text-primary" : "text-muted-foreground hover:text-primary"
        )}
      >
        <MessageCircle className="h-3.5 w-3.5" />
        <span>{commentCount > 0 ? commentCount : ""}</span>
      </button>

      {/* Comments section */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3 border-t border-border/50 pt-3">
              {/* Comments list */}
              {isLoading ? (
                <div className="text-xs text-muted-foreground">Carregando...</div>
              ) : comments.length === 0 ? (
                <div className="text-xs text-muted-foreground">Nenhum comentário ainda. Seja o primeiro!</div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {comments.map((comment, index) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-2 group"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={comment.user?.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px] bg-primary/10">
                          {comment.user?.display_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium truncate">
                            {comment.user?.display_name || "Usuário"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/80 break-words">{comment.content}</p>
                      </div>
                      {user?.id === comment.user_id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDelete(comment.id)}
                          disabled={deletingId === comment.id}
                        >
                          {deletingId === comment.id ? (
                            <motion.div 
                              animate={{ rotate: 360 }} 
                              transition={{ repeat: Infinity, duration: 1 }} 
                              className="w-3 h-3 border border-current border-t-transparent rounded-full"
                            />
                          ) : (
                            <Trash2 className="h-3 w-3 text-destructive" />
                          )}
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Add comment form */}
              {user && (
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="text-[10px] bg-primary/10">
                      {user.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escreva um comentário..."
                    className="h-7 text-xs flex-1"
                    maxLength={500}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    disabled={!newComment.trim() || addComment.isPending}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
ActivityComments.displayName = "ActivityComments";
