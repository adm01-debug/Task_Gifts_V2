import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { certificationsService, Certification, UserCertification } from '@/services/certificationsService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/services/loggingService';

const certificationKeys = {
  all: ['certifications'] as const,
  list: () => [...certificationKeys.all, 'list'] as const,
  mandatory: () => [...certificationKeys.all, 'mandatory'] as const,
  user: (userId: string) => [...certificationKeys.all, 'user', userId] as const,
  expiring: (userId: string) => [...certificationKeys.all, 'expiring', userId] as const,
  expired: (userId: string) => [...certificationKeys.all, 'expired', userId] as const,
  team: (managerId: string) => [...certificationKeys.all, 'team', managerId] as const,
};

export function useCertifications() {
  return useQuery({
    queryKey: certificationKeys.list(),
    queryFn: certificationsService.getAllCertifications,
  });
}

export function useMandatoryCertifications() {
  return useQuery({
    queryKey: certificationKeys.mandatory(),
    queryFn: certificationsService.getMandatoryCertifications,
  });
}

export function useUserCertifications() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: certificationKeys.user(user?.id || ''),
    queryFn: () => certificationsService.getUserCertifications(user!.id),
    enabled: !!user?.id,
  });
}

export function useExpiringCertifications(daysAhead: number = 30) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: certificationKeys.expiring(user?.id || ''),
    queryFn: () => certificationsService.getExpiringCertifications(user!.id, daysAhead),
    enabled: !!user?.id,
  });
}

export function useExpiredCertifications() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: certificationKeys.expired(user?.id || ''),
    queryFn: () => certificationsService.getExpiredCertifications(user!.id),
    enabled: !!user?.id,
  });
}

export function useTeamCertificationStatus() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: certificationKeys.team(user?.id || ''),
    queryFn: () => certificationsService.getTeamCertificationStatus(user!.id),
    enabled: !!user?.id,
  });
}

export function useIssueCertification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ userId, certificationId }: { userId: string; certificationId: string }) =>
      certificationsService.issueCertification(userId, certificationId, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: certificationKeys.all });
      toast.success('Certificação emitida com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao emitir certificação');
      logger.apiError("Error issuing certification", error, "useCertifications");
    },
  });
}

export function useRenewCertification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userCertificationId: string) =>
      certificationsService.renewCertification(userCertificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: certificationKeys.all });
      toast.success('Certificação renovada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao renovar certificação');
      logger.apiError("Error renewing certification", error, "useCertifications");
    },
  });
}

export function useCheckExpiringCertifications() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: () => certificationsService.checkAndNotifyExpiringCertifications(user!.id),
  });
}
