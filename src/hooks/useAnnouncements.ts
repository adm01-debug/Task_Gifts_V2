import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { announcementsService, AnnouncementInsert } from "@/services/announcementsService";
import { useToast } from "@/hooks/use-toast";

export function useAnnouncements() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const announcementsQuery = useQuery({
    queryKey: ["announcements"],
    queryFn: () => announcementsService.getAnnouncements(20),
  });

  const pinnedQuery = useQuery({
    queryKey: ["announcements", "pinned"],
    queryFn: () => announcementsService.getPinnedAnnouncements(),
  });

  const unreadCount = announcementsService.getUnreadCount(announcementsQuery.data ?? []);

  const createAnnouncementMutation = useMutation({
    mutationFn: (announcement: AnnouncementInsert) => announcementsService.createAnnouncement(announcement),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({ title: "Anúncio publicado!" });
    },
    onError: () => {
      toast({ title: "Erro ao publicar anúncio", variant: "destructive" });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (announcementId: string) => announcementsService.markAsRead(announcementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });

  const reactMutation = useMutation({
    mutationFn: ({ announcementId, emoji }: { announcementId: string; emoji: string }) =>
      announcementsService.addReaction(announcementId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });

  const removeReactionMutation = useMutation({
    mutationFn: ({ announcementId, emoji }: { announcementId: string; emoji: string }) =>
      announcementsService.removeReaction(announcementId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: ({ announcementId, isPinned, expiresAt }: { announcementId: string; isPinned: boolean; expiresAt?: string }) =>
      announcementsService.togglePin(announcementId, isPinned, expiresAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({ title: "Anúncio atualizado!" });
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: (announcementId: string) => announcementsService.deleteAnnouncement(announcementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({ title: "Anúncio removido" });
    },
  });

  return {
    announcements: announcementsQuery.data ?? [],
    pinnedAnnouncements: pinnedQuery.data ?? [],
    unreadCount,
    isLoading: announcementsQuery.isLoading,
    createAnnouncement: createAnnouncementMutation.mutate,
    markAsRead: markAsReadMutation.mutate,
    react: reactMutation.mutate,
    removeReaction: removeReactionMutation.mutate,
    togglePin: togglePinMutation.mutate,
    deleteAnnouncement: deleteAnnouncementMutation.mutate,
    isCreating: createAnnouncementMutation.isPending,
  };
}
