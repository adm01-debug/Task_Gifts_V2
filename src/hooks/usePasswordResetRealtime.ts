import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface PasswordResetRequest {
  id: string;
  status: string;
  user_id: string;
  created_at: string;
}

type RealtimePayload = RealtimePostgresChangesPayload<PasswordResetRequest>;

export function usePasswordResetRealtime() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const handleNewRequest = useCallback((_payload: RealtimePayload) => {
    // Invalidate query to refresh the list
    queryClient.invalidateQueries({ queryKey: ["password-reset-requests"] });
    
    // Show toast notification
    toast.info("Nova solicitação de reset de senha", {
      description: "Um usuário solicitou redefinição de senha",
      duration: 5000,
      action: {
        label: "Ver",
        onClick: () => {
          // Scroll to admin panel or navigate
          const element = document.querySelector('[data-tab="reset-senha"]');
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        },
      },
    });
  }, [queryClient]);

  const handleStatusChange = useCallback((payload: RealtimePayload) => {
    queryClient.invalidateQueries({ queryKey: ["password-reset-requests"] });
    
    const newStatus = payload.new && 'status' in payload.new ? payload.new.status : null;
    if (newStatus === "approved") {
      toast.success("Solicitação de reset aprovada");
    } else if (newStatus === "rejected") {
      toast.info("Solicitação de reset rejeitada");
    }
  }, [queryClient]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("password-reset-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "password_reset_requests",
        },
        handleNewRequest
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "password_reset_requests",
        },
        handleStatusChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, handleNewRequest, handleStatusChange]);
}
