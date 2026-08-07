import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const key = Deno.env.get("VAPID_PUBLIC_KEY") ?? null;
  return new Response(JSON.stringify({ publicKey: key }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});