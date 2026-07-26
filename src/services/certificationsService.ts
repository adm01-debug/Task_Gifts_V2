import { supabase } from "@/integrations/supabase/client";
import { notificationsService } from "./notificationsService";

export interface Certification {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  validity_months: number | null;
  is_mandatory: boolean;
  xp_reward: number;
  coin_reward: number;
  department_id: string | null;
  trail_id: string | null;
  created_at: string;
}

export interface UserCertification {
  id: string;
  user_id: string;
  certification_id: string;
  issued_at: string;
  expires_at: string | null;
  renewed_at: string | null;
  renewal_count: number;
  status: 'active' | 'expiring_soon' | 'expired' | 'revoked';
  issued_by: string | null;
  notes: string | null;
  created_at: string;
  certificate_code?: string | null;
  verification_hash?: string | null;
  certification?: Certification;
}

/** Resultado público da verificação de autenticidade de um certificado. */
export interface CertificateVerification {
  certificate_code: string;
  holder_name: string;
  certification_name: string;
  certification_category: string;
  issued_at: string;
  expires_at: string | null;
  status: string;
  is_valid: boolean;
  verification_hash: string | null;
}

export const certificationsService = {
  async getAllCertifications(): Promise<Certification[]> {
    const { data, error } = await supabase
      .from('certifications')
      .select('*')
      .order('is_mandatory', { ascending: false })
      .order('category')
      .order('name');

    if (error) throw error;
    return data as Certification[];
  },

  async getMandatoryCertifications(): Promise<Certification[]> {
    const { data, error } = await supabase
      .from('certifications')
      .select('*')
      .eq('is_mandatory', true)
      .order('name');

    if (error) throw error;
    return data as Certification[];
  },

  async getUserCertifications(userId: string): Promise<UserCertification[]> {
    const { data, error } = await supabase
      .from('user_certifications')
      .select('*')
      .eq('user_id', userId)
      .order('issued_at', { ascending: false });

    if (error) throw error;
    
    // Fetch certification details
    const certIds = data.map(uc => uc.certification_id);
    const { data: certs } = await supabase
      .from('certifications')
      .select('*')
      .in('id', certIds);

    const certsMap = new Map(certs?.map(c => [c.id, c]) || []);
    
    return data.map(uc => ({
      ...uc,
      certification: certsMap.get(uc.certification_id) as Certification
    })) as UserCertification[];
  },

  async getExpiringCertifications(userId: string, daysAhead: number = 30): Promise<UserCertification[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const { data, error } = await supabase
      .from('user_certifications')
      .select('*')
      .eq('user_id', userId)
      .not('expires_at', 'is', null)
      .lte('expires_at', futureDate.toISOString())
      .in('status', ['active', 'expiring_soon'])
      .order('expires_at');

    if (error) throw error;

    // Fetch certification details
    const certIds = data.map(uc => uc.certification_id);
    const { data: certs } = await supabase
      .from('certifications')
      .select('*')
      .in('id', certIds);

    const certsMap = new Map(certs?.map(c => [c.id, c]) || []);
    
    return data.map(uc => ({
      ...uc,
      certification: certsMap.get(uc.certification_id) as Certification
    })) as UserCertification[];
  },

  async getExpiredCertifications(userId: string): Promise<UserCertification[]> {
    const { data, error } = await supabase
      .from('user_certifications')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'expired')
      .order('expires_at');

    if (error) throw error;

    const certIds = data.map(uc => uc.certification_id);
    const { data: certs } = await supabase
      .from('certifications')
      .select('*')
      .in('id', certIds);

    const certsMap = new Map(certs?.map(c => [c.id, c]) || []);
    
    return data.map(uc => ({
      ...uc,
      certification: certsMap.get(uc.certification_id) as Certification
    })) as UserCertification[];
  },

  async issueCertification(
    userId: string,
    certificationId: string,
    issuedBy?: string
  ): Promise<UserCertification> {
    // Get certification details for validity calculation
    const { data: cert, error: certError } = await supabase
      .from('certifications')
      .select('*')
      .eq('id', certificationId)
      .maybeSingle();

    if (certError) throw certError;
    if (!cert) throw new Error("Certification not found");

    const expiresAt = cert.validity_months
      ? new Date(Date.now() + cert.validity_months * 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from('user_certifications')
      .upsert({
        user_id: userId,
        certification_id: certificationId,
        issued_at: new Date().toISOString(),
        expires_at: expiresAt,
        status: 'active',
        issued_by: issuedBy,
        renewal_count: 0
      }, {
        onConflict: 'user_id,certification_id'
      })
      .select()
      .single();

    if (error) throw error;

    // Create notification
    await notificationsService.create({
      user_id: userId,
      title: '🎓 Nova Certificação!',
      message: `Você obteve a certificação "${cert.name}"${expiresAt ? ` válida até ${new Date(expiresAt).toLocaleDateString('pt-BR')}` : ''}`,
      type: 'achievement',
      data: { certification_id: certificationId }
    });

    return { ...data, certification: cert as Certification } as UserCertification;
  },

  async renewCertification(userCertificationId: string): Promise<UserCertification> {
    // Get current certification
    const { data: current, error: currentError } = await supabase
      .from('user_certifications')
      .select('*, certifications(*)')
      .eq('id', userCertificationId)
      .maybeSingle();

    if (currentError) throw currentError;
    if (!current) throw new Error("User certification not found");

    const cert = current.certifications as { name?: string; validity_months?: number } | null | undefined;
    
    if (!cert) throw new Error("Certification details not found");

    const newExpiresAt = cert?.validity_months
      ? new Date(Date.now() + (cert.validity_months || 0) * 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from('user_certifications')
      .update({
        renewed_at: new Date().toISOString(),
        expires_at: newExpiresAt,
        status: 'active',
        renewal_count: current.renewal_count + 1
      })
      .eq('id', userCertificationId)
      .select()
      .single();

    if (error) throw error;

    // Create notification
    await notificationsService.create({
      user_id: current.user_id,
      title: '🔄 Certificação Renovada!',
      message: `Sua certificação "${cert.name}" foi renovada${newExpiresAt ? ` até ${new Date(newExpiresAt).toLocaleDateString('pt-BR')}` : ''}`,
      type: 'achievement',
      data: { certification_id: current.certification_id }
    });

    return data as unknown as UserCertification;
  },

  async checkAndNotifyExpiringCertifications(userId: string): Promise<void> {
    const expiring = await this.getExpiringCertifications(userId, 30);
    
    for (const uc of expiring) {
      if (!uc.certification || !uc.expires_at) continue;
      
      const daysUntilExpiry = Math.ceil(
        (new Date(uc.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry <= 0) {
        await notificationsService.create({
          user_id: userId,
          title: '⚠️ Certificação Expirada!',
          message: `Sua certificação "${uc.certification.name}" expirou. Renove agora para manter sua conformidade.`,
          type: 'warning',
          data: { certification_id: uc.certification_id, user_certification_id: uc.id }
        });
      } else if (daysUntilExpiry <= 7) {
        await notificationsService.create({
          user_id: userId,
          title: '🔔 Certificação Expirando!',
          message: `Sua certificação "${uc.certification.name}" expira em ${daysUntilExpiry} dia(s). Renove antes do vencimento.`,
          type: 'warning',
          data: { certification_id: uc.certification_id, user_certification_id: uc.id }
        });
      } else if (daysUntilExpiry <= 30) {
        await notificationsService.create({
          user_id: userId,
          title: '📅 Renovação Próxima',
          message: `Sua certificação "${uc.certification.name}" expira em ${daysUntilExpiry} dias. Planeje sua renovação.`,
          type: 'info',
          data: { certification_id: uc.certification_id, user_certification_id: uc.id }
        });
      }
    }
  },

  async getTeamCertificationStatus(managerId: string): Promise<{
    userId: string;
    displayName: string;
    totalCertifications: number;
    activeCertifications: number;
    expiringCertifications: number;
    expiredCertifications: number;
    mandatoryMissing: number;
  }[]> {
    // Get team members
    const { data: teamMembers, error: teamError } = await supabase
      .from('team_members')
      .select('user_id, profiles!inner(id, display_name)')
      .eq('department_id', (
        await supabase
          .from('team_members')
          .select('department_id')
          .eq('user_id', managerId)
          .eq('is_manager', true)
          .maybeSingle()
      ).data?.department_id || '');

    if (teamError) throw teamError;

    // Get mandatory certifications count
    const { count: mandatoryCount } = await supabase
      .from('certifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_mandatory', true);

    const results = [];

    for (const member of teamMembers || []) {
      const { data: userCerts } = await supabase
        .from('user_certifications')
        .select('status, certification_id')
        .eq('user_id', member.user_id);

      const activeCerts = userCerts?.filter(c => c.status === 'active') || [];
      const expiringCerts = userCerts?.filter(c => c.status === 'expiring_soon') || [];
      const expiredCerts = userCerts?.filter(c => c.status === 'expired') || [];

      // Get mandatory certs the user has
      const { data: mandatoryCerts } = await supabase
        .from('certifications')
        .select('id')
        .eq('is_mandatory', true);

      const userCertIds = new Set(userCerts?.map(c => c.certification_id) || []);
      const mandatoryMissing = mandatoryCerts?.filter(c => !userCertIds.has(c.id)).length || 0;

      results.push({
        userId: member.user_id,
        displayName: (member.profiles as { display_name?: string } | null)?.display_name || 'Usuário',
        totalCertifications: userCerts?.length || 0,
        activeCertifications: activeCerts.length,
        expiringCertifications: expiringCerts.length,
        expiredCertifications: expiredCerts.length,
        mandatoryMissing
      });
    }

    return results;
  }
  ,

  /**
   * Verificação pública de autenticidade. Não exige sessão: a RPC roda como
   * SECURITY DEFINER e devolve apenas dados não sensíveis do certificado.
   */
  async verifyCertificate(code: string): Promise<CertificateVerification | null> {
    const normalized = code.trim().toUpperCase();
    if (normalized.length < 6) return null;

    const { data, error } = await supabase.rpc('verify_certificate', { _code: normalized });
    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : null;
    return (row as CertificateVerification | undefined) ?? null;
  }
};
