import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { departmentsService, type Department, type DepartmentInsert, type DepartmentUpdate } from "@/services/departmentsService";

export const departmentKeys = {
  all: ["departments"] as const,
  lists: () => [...departmentKeys.all, "list"] as const,
  details: () => [...departmentKeys.all, "detail"] as const,
  detail: (id: string) => [...departmentKeys.details(), id] as const,
  withMembers: (id: string) => [...departmentKeys.detail(id), "members"] as const,
  teamMembers: (departmentId: string) => [...departmentKeys.all, "teamMembers", departmentId] as const,
};

// Queries
export function useDepartments() {
  return useQuery({
    queryKey: departmentKeys.lists(),
    queryFn: () => departmentsService.getAll(),
  });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: departmentKeys.detail(id),
    queryFn: () => departmentsService.getById(id),
    enabled: !!id,
  });
}

export function useDepartmentWithMembers(id: string) {
  return useQuery({
    queryKey: departmentKeys.withMembers(id),
    queryFn: () => departmentsService.getWithMembers(id),
    enabled: !!id,
  });
}

export function useTeamMembers(departmentId: string) {
  return useQuery({
    queryKey: departmentKeys.teamMembers(departmentId),
    queryFn: () => departmentsService.getTeamMembers(departmentId),
    enabled: !!departmentId,
  });
}

// Mutations
export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (department: DepartmentInsert) => departmentsService.create(department),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: DepartmentUpdate }) =>
      departmentsService.update(id, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(departmentKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => departmentsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
    },
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      departmentId, 
      userId, 
      isManager = false 
    }: { 
      departmentId: string; 
      userId: string; 
      isManager?: boolean 
    }) => departmentsService.addTeamMember(departmentId, userId, isManager),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.teamMembers(data.department_id) });
      queryClient.invalidateQueries({ queryKey: departmentKeys.withMembers(data.department_id) });
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, departmentId }: { memberId: string; departmentId: string }) =>
      departmentsService.removeTeamMember(memberId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.teamMembers(variables.departmentId) });
      queryClient.invalidateQueries({ queryKey: departmentKeys.withMembers(variables.departmentId) });
    },
  });
}

export function useSetManager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, isManager }: { memberId: string; isManager: boolean }) =>
      departmentsService.setManager(memberId, isManager),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.teamMembers(data.department_id) });
      queryClient.invalidateQueries({ queryKey: departmentKeys.withMembers(data.department_id) });
    },
  });
}
