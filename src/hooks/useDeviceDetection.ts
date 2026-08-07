import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeSafe } from '@/lib/requestId';
import { logger } from '@/services/loggingService';
import { collectFingerprintSignals, computeDeviceFingerprint } from '@/lib/deviceFingerprint';

interface DeviceInfo {
  fingerprint: string;
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  userAgent: string;
}

interface DeviceAlert {
  id: string;
  user_id: string;
  device_id: string;
  ip_address: string;
  user_agent: string;
  is_read: boolean;
  is_acknowledged: boolean;
  created_at: string;
}

interface UserDevice {
  id: string;
  user_id: string;
  device_fingerprint: string;
  ip_address: string;
  user_agent: string;
  browser: string;
  os: string;
  device_type: string;
  is_trusted: boolean;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
}

export const useDeviceDetection = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Gerar fingerprint do dispositivo
  const generateFingerprint = useCallback((): DeviceInfo => {
    const nav = navigator;

    // Mesma derivação usada pelas inscrições de push: é a chave que une
    // `user_devices` e `push_subscriptions` no mesmo aparelho.
    const fingerprint = computeDeviceFingerprint(collectFingerprintSignals());

    // Detectar browser
    const userAgent = nav.userAgent;
    let browser = 'Desconhecido';
    if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Edg')) browser = 'Edge';
    else if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Opera')) browser = 'Opera';
    
    // Detectar OS
    let os = 'Desconhecido';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
    
    // Detectar tipo de dispositivo
    let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    if (/Mobi|Android/i.test(userAgent)) {
      deviceType = /Tablet|iPad/i.test(userAgent) ? 'tablet' : 'mobile';
    }
    
    return {
      fingerprint,
      browser,
      os,
      deviceType,
      userAgent
    };
  }, []);

  // Registrar dispositivo após login
  const registerDevice = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const deviceInfo = generateFingerprint();
      
      // Chamar edge function para registrar dispositivo
      const { data, error, requestId } = await invokeEdgeSafe<{
        is_new_device?: boolean;
        device_id?: string | null;
        is_trusted?: boolean;
      }>('detect-new-device', {
        body: {
          userId,
          fingerprint: deviceInfo.fingerprint,
          userAgent: deviceInfo.userAgent,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          deviceType: deviceInfo.deviceType
        }
      });

      if (error) throw new Error(`${error.message} (requestId=${requestId})`);
      
      return {
        isNewDevice: data?.is_new_device || false,
        deviceId: data?.device_id,
        isTrusted: data?.is_trusted || false
      };
    } catch (err: unknown) {
      logger.apiError('registerDevice', err, 'useDeviceDetection');
      return { isNewDevice: false, deviceId: null, isTrusted: false };
    } finally {
      setIsLoading(false);
    }
  }, [generateFingerprint]);

  // Buscar dispositivos do usuário
  const getUserDevices = useCallback(async (): Promise<UserDevice[]> => {
    const { data, error } = await supabase
      .from('user_devices')
      .select('*')
      .order('last_seen_at', { ascending: false });
    
    if (error) {
      logger.apiError('getUserDevices', error, 'useDeviceDetection');
      return [];
    }
    
    return (data || []) as UserDevice[];
  }, []);

  // Buscar alertas não lidos
  const getUnreadAlerts = useCallback(async (): Promise<DeviceAlert[]> => {
    const { data, error } = await supabase
      .from('new_device_alerts')
      .select('*')
      .eq('is_read', false)
      .order('created_at', { ascending: false });
    
    if (error) {
      logger.apiError('getUnreadAlerts', error, 'useDeviceDetection');
      return [];
    }
    
    return (data || []) as DeviceAlert[];
  }, []);

  // Marcar alerta como lido
  const markAlertAsRead = useCallback(async (alertId: string) => {
    const { error } = await supabase
      .from('new_device_alerts')
      .update({ is_read: true })
      .eq('id', alertId);
    
    if (error) {
      logger.apiError('markAlertAsRead', error, 'useDeviceDetection');
    }
  }, []);

  // Confirmar dispositivo como confiável
  const trustDevice = useCallback(async (deviceId: string) => {
    const { error } = await supabase
      .from('user_devices')
      .update({ is_trusted: true })
      .eq('id', deviceId);
    
    if (error) {
      logger.apiError('trustDevice', error, 'useDeviceDetection');
      return false;
    }
    
    return true;
  }, []);

  // Remover dispositivo
  const removeDevice = useCallback(async (deviceId: string) => {
    const { error } = await supabase
      .from('user_devices')
      .delete()
      .eq('id', deviceId);
    
    if (error) {
      logger.apiError('removeDevice', error, 'useDeviceDetection');
      return false;
    }
    
    return true;
  }, []);

  return {
    isLoading,
    generateFingerprint,
    registerDevice,
    getUserDevices,
    getUnreadAlerts,
    markAlertAsRead,
    trustDevice,
    removeDevice
  };
};
