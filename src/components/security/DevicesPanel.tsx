import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Shield, 
  ShieldCheck, 
  Trash2,
  Clock,
  MapPin
} from 'lucide-react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Device {
  id: string;
  device_fingerprint: string;
  ip_address: string;
  browser: string;
  os: string;
  device_type: string;
  is_trusted: boolean;
  first_seen_at: string;
  last_seen_at: string;
}

export const DevicesPanel = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getUserDevices, trustDevice, removeDevice, generateFingerprint } = useDeviceDetection();
  const currentFingerprint = generateFingerprint().fingerprint;

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setIsLoading(true);
    const data = await getUserDevices();
    setDevices(data as Device[]);
    setIsLoading(false);
  };

  const handleTrust = async (deviceId: string) => {
    const success = await trustDevice(deviceId);
    if (success) {
      toast.success('Dispositivo marcado como confiável');
      loadDevices();
    } else {
      toast.error('Erro ao marcar dispositivo como confiável');
    }
  };

  const handleRemove = async (deviceId: string) => {
    const success = await removeDevice(deviceId);
    if (success) {
      toast.success('Dispositivo removido');
      loadDevices();
    } else {
      toast.error('Erro ao remover dispositivo');
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="h-5 w-5" />;
      case 'tablet': return <Tablet className="h-5 w-5" />;
      default: return <Monitor className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dispositivos Conectados</CardTitle>
          <CardDescription>Gerencie os dispositivos que acessaram sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Dispositivos Conectados
        </CardTitle>
        <CardDescription>
          Gerencie os dispositivos que acessaram sua conta. Remova dispositivos desconhecidos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {devices.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhum dispositivo registrado
          </p>
        ) : (
          devices.map((device) => {
            const isCurrentDevice = device.device_fingerprint === currentFingerprint;
            
            return (
              <div
                key={device.id}
                className={`p-4 rounded-lg border ${
                  isCurrentDevice ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      {getDeviceIcon(device.device_type)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {device.browser || 'Navegador'} em {device.os || 'Sistema'}
                        </span>
                        {isCurrentDevice && (
                          <Badge variant="secondary" className="text-xs">
                            Este dispositivo
                          </Badge>
                        )}
                        {device.is_trusted && (
                          <Badge variant="outline" className="text-xs text-green-600">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Confiável
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          IP: {device.ip_address || 'Desconhecido'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Último acesso: {formatDistanceToNow(new Date(device.last_seen_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </span>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Primeiro acesso: {formatDistanceToNow(new Date(device.first_seen_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {!device.is_trusted && !isCurrentDevice && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTrust(device.id)}
                      >
                        <ShieldCheck className="h-4 w-4 mr-1" />
                        Confiar
                      </Button>
                    )}
                    {!isCurrentDevice && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemove(device.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
