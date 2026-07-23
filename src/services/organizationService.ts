import { supabase } from "@/integrations/supabase/client";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  custom_domain: string | null;
  tagline: string | null;
  created_at: string;
  updated_at: string;
}

export type OrganizationUpdate = Partial<
  Pick<
    Organization,
    | "name"
    | "logo_url"
    | "favicon_url"
    | "primary_color"
    | "secondary_color"
    | "accent_color"
    | "custom_domain"
    | "tagline"
  >
>;

export const organizationService = {
  async getMyOrganization(userId: string): Promise<Organization | null> {
    const { data: membership, error: memErr } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (memErr || !membership) return null;

    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", membership.org_id)
      .maybeSingle();
    if (error || !data) return null;
    return data as Organization;
  },

  async updateOrganization(id: string, patch: OrganizationUpdate, userId: string) {
    // Snapshot for rollback
    const { data: current } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (current) {
      await supabase.from("org_theme_history").insert({
        org_id: id,
        snapshot: current,
        changed_by: userId,
      });
    }
    const { data, error } = await supabase
      .from("organizations")
      .update(patch)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as Organization;
  },

  async uploadAsset(orgId: string, file: File, kind: "logo" | "favicon"): Promise<string> {
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${orgId}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("org-assets").upload(path, file, {
      upsert: true,
      contentType: file.type,
    });
    if (error) throw error;
    const { data } = await supabase.storage.from("org-assets").createSignedUrl(path, 60 * 60 * 24 * 365);
    return data?.signedUrl ?? path;
  },
};