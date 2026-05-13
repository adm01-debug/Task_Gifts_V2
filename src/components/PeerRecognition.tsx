import { useState, forwardRef, useCallback, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Send, Users, Sparkles, X, Search, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useKudosBadges, useRecentKudos, useGiveKudos } from "@/hooks/useKudos";
import { useProfiles } from "@/hooks/useProfiles";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { SkeletonKudosList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { kudosMessageSchema } from "@/lib/validations";
import { useFuseSearch, SEARCH_PRESETS } from "@/hooks/useFuseSearch";
import type { KudosBadge } from "@/services/kudosService";

interface GiveKudosFormProps {
  onSuccess: () => void;
}

const GiveKudosForm = forwardRef<HTMLDivElement, GiveKudosFormProps>(({ onSuccess }, ref) => {
  const { user } = useAuth();
  const { data: badges = [] } = useKudosBadges();
  const { data: profiles = [] } = useProfiles();
  const giveKudos = useGiveKudos();
  
  const [selectedBadge, setSelectedBadge] = useState<KudosBadge | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const otherUsers = useMemo(() => profiles.filter(p => p.id !== user?.id), [profiles, user?.id]);
  
  // Fuzzy search with Fuse.js
  const searchResults = useFuseSearch(
    otherUsers,
    ['display_name', 'email'],
    searchQuery,
    { ...SEARCH_PRESETS.loose, limit: 20 }
  );
  const filteredUsers = searchResults.map(r => r.item);

  // Validate message with Zod schema
  const validateMessage = useCallback((value: string) => {
    const result = kudosMessageSchema.safeParse(value);
    if (!result.success) {
      setMessageError(result.error.errors[0].message);
      return false;
    }
    setMessageError(null);
    return true;
  }, []);

  const handleSubmit = useCallback(() => {
    if (!user?.id || !selectedUser) return;
    
    // Validate before submitting
    if (!validateMessage(message)) return;

    giveKudos.mutate({
      from_user_id: user.id,
      to_user_id: selectedUser,
      badge_id: selectedBadge?.id ?? null,
      message: message.trim(),
      is_public: true,
    }, {
      onSuccess: () => {
        setSelectedBadge(null);
        setSelectedUser(null);
        setMessage("");
        setMessageError(null);
        onSuccess();
      },
    });
  }, [user?.id, selectedUser, message, selectedBadge?.id, giveKudos, onSuccess, validateMessage]);

  const selectedProfile = useMemo(() => profiles.find(p => p.id === selectedUser), [profiles, selectedUser]);

  const handleBadgeClick = useCallback((badge: KudosBadge) => {
    setSelectedBadge(prev => prev?.id === badge.id ? null : badge);
  }, []);

  const handleUserClick = useCallback((userId: string) => {
    setSelectedUser(userId);
  }, []);

  const handleClearUser = useCallback(() => {
    setSelectedUser(null);
  }, []);

  return (
    <div ref={ref} className="space-y-4">
      {/* Badge Selection */}
      <div>
        <label className="text-sm font-medium mb-2 block">Escolha um badge (opcional)</label>
        <div className="grid grid-cols-4 gap-2">
          {badges.map((badge) => (
            <motion.button
              key={badge.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleBadgeClick(badge)}
              className={cn(
                "p-3 rounded-xl border text-center transition-all",
                selectedBadge?.id === badge.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              )}
            >
              <span className="text-2xl block">{badge.icon}</span>
              <span className="text-[10px] text-muted-foreground line-clamp-1">{badge.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* User Selection */}
      <div>
        <label className="text-sm font-medium mb-2 block">Para quem?</label>
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar colega..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-muted border border-border text-sm outline-none focus:border-primary"
          />
        </div>
        <ScrollArea className="h-32 rounded-lg border border-border">
          <div className="p-2 space-y-1">
            {filteredUsers.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhum colega encontrado
              </p>
            ) : (
              filteredUsers.map((profile) => (
                <motion.button
                  key={profile.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => handleUserClick(profile.id)}
                  className={cn(
                    "w-full flex items-center gap-2 p-2 rounded-lg transition-all text-left",
                    selectedUser === profile.id
                      ? "bg-primary/10 border border-primary"
                      : "hover:bg-muted"
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-primary-foreground">
                    {profile.display_name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{profile.display_name || "Sem nome"}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{profile.email}</p>
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </ScrollArea>
        {selectedProfile && (
          <div className="mt-2 p-2 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-2">
            <span className="text-xs">Selecionado:</span>
            <span className="text-xs font-semibold">{selectedProfile.display_name}</span>
            <button onClick={handleClearUser} className="ml-auto p-1 rounded hover:bg-muted">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Message */}
      <div>
        <label className="text-sm font-medium mb-2 block">Mensagem</label>
        <Textarea
          placeholder="Escreva uma mensagem de reconhecimento..."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (messageError) setMessageError(null);
          }}
          onBlur={() => message.trim() && validateMessage(message)}
          rows={3}
          maxLength={500}
          className={cn(messageError && "border-destructive focus-visible:ring-destructive")}
        />
        <div className="flex items-center justify-between mt-1">
          {messageError ? (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {messageError}
            </p>
          ) : (
            <span />
          )}
          <p className="text-[10px] text-muted-foreground">
            {message.length}/500
          </p>
        </div>
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!selectedUser || !message.trim() || giveKudos.isPending}
        className="w-full"
      >
        {giveKudos.isPending ? (
          <>
            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Enviar Reconhecimento
          </>
        )}
      </Button>
    </div>
  );
});
GiveKudosForm.displayName = "GiveKudosForm";

interface KudosItemProps {
  kudos: {
    id: string;
    from_user_id: string;
    to_user_id: string;
    message: string;
    created_at: string;
    badge?: { name: string; icon: string } | null;
  };
  index: number;
  getProfileName: (userId: string) => string;
  getProfileInitial: (userId: string) => string;
}

const KudosItem = memo(({ kudos, index, getProfileName, getProfileInitial }: KudosItemProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="p-3 hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="flex -space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-primary-foreground border-2 border-card">
            {getProfileInitial(kudos.from_user_id)}
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-pink-500 flex items-center justify-center text-xs font-bold text-primary-foreground border-2 border-card">
            {getProfileInitial(kudos.to_user_id)}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs">
            <span className="font-semibold">{getProfileName(kudos.from_user_id)}</span>
            {" → "}
            <span className="font-semibold">{getProfileName(kudos.to_user_id)}</span>
          </p>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
            {kudos.message}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(kudos.created_at), { addSuffix: true, locale: ptBR })}
          </p>
        </div>
        {kudos.badge && (
          <span className="text-2xl" title={kudos.badge.name}>
            {kudos.badge.icon}
          </span>
        )}
      </div>
    </motion.div>
  );
});

KudosItem.displayName = "KudosItem";

 const PeerRecognitionComponent = () => {
 export const PeerRecognitionLazy = memo(PeerRecognitionComponent);
 export const PeerRecognition = PeerRecognitionLazy;
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: recentKudos = [], isLoading } = useRecentKudos(10);
  const { data: profiles = [] } = useProfiles();

  const getProfileName = useCallback((userId: string) => {
    const profile = profiles.find(p => p.id === userId);
    return profile?.display_name || "Usuário";
  }, [profiles]);

  const getProfileInitial = useCallback((userId: string) => {
    const name = getProfileName(userId);
    return name.charAt(0).toUpperCase();
  }, [getProfileName]);

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-0.5 border border-border transition-all duration-300"
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center">
            <Heart className="w-4 h-4 text-pink-500" />
          </div>
          <div>
            <h3 className="font-bold">Peer Recognition</h3>
            <p className="text-xs text-muted-foreground">Reconheça seus colegas</p>
          </div>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1">
              <Sparkles className="w-3 h-3" />
              Dar Kudos
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                Reconhecer um colega
              </DialogTitle>
            </DialogHeader>
            <GiveKudosForm onSuccess={handleDialogClose} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Recent Kudos */}
      <ScrollArea className="max-h-80">
      {isLoading ? (
          <SkeletonKudosList count={5} className="p-0" />
        ) : recentKudos.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum reconhecimento ainda"
            description="Seja o primeiro a reconhecer um colega!"
            compact
          />
        ) : (
          <div className="divide-y divide-border">
            <AnimatePresence mode="popLayout">
              {recentKudos.map((kudos, index) => (
                <KudosItem
                  key={kudos.id}
                  kudos={kudos}
                  index={index}
                  getProfileName={getProfileName}
                  getProfileInitial={getProfileInitial}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );
};
