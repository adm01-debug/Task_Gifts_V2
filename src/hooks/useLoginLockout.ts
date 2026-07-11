import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/services/loggingService";

interface LockoutStatus {
  is_locked: boolean;
  failed_attempts: number;
  remaining_seconds: number;
  lockout_until: string | null;
  lockout_minutes?: number;
}

export function useLoginLockout(email: string) {
  const [lockoutStatus, setLockoutStatus] = useState<LockoutStatus | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  // Check lockout status
  const checkLockout = useCallback(async () => {
    if (!email || email.length < 3) {
      setLockoutStatus(null);
      setRemainingTime(0);
      return null;
    }

    setIsChecking(true);
    try {
      const { data, error } = await supabase.rpc("check_login_lockout", {
        p_email: email.toLowerCase().trim(),
      });

      if (error) {
        logger.apiError('checkLockout', error, 'useLoginLockout');
        return null;
      }

      const status = data as unknown as LockoutStatus;
      setLockoutStatus(status);
      setRemainingTime(status?.remaining_seconds || 0);
      return status;
    } catch (err: unknown) {
      logger.apiError('checkLockout', err, 'useLoginLockout');
      return null;
    } finally {
      setIsChecking(false);
    }
  }, [email]);

  // Log failed login attempt
  const logFailedAttempt = useCallback(async (errorMessage: string) => {
    if (!email) return null;

    try {
      const { data, error } = await supabase.rpc("log_login_attempt", {
        p_email: email.toLowerCase().trim(),
        p_ip_address: null,
        p_user_agent: navigator.userAgent,
        p_attempt_type: "password",
        p_error_message: errorMessage,
      });

      if (error) {
        logger.apiError('logFailedAttempt', error, 'useLoginLockout');
        return null;
      }

      const result = data as unknown as { log_id: string; lockout_status: LockoutStatus };
      if (result?.lockout_status) {
        setLockoutStatus(result.lockout_status);
        setRemainingTime(result.lockout_status.remaining_seconds || 0);
        return result.lockout_status;
      }
      return null;
    } catch (err: unknown) {
      logger.apiError('logFailedAttempt', err, 'useLoginLockout');
      return null;
    }
  }, [email]);

  // Reset attempts after successful login
  const resetAttempts = useCallback(async () => {
    if (!email) return;

    try {
      await supabase.rpc("reset_login_attempts", {
        p_email: email.toLowerCase().trim(),
      });
      setLockoutStatus(null);
      setRemainingTime(0);
    } catch (err: unknown) {
      logger.apiError('resetAttempts', err, 'useLoginLockout');
    }
  }, [email]);

  // Countdown timer
  useEffect(() => {
    if (remainingTime <= 0) return;

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          setLockoutStatus((status) =>
            status ? { ...status, is_locked: false, remaining_seconds: 0 } : null
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingTime]);

  // Format remaining time for display
  const formatRemainingTime = useCallback(() => {
    if (remainingTime <= 0) return "";
    
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${seconds}s`;
  }, [remainingTime]);

  return {
    lockoutStatus,
    remainingTime,
    isLocked: lockoutStatus?.is_locked ?? false,
    failedAttempts: lockoutStatus?.failed_attempts ?? 0,
    isChecking,
    checkLockout,
    logFailedAttempt,
    resetAttempts,
    formatRemainingTime,
  };
}
