import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { organizationService, type Organization } from "@/services/organizationService";
import { supabase } from "@/integrations/supabase/client";

export function useOrganization() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery<Organization | null>({
    queryKey: ["organization", user?.id ?? "anon"],
    queryFn: () => (user?.id ? organizationService.getMyOrganization(user.id) : Promise.resolve(null)),
    enabled: !!user?.id,
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
          qc.invalidateQueries({ queryKey: ["organization", user?.id] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [query.data?.id, qc, user?.id]);

  return query;
}