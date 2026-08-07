import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { notificationsService, type Notification } from "@/services/notificationsService";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (userId: string) => [...notificationKeys.all, "list", userId] as const,
  unread: (userId: string) => [...notificationKeys.all, "unread", userId] as const,
  count: (userId: string) => [...notificationKeys.all, "count", userId] as const,
};

export function useNotifications(limit = 50) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);

  // Fetch notifications
  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: notificationKeys.list(user?.id ?? ""),
    queryFn: () => notificationsService.getAll(user!.id, limit),
    enabled: !!user?.id,
  });

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: notificationKeys.count(user?.id ?? ""),
    queryFn: () => notificationsService.getUnreadCount(user!.id),
    enabled: !!user?.id,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;

          // Update cache immediately
          queryClient.setQueryData<Notification[]>(
            notificationKeys.list(user.id),
            (old = []) => [newNotification, ...old]
          );

          // Update unread count
          queryClient.setQueryData<number>(
            notificationKeys.count(user.id),
            (old = 0) => old + 1
          );

          // Show toast notification
          toast({
            title: newNotification.title,
            description: newNotification.message ?? undefined,
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;

          // Update cache
          queryClient.setQueryData<Notification[]>(
            notificationKeys.list(user.id),
            (old = []) =>
              old.map((n) =>
                n.id === updatedNotification.id ? updatedNotification : n
              )
          );

          // Recalculate unread count
          queryClient.invalidateQueries({
            queryKey: notificationKeys.count(user.id),
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;

          // Update cache
          queryClient.setQueryData<Notification[]>(
            notificationKeys.list(user.id),
            (old = []) => old.filter((n) => n.id !== deletedId)
          );

          // Recalculate unread count
          queryClient.invalidateQueries({
            queryKey: notificationKeys.count(user.id),
          });
        }
      )
      .subscribe((status) => {
        setRealtimeEnabled(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, toast]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    realtimeEnabled,
  };
}

export function useMarkAsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsService.markAsRead(notificationId),
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: notificationKeys.list(user.id),
        });
        queryClient.invalidateQueries({
          queryKey: notificationKeys.count(user.id),
        });
      }
    },
  });
}

export function useMarkAllAsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error("User not authenticated");
      return notificationsService.markAllAsRead(user.id);
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: notificationKeys.list(user.id),
        });
        queryClient.setQueryData(notificationKeys.count(user.id), 0);
      }
    },
  });
}

export function useDeleteNotification() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsService.delete(notificationId),
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: notificationKeys.list(user.id),
        });
        queryClient.invalidateQueries({
          queryKey: notificationKeys.count(user.id),
        });
      }
    },
  });
}

export function useClearAllNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error("User not authenticated");
      return notificationsService.deleteAll(user.id);
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.setQueryData(notificationKeys.list(user.id), []);
        queryClient.setQueryData(notificationKeys.count(user.id), 0);
      }
    },
  });
}

// Hook for sending notifications (useful for testing and internal use)
export function useSendNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationsService.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.list(data.user_id),
      });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.count(data.user_id),
      });
    },
  });
}
