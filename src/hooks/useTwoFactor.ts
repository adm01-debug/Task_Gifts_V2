import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { twoFactorService, TwoFactorSetupData } from "@/services/twoFactorService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useTwoFactor() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["two-factor-settings", user?.id],
    queryFn: () => twoFactorService.getSettings(user!.id),
    enabled: !!user?.id,
  });

  const setupMutation = useMutation({
    mutationFn: async (): Promise<TwoFactorSetupData> => {
      if (!user?.id || !user?.email) {
        throw new Error("User not authenticated");
      }
      return twoFactorService.setupTwoFactor(user.id, user.email);
    },
    onError: () => {
      toast.error("Erro ao configurar 2FA");
    },
  });

  const verifyAndEnableMutation = useMutation({
    mutationFn: async (token: string) => {
      if (!user?.id) throw new Error("User not authenticated");
      return twoFactorService.verifyAndEnable(user.id, token);
    },
    onSuccess: (success) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ["two-factor-settings"] });
        toast.success("2FA ativado com sucesso!");
      } else {
        toast.error("Código inválido");
      }
    },
    onError: () => {
      toast.error("Erro ao verificar código");
    },
  });

  const disableMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      return twoFactorService.disable(user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["two-factor-settings"] });
      toast.success("2FA desativado");
    },
    onError: () => {
      toast.error("Erro ao desativar 2FA");
    },
  });

  const verifyTokenMutation = useMutation({
    mutationFn: async ({ userId, token }: { userId: string; token: string }) => {
      return twoFactorService.verifyToken(userId, token);
    },
  });

  return {
    settings: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    isEnabled: settingsQuery.data?.is_enabled ?? false,
    setup: setupMutation.mutateAsync,
    isSettingUp: setupMutation.isPending,
    setupData: setupMutation.data,
    verifyAndEnable: verifyAndEnableMutation.mutate,
    isVerifying: verifyAndEnableMutation.isPending,
    disable: disableMutation.mutate,
    isDisabling: disableMutation.isPending,
    verifyToken: verifyTokenMutation.mutateAsync,
    isVerifyingToken: verifyTokenMutation.isPending,
    checkTwoFactorEnabled: twoFactorService.isTwoFactorEnabled,
  };
}
