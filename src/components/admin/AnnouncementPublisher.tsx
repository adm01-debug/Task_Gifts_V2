import { useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, Plus, Edit2, Trash2, Save, X, Pin, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";


export function AnnouncementPublisher() {
  const { announcements, isLoading, createAnnouncement, isCreating } = useAnnouncements();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "general",
    is_pinned: false,
    expires_at: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAnnouncement(
      {
        title: formData.title,
        content: formData.content,
        category: formData.category as "general" | "urgent" | "event" | "policy" | "achievement",
        is_pinned: formData.is_pinned,
        expires_at: formData.expires_at || undefined,
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
          setFormData({
            title: "",
            content: "",
            category: "general",
            is_pinned: false,
            expires_at: "",
          });
        },
      }
    );
  };

  const categoryColors: Record<string, string> = {
    general: "bg-blue-500/10 text-blue-500",
    urgent: "bg-red-500/10 text-red-500",
    event: "bg-purple-500/10 text-purple-500",
    update: "bg-green-500/10 text-green-500",
    policy: "bg-orange-500/10 text-orange-500",
  };

  const categoryLabels: Record<string, string> = {
    general: "Geral",
    urgent: "Urgente",
    event: "Evento",
    update: "Atualização",
    policy: "Política",
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-8">
          <div className="h-40 bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Anúncios</h2>
          <p className="text-muted-foreground">Publique comunicados para toda a empresa</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Anúncio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Anúncio</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título do anúncio"
                  required
                />
              </div>
              <div>
                <Label htmlFor="content">Conteúdo</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Escreva o conteúdo do anúncio..."
                  rows={4}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Geral</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                      <SelectItem value="event">Evento</SelectItem>
                      <SelectItem value="update">Atualização</SelectItem>
                      <SelectItem value="policy">Política</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="expires_at">Expira em</Label>
                  <Input
                    id="expires_at"
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="pinned">Fixar no topo</Label>
                <Switch
                  id="pinned"
                  checked={formData.is_pinned}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_pinned: checked })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreating}>
                  <Save className="w-4 h-4 mr-2" />
                  {isCreating ? "Publicando..." : "Publicar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum anúncio</h3>
            <p className="text-muted-foreground mb-4">Publique seu primeiro comunicado</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Anúncio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement, index) => (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {announcement.is_pinned && (
                        <Pin className="w-4 h-4 text-primary mt-1" />
                      )}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base">{announcement.title}</CardTitle>
                          <Badge className={categoryColors[announcement.category]} variant="secondary">
                            {categoryLabels[announcement.category]}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs">
                          Publicado em {format(new Date(announcement.published_at || announcement.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          {announcement.expires_at && (
                            <> · Expira em {format(new Date(announcement.expires_at), "dd/MM/yyyy", { locale: ptBR })}</>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{announcement.content}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {announcement.view_count} visualizações
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
