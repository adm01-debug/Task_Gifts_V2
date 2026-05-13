import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/services/loggingService";
import * as OTPAuth from "otpauth";

export interface TwoFactorSettings {
  id: string;
  user_id: string;
  is_enabled: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TwoFactorSetupData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

class TwoFactorService {
  private generateSecret(): string {
    const secret = new OTPAuth.Secret({ size: 20 });
    return secret.base32;
  }

  private generateBackupCodes(count: number = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  async getSettings(userId: string): Promise<TwoFactorSettings | null> {
    const { data, error } = await supabase
      .from("user_two_factor")
      .select("id, user_id, is_enabled, verified_at, created_at, updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      logger.apiError('getSettings', error, 'twoFactorService');
      throw error;
    }

    return data;
  }

  async setupTwoFactor(userId: string, email: string): Promise<TwoFactorSetupData> {
    const secret = this.generateSecret();
    const backupCodes = this.generateBackupCodes();

    const totp = new OTPAuth.TOTP({
      issuer: "GameficaRH",
      label: email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: secret,
    });

    const qrCodeUrl = totp.toString();

    // Check if record exists
    const existing = await this.getSettings(userId);

    if (existing) {
      const { error } = await supabase
        .from("user_two_factor")
        .update({
          totp_secret: secret,
          backup_codes: backupCodes,
          is_enabled: false,
          verified_at: null,
        })
        .eq("user_id", userId);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("user_two_factor")
        .insert({
          user_id: userId,
          totp_secret: secret,
          backup_codes: backupCodes,
          is_enabled: false,
        });

      if (error) throw error;
    }

    return { secret, qrCodeUrl, backupCodes };
  }

  async verifyAndEnable(userId: string, token: string): Promise<boolean> {
    // Get the secret from database
    const { data, error } = await supabase
      .from("user_two_factor")
      .select("totp_secret")
      .eq("user_id", userId)
      .single();

    if (error || !data?.totp_secret) {
      throw new Error("2FA not configured");
    }

    const totp = new OTPAuth.TOTP({
      issuer: "GameficaRH",
      label: "user",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: data.totp_secret,
    });

    const delta = totp.validate({ token, window: 1 });

    if (delta === null) {
      return false;
    }

    // Enable 2FA
    const { error: updateError } = await supabase
      .from("user_two_factor")
      .update({
        is_enabled: true,
        verified_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) throw updateError;

    return true;
  }

  async verifyToken(userId: string, token: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("user_two_factor")
      .select("totp_secret, backup_codes, is_enabled")
      .eq("user_id", userId)
      .single();

    if (error || !data?.is_enabled) {
      return true; // 2FA not enabled, allow access
    }

    // Check if it's a backup code
    if (data.backup_codes?.includes(token.toUpperCase())) {
      // Remove used backup code
      const newCodes = data.backup_codes.filter(
        (code: string) => code !== token.toUpperCase()
      );
      await supabase
        .from("user_two_factor")
        .update({ backup_codes: newCodes })
        .eq("user_id", userId);
      return true;
    }

    // Verify TOTP
    const totp = new OTPAuth.TOTP({
      issuer: "GameficaRH",
      label: "user",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: data.totp_secret,
    });

    const delta = totp.validate({ token, window: 1 });
    return delta !== null;
  }

  async disable(userId: string): Promise<void> {
    const { error } = await supabase
      .from("user_two_factor")
      .update({
        is_enabled: false,
         totp_secret: "",
         backup_codes: [],
         verified_at: "",
      })
      .eq("user_id", userId);

    if (error) throw error;
  }

  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("user_two_factor")
      .select("is_enabled")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      logger.apiError('isEnabled', error, 'twoFactorService');
      return false;
    }

    return data?.is_enabled ?? false;
  }
}

export const twoFactorService = new TwoFactorService();
