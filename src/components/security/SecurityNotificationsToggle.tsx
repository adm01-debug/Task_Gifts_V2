import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, BellRing, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { useSecurityPushNotifications } from "@/hooks/useSecurityPushNotifications";
import { toast } from "sonner";
import { logger } from "@/services/loggingService";

export function SecurityNotificationsToggle() {
  const { isGranted, requestPermission } = useSecurityPushNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [notificationTypes, setNotificationTypes] = useState({
    securityAlerts: true,
    newDevices: true,
    blockedIPs: true,
    failedLogins: true,
  });

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('security-notification-prefs');
    if (saved) {
      try {
        setNotificationTypes(JSON.parse(saved));
      } catch (e) {
        logger.warn('Error loading notification preferences', 'SecurityNotificationsToggle', e);
      }
    }
  }, []);

  // Save preferences to localStorage
  const updatePreference = (key: keyof typeof notificationTypes, value: boolean) => {
    const updated = { ...notificationTypes, [key]: value };
    setNotificationTypes(updated);
    localStorage.setItem('security-notification-prefs', JSON.stringify(updated));
    toast.success('Preferências salvas');
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        toast.success('Notificações de segurança ativadas!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = () => {
    if (!isGranted) {
      toast.error('Ative as notificações primeiro');
      return;
    }

    // Send test notification via service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        payload: {
          title: '🔐 Teste de Notificação de Segurança',
          options: {
            body: 'Se você está vendo isso, as notificações estão funcionando corretamente!',
            tag: 'security-test',
            icon: '/favicon.ico',
            data: { type: 'security_alert', url: '/security' },
          },
        },
      });
      toast.success('Notificação de teste enviada!');
    } else {
      // Fallback to regular notification
      new Notification('🔐 Teste de Notificação de Segurança', {
        body: 'Se você está vendo isso, as notificações estão funcionando corretamente!',
        icon: '/favicon.ico',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-5 w-5 text-primary" />
          Notificações Push de Segurança
        </CardTitle>
        <CardDescription>
          Receba alertas em tempo real sobre eventos de segurança importantes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-3">
            {isGranted ? (
              <div className="p-2 rounded-full bg-green-500/10">
                <Bell className="h-5 w-5 text-green-500" />
              </div>
            ) : (
              <div className="p-2 rounded-full bg-yellow-500/10">
                <BellOff className="h-5 w-5 text-yellow-500" />
              </div>
            )}
            <div>
              <p className="font-medium">Notificações Push</p>
              <p className="text-sm text-muted-foreground">
                {isGranted 
                  ? 'Ativadas - você receberá alertas em tempo real'
                  : 'Desativadas - ative para receber alertas'}
              </p>
            </div>
          </div>
          {isGranted ? (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Ativo
            </Badge>
          ) : (
            <Button onClick={handleEnableNotifications} disabled={isLoading}>
              {isLoading ? 'Ativando...' : 'Ativar'}
            </Button>
          )}
        </div>

        {/* Notification type toggles */}
        {isGranted && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Tipos de Notificação</h4>
            
            <div className="space-y-3">
              {/* Security Alerts */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Alertas de Segurança</p>
                    <p className="text-xs text-muted-foreground">
                      Ataques, violações e atividades suspeitas
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notificationTypes.securityAlerts}
                  onCheckedChange={(checked) => updatePreference('securityAlerts', checked)}
                />
              </div>

              {/* New Devices */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Info className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Novos Dispositivos</p>
                    <p className="text-xs text-muted-foreground">
                      Logins de dispositivos desconhecidos
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notificationTypes.newDevices}
                  onCheckedChange={(checked) => updatePreference('newDevices', checked)}
                />
              </div>

              {/* Blocked IPs */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">IPs Bloqueados</p>
                    <p className="text-xs text-muted-foreground">
                      Quando um IP é bloqueado automaticamente
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notificationTypes.blockedIPs}
                  onCheckedChange={(checked) => updatePreference('blockedIPs', checked)}
                />
              </div>

              {/* Failed Logins */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">Tentativas de Login Falhas</p>
                    <p className="text-xs text-muted-foreground">
                      Tentativas suspeitas de acesso
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notificationTypes.failedLogins}
                  onCheckedChange={(checked) => updatePreference('failedLogins', checked)}
                />
              </div>
            </div>

            {/* Test button */}
            <div className="pt-4 border-t">
              <Button variant="outline" size="sm" onClick={handleTestNotification}>
                <Bell className="h-4 w-4 mr-2" />
                Testar Notificação
              </Button>
            </div>
          </div>
        )}

        {/* Info box */}
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm">
          <p className="text-blue-600 dark:text-blue-400">
            <strong>Dica:</strong> Mantenha as notificações ativas para ser alertado imediatamente sobre 
            atividades suspeitas na sua conta, mesmo quando não estiver usando o sistema.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
