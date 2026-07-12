import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, verifyUser } from "../_shared/security.ts";
import { withSentry, addBreadcrumb, captureException } from "../_shared/sentry.ts";

interface DeviceRequest {
  userId: string;
  fingerprint: string;
  userAgent: string;
  browser?: string;
  os?: string;
  deviceType?: string;
}

serve(withSentry("detect-new-device", async (req, { requestId }) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user JWT
    const authenticatedUser = await verifyUser(req);
    addBreadcrumb("device:auth", { userId: authenticatedUser?.id, requestId });
    
    const body: DeviceRequest = await req.json();
    const { userId: bodyUserId, fingerprint, userAgent, browser, os, deviceType } = body;
    
    // Ensure the user is only registering devices for themselves
    const userId = authenticatedUser.id;

    
    if (!userId || !fingerprint) {
      return new Response(
        JSON.stringify({ error: "userId and fingerprint are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get IP from request headers
    const forwarded = req.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0].trim() : "0.0.0.0";
    
    console.log(`Registering device for user ${userId} from IP ${ipAddress}`);
    
    // Call the database function to register device
    const { data, error } = await supabase.rpc("register_device", {
      p_user_id: userId,
      p_fingerprint: fingerprint,
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
      p_browser: browser || null,
      p_os: os || null,
      p_device_type: deviceType || "desktop"
    });
    
    if (error) {
      console.error("Error registering device:", error);
      throw error;
    }
    
    console.log(`Device registration result:`, data);
    
    // If new device, send email notification and log security event
    if (data?.is_new_device) {
      console.log(`New device detected for user ${userId}: ${browser} on ${os}`);
      
      // Get user email
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, display_name")
        .eq("id", userId)
        .single();
      
      // Insert security alert
      await supabase.from("security_alerts").insert({
        alert_type: "new_device",
        severity: "low",
        title: `Novo dispositivo detectado`,
        description: `Login de novo dispositivo: ${browser || "Desconhecido"} em ${os || "Desconhecido"}`,
        user_id: userId,
        ip_address: ipAddress,
        metadata: {
          device_id: data.device_id,
          browser,
          os,
          device_type: deviceType,
          fingerprint: fingerprint.substring(0, 8) + "..."
        }
      });
      
      // Send email notification via Resend API
      if (resendApiKey && profile?.email) {
        try {
          const currentDate = new Date().toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo"
          });
          
          const emailHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🔐 Alerta de Segurança</h1>
              </div>
              
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                  Olá <strong>${profile.display_name || "usuário"}</strong>,
                </p>
                
                <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                  Detectamos um login na sua conta a partir de um novo dispositivo:
                </p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Navegador:</td>
                      <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${browser || "Desconhecido"}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Sistema:</td>
                      <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${os || "Desconhecido"}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Endereço IP:</td>
                      <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${ipAddress}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Data/Hora:</td>
                      <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${currentDate}</td>
                    </tr>
                  </table>
                </div>
                
                <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
                  Se foi você quem fez este login, pode ignorar este email. 
                  Caso não reconheça esta atividade, recomendamos que altere sua senha imediatamente.
                </p>
                
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px;">
                  <p style="margin: 0; color: #92400e; font-size: 14px;">
                    <strong>⚠️ Dica de segurança:</strong> Nunca compartilhe sua senha com terceiros e 
                    ative a autenticação de dois fatores para maior proteção.
                  </p>
                </div>
              </div>
              
              <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
                Este é um email automático do sistema Task Gifts. Por favor, não responda.
              </p>
            </div>
          `;
          
          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              from: "Task Gifts <onboarding@resend.dev>",
              to: [profile.email],
              subject: "🔐 Novo dispositivo detectado na sua conta",
              html: emailHtml
            })
          });
          
          if (emailResponse.ok) {
            console.log(`Email notification sent to ${profile.email}`);
          } else {
            const errorData = await emailResponse.text();
            console.error("Resend API error:", errorData);
          }
        } catch (emailError) {
          console.error("Error sending email notification:", emailError);
          // Don't throw - email is optional
        }
      }
    }
    
    return new Response(
      JSON.stringify({
        is_new_device: data?.is_new_device || false,
        device_id: data?.device_id,
        is_trusted: data?.is_trusted || false
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
    
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    captureException(error, { fn: "detect-new-device", requestId });
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
}));
