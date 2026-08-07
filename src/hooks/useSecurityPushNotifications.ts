import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";
import { usePushDevices } from "@/hooks/usePushDevice";
import { buildNewDeviceMessage } from "@/lib/pushDevices";

interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  ip_address?: string;
  created_at: string;
  is_resolved: boolean;
}

interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  block_type: string;
  blocked_at: string;
}

interface LoginAttempt {
  id: string;
  email: string;
  ip_address: string | null;
  error_message: string | null;
  created_at: string;
}

interface NewDeviceAlert {
  id: string;
  user_id: string;
  device_id: string;
  ip_address: string;
  user_agent?: string | null;
  browser?: string;
  os?: string;
  created_at: string;
}

export function useSecurityPushNotifications() {
  const { user } = useAuth();
  const { isGranted, showNotification, requestPermission } = usePushNotifications();
  // Dispositivos já batizados pelo usuário: permitem dizer "iPhone do João"
  // em vez de "Chrome em Windows" no alerta de novo acesso.
  const { devices } = usePushDevices();

  // Helper to show security alert notification
  const notifySecurityAlert = useCallback((alert: SecurityAlert) => {
    const icon = getSeverityIcon(alert.severity);
    const tag = `security-alert-${alert.id}`;
    
    return showNotification(`${icon} ${alert.title}`, {
      body: alert.description,
      tag,
      requireInteraction: alert.severity === 'critical' || alert.severity === 'high',
      data: { 
        type: 'security_alert', 
        alertId: alert.id,
        url: '/security?tab=alerts' 
      },
    });
  }, [showNotification]);

  // Helper to show new device notification
  const notifyNewDevice = useCallback((alert: NewDeviceAlert) => {
    return showNotification('🔐 Novo dispositivo detectado', {
      body: buildNewDeviceMessage(alert, devices),
      tag: `new-device-${alert.id}`,
      requireInteraction: true,
      data: { 
        type: 'new_device', 
        alertId: alert.id,
        url: '/security?tab=devices' 
      },
    });
  }, [showNotification, devices]);

  // Subscribe to real-time security alerts
  useEffect(() => {
    if (!user?.id || !isGranted) return;

    // Listen for new security alerts (for admins)
    const securityAlertsChannel = supabase
      .channel('security-alerts-push')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_alerts',
        },
        (payload) => {
          const alert = payload.new as SecurityAlert;
          
          // Show in-app toast
          toast.warning(alert.title, {
            description: alert.description,
            action: {
              label: 'Ver',
              onClick: () => window.location.href = '/security?tab=alerts',
            },
          });
          
          // Show push notification
          notifySecurityAlert(alert);
        }
      )
      .subscribe();

    // Listen for new device alerts (for the specific user)
    const deviceAlertsChannel = supabase
      .channel('device-alerts-push')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'new_device_alerts',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const alert = payload.new as NewDeviceAlert;
          
          // Show push notification for new device
          notifyNewDevice(alert);
        }
      )
      .subscribe();

    // Listen for blocked IPs
    const blockedIPsChannel = supabase
      .channel('blocked-ips-push')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'blocked_ips',
        },
        (payload) => {
          const blocked = payload.new as BlockedIP;
          
          showNotification('🚫 IP Bloqueado', {
            body: `IP ${blocked.ip_address} foi bloqueado: ${blocked.reason}`,
            tag: `blocked-ip-${blocked.id}`,
            data: { 
              type: 'ip_blocked',
              url: '/security?tab=admin' 
            },
          });
        }
      )
      .subscribe();

    // Listen for login attempts (failed ones)
    const loginAttemptsChannel = supabase
      .channel('login-attempts-push')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'login_attempts',
        },
        (payload) => {
          const attempt = payload.new as LoginAttempt;
          
          // Only notify for failed attempts with error messages
          if (attempt.error_message) {
            // Check if it's a suspicious pattern (multiple failures)
            showNotification('⚠️ Tentativa de login suspeita', {
              body: `Tentativa falha de ${attempt.email} (IP: ${attempt.ip_address})`,
              tag: `login-attempt-${attempt.id}`,
              data: { 
                type: 'failed_login',
                url: '/security?tab=admin' 
              },
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(securityAlertsChannel);
      supabase.removeChannel(deviceAlertsChannel);
      supabase.removeChannel(blockedIPsChannel);
      supabase.removeChannel(loginAttemptsChannel);
    };
  }, [user?.id, isGranted, notifySecurityAlert, notifyNewDevice, showNotification]);

  return {
    isGranted,
    requestPermission,
    notifySecurityAlert,
    notifyNewDevice,
  };
}

function getSeverityIcon(severity: string): string {
  switch (severity) {
    case 'critical':
      return '🚨';
    case 'high':
      return '⚠️';
    case 'medium':
      return '🔔';
    case 'low':
      return 'ℹ️';
    default:
      return '🔐';
  }
}
