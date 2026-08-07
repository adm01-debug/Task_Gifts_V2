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
  const searchResults = useFuseSearch(otherUsers, ['display_name', 'email'], searchQuery, { ...SEARCH_PRESETS.loose, limit: 20 });
  const filteredUsers = searchResults.map(r => r.item);

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
        onSuccess();
      },
    });
  }, [user?.id, selectedUser, message, selectedBadge?.id, giveKudos, onSuccess, validateMessage]);

  return (
    <div ref={ref} className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {badges.slice(0, 4).map((badge) => (
          <button key={badge.id} onClick={() => setSelectedBadge(badge)} className={cn("p-2 rounded border text-center", selectedBadge?.id === badge.id ? "bg-primary/10 border-primary" : "border-border")}>
            <span className="text-xl">{badge.icon}</span>
          </button>
        ))}
      </div>
      <input type="text" placeholder="Para quem?" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full p-2 border rounded text-sm" />
      <ScrollArea className="h-32">
        {filteredUsers.slice(0, 5).map(p => (
           <button key={p.id} onClick={() => setSelectedUser(p.id)} className={cn("w-full p-2 text-left text-sm", selectedUser === p.id ? "bg-primary/5" : "")}>
             {p.display_name}
           </button>
        ))}
      </ScrollArea>
      <Textarea placeholder="Mensagem..." value={message} onChange={e => setMessage(e.target.value)} className="text-sm" />
      <Button onClick={handleSubmit} disabled={!selectedUser || !message.trim()} className="w-full">Enviar</Button>
    </div>
  );
});
GiveKudosForm.displayName = "GiveKudosForm";

const PeerRecognitionComponent = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: recentKudos = [], isLoading } = useRecentKudos(10);
  const { data: profiles = [] } = useProfiles();

  const getProfileName = (userId: string) => profiles.find(p => p.id === userId)?.display_name || "Usuário";

  if (isLoading) return <SkeletonKudosList count={3} />;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 pb-2 flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-pink-500" />
          <CardTitle className="text-sm">Kudos</CardTitle>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
           <DialogTrigger asChild><Button size="icon-xs" variant="ghost" className="h-7 w-auto px-2 text-[10px]">Dar Kudos</Button></DialogTrigger>
          <DialogContent><GiveKudosForm onSuccess={() => setDialogOpen(false)} /></DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto max-h-[300px]">
        {recentKudos.length === 0 ? <EmptyState icon={Users} title="Sem kudos" compact /> : (
          <div className="divide-y divide-border">
            {recentKudos.map((k) => (
              <div key={k.id} className="p-3 text-[11px]">
                <p><strong>{getProfileName(k.from_user_id)}</strong> → {getProfileName(k.to_user_id)}</p>
                <p className="text-muted-foreground mt-0.5 line-clamp-2">{k.message}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const PeerRecognitionLazy = memo(PeerRecognitionComponent);
export const PeerRecognition = PeerRecognitionLazy;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
