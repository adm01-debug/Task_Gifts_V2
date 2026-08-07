import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { webauthnService, isWebAuthnSupported, isBiometricAvailable, WebAuthnCredential } from "@/services/webauthnService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useWebAuthn() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSupported, setIsSupported] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);

  // Verificar suporte
  useEffect(() => {
    setIsSupported(isWebAuthnSupported());
    
    isBiometricAvailable().then(setHasBiometric);
  }, []);

  // Query para credenciais
  const credentialsQuery = useQuery({
    queryKey: ["webauthn-credentials", user?.id],
    queryFn: () => webauthnService.getCredentials(user!.id),
    enabled: !!user?.id
  });

  // Query para verificar se tem passkeys
  const hasPasskeysQuery = useQuery({
    queryKey: ["has-passkeys", user?.id],
    queryFn: () => webauthnService.hasPasskeys(user!.id),
    enabled: !!user?.id
  });

  // Mutation para registrar
  const registerMutation = useMutation({
    mutationFn: async (deviceName?: string) => {
      if (!user?.id || !user?.email) {
        throw new Error("Usuário não autenticado");
      }
      return webauthnService.register(
        user.id,
        user.email,
        user.user_metadata?.display_name || user.email,
        deviceName
      );
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["webauthn-credentials"] });
        queryClient.invalidateQueries({ queryKey: ["has-passkeys"] });
        toast.success("Passkey registrada com sucesso!");
      } else {
        toast.error(result.error || "Erro ao registrar passkey");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao registrar passkey");
    }
  });

  // Mutation para autenticar
  const authenticateMutation = useMutation({
    mutationFn: async (email?: string) => {
      return webauthnService.authenticate(email);
    }
  });

  // Mutation para remover
  const removeMutation = useMutation({
    mutationFn: async (credentialId: string) => {
      return webauthnService.removeCredential(credentialId);
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["webauthn-credentials"] });
        queryClient.invalidateQueries({ queryKey: ["has-passkeys"] });
        toast.success("Passkey removida");
      } else {
        toast.error(result.error || "Erro ao remover passkey");
      }
    }
  });

  // Mutation para renomear
  const renameMutation = useMutation({
    mutationFn: async ({ credentialId, newName }: { credentialId: string; newName: string }) => {
      return webauthnService.renameCredential(credentialId, newName);
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["webauthn-credentials"] });
        toast.success("Passkey renomeada");
      } else {
        toast.error(result.error || "Erro ao renomear passkey");
      }
    }
  });

  return {
    // Estado
    isSupported,
    hasBiometric,
    credentials: credentialsQuery.data || [],
    hasPasskeys: hasPasskeysQuery.data || false,
    isLoading: credentialsQuery.isLoading,
    
    // Ações
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    
    authenticate: authenticateMutation.mutateAsync,
    isAuthenticating: authenticateMutation.isPending,
    
    remove: removeMutation.mutate,
    isRemoving: removeMutation.isPending,
    
    rename: renameMutation.mutate,
    isRenaming: renameMutation.isPending,
    
    // Refresh
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ["webauthn-credentials"] });
      queryClient.invalidateQueries({ queryKey: ["has-passkeys"] });
    }
  };
}
