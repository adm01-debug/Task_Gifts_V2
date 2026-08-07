import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ipWhitelistService, CreateIpWhitelistInput, UpdateIpWhitelistInput } from "@/services/ipWhitelistService";
import { toast } from "sonner";

export function useIpWhitelist() {
  const queryClient = useQueryClient();

  const whitelistQuery = useQuery({
    queryKey: ['ip-whitelist'],
    queryFn: () => ipWhitelistService.getWhitelist(),
  });

  const accessLogsQuery = useQuery({
    queryKey: ['ip-access-logs'],
    queryFn: () => ipWhitelistService.getAccessLogs(100),
  });

  const addIpMutation = useMutation({
    mutationFn: (input: CreateIpWhitelistInput) => ipWhitelistService.addIp(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-whitelist'] });
      toast.success('IP adicionado à whitelist');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('Este IP já está na whitelist');
      } else {
        toast.error('Erro ao adicionar IP');
      }
    },
  });

  const updateIpMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateIpWhitelistInput }) => 
      ipWhitelistService.updateIp(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-whitelist'] });
      toast.success('IP atualizado');
    },
    onError: () => {
      toast.error('Erro ao atualizar IP');
    },
  });

  const deleteIpMutation = useMutation({
    mutationFn: (id: string) => ipWhitelistService.deleteIp(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-whitelist'] });
      toast.success('IP removido da whitelist');
    },
    onError: () => {
      toast.error('Erro ao remover IP');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      ipWhitelistService.toggleIpStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-whitelist'] });
    },
    onError: () => {
      toast.error('Erro ao alterar status');
    },
  });

  return {
    whitelist: whitelistQuery.data || [],
    accessLogs: accessLogsQuery.data || [],
    isLoading: whitelistQuery.isLoading,
    isLoadingLogs: accessLogsQuery.isLoading,
    addIp: addIpMutation.mutate,
    updateIp: updateIpMutation.mutate,
    deleteIp: deleteIpMutation.mutate,
    toggleStatus: toggleStatusMutation.mutate,
    isAdding: addIpMutation.isPending,
    validateIp: ipWhitelistService.validateIpAddress,
    refetch: whitelistQuery.refetch,
    refetchLogs: accessLogsQuery.refetch,
  };
}
