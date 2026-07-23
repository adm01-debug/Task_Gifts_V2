import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { organizationService, type Organization } from "@/services/organizationService";
import { supabase } from "@/integrations/supabase/client";

const HOSTNAME = typeof window !== "undefined" ? window.location.hostname : "";
// Hostnames that should never be treated as tenant custom domains.
const RESERVED_HOSTS = /(^localhost$|^127\.|\.lovable\.app$|\.lovableproject\.com$|\.lovable\.dev$)/i;
const IS_CUSTOM_HOST = HOSTNAME !== "" && !RESERVED_HOSTS.test(HOSTNAME);

export function useOrganization() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery<Organization | null>({
    queryKey: ["organization", HOSTNAME, user?.id ?? "anon"],
    queryFn: async () => {
      // 1) Resolve by custom domain first (works pre-auth for login page branding).
      if (IS_CUSTOM_HOST) {
        const byHost = await organizationService.getOrganizationByHostname(HOSTNAME);
        if (byHost) return byHost;
      }
      // 2) Fall back to the authenticated user's org membership.
      if (user?.id) return organizationService.getMyOrganization(user.id);
      return null;
    },
    enabled: IS_CUSTOM_HOST || !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!query.data?.id) return;
    const channel = supabase
      .channel(`org-${query.data.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "organizations", filter: `id=eq.${query.data.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["organization"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [query.data?.id, qc, user?.id]);

  return query;
}