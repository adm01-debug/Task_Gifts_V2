import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { CATEGORY_CONFIG, type Announcement } from "@/services/announcementsService";
import { Megaphone, Pin, Plus, Eye, MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

const REACTION_EMOJIS = ['👍', '❤️', '🎉', '🚀', '👀'];

export function AnnouncementsBoard() {
  const { 
    announcements, 
    pinnedAnnouncements, 
    unreadCount,
    createAnnouncement,
    markAsRead,
    react,
    isCreating,
    isLoading
  } = useAnnouncements();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    category: "general" as Announcement['category'],
  });

  const handleCreate = () => {
    if (!newAnnouncement.title || !newAnnouncement.content) return;
    
    createAnnouncement(newAnnouncement);
    setIsDialogOpen(false);
    setNewAnnouncement({ title: "", content: "", category: "general" });
  };

  const renderAnnouncement = (announcement: Announcement) => {
    const config = CATEGORY_CONFIG[announcement.category];
    const reactionCounts = announcement.reactions?.reduce((acc, r) => {
      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return (
      <motion.div
        key={announcement.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-lg border ${
          !announcement.is_read ? 'bg-primary/5 border-primary/20' : 'bg-card'
        }`}
        onClick={() => !announcement.is_read && markAsRead(announcement.id)}
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${config.color} text-white shrink-0`}>
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold truncate">{announcement.title}</h4>
              {announcement.is_pinned && (
                <Pin className="h-3 w-3 text-primary shrink-0" />
              )}
              {!announcement.is_read && (
                <Badge variant="secondary" className="text-xs shrink-0">Novo</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {announcement.content}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{announcement.author?.display_name || 'Anônimo'}</span>
              <span>
                {format(new Date(announcement.published_at!), "d MMM", { locale: ptBR })}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {announcement.view_count}
              </span>
            </div>
            
            <div className="flex items-center gap-2 mt-3">
              {REACTION_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={(e) => {
                    e.stopPropagation();
                    react({ announcementId: announcement.id, emoji });
                  }}
                  className={`text-sm px-2 py-1 rounded-full hover:bg-muted transition-colors ${
                    reactionCounts[emoji] ? 'bg-muted' : ''
                  }`}
                >
                  {emoji} {reactionCounts[emoji] || ''}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton variant="glow" shape="circle" className="h-5 w-5" />
            <Skeleton variant="shimmer" className="h-5 w-40" />
          </div>
          <Skeleton variant="shimmer" shape="pill" className="h-9 w-20" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 rounded-lg border border-border space-y-3">
                <div className="flex gap-3">
                  <Skeleton variant="glow" shape="circle" className="h-10 w-10 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton variant="shimmer" className="h-4 w-3/4" />
                    <Skeleton variant="shimmer" className="h-3 w-1/2" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Skeleton variant="shimmer" className="h-3 w-full" />
                  <Skeleton variant="shimmer" className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Mural de Anúncios</CardTitle>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount}</Badge>
          )}
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Novo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Anúncio</DialogTitle>
              <DialogDescription>
                Crie um novo anúncio para compartilhar com a equipe.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Título"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
              />
              <Select 
                value={newAnnouncement.category}
                onValueChange={(value: Announcement['category']) => 
                  setNewAnnouncement(prev => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.icon} {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Conteúdo do anúncio..."
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
              />
              <Button 
                onClick={handleCreate} 
                disabled={isCreating || !newAnnouncement.title || !newAnnouncement.content}
                className="w-full"
              >
                Publicar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {pinnedAnnouncements.map(renderAnnouncement)}
            {announcements
              .filter(a => !a.is_pinned)
              .map(renderAnnouncement)
            }
            {announcements.length === 0 && pinnedAnnouncements.length === 0 && (
              <EmptyState
                icon={MessageCircle}
                title="Nenhum anúncio publicado"
                description="Seja o primeiro a compartilhar uma novidade com a equipe"
                compact
              />
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
