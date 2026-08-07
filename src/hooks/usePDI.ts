import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pdiService, type PDITemplate, type PDIMentor, type PDICheckin } from "@/services/pdiService";
import { toast } from "sonner";

export const usePDI = (planId?: string) => {
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ['pdi-templates'],
    queryFn: () => pdiService.getTemplates(),
  });

  const mentorsQuery = useQuery({
    queryKey: ['pdi-mentors', planId],
    queryFn: () => pdiService.getMentors(planId!),
    enabled: !!planId,
  });

  const checkinsQuery = useQuery({
    queryKey: ['pdi-checkins', planId],
    queryFn: () => pdiService.getCheckins(planId!),
    enabled: !!planId,
  });

  const createTemplateMutation = useMutation({
    mutationFn: (template: Omit<PDITemplate, 'id' | 'created_at'>) => 
      pdiService.createTemplate(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdi-templates'] });
      toast.success('Template criado!');
    },
  });

  const addMentorMutation = useMutation({
    mutationFn: (mentor: Omit<PDIMentor, 'id' | 'created_at'>) => 
      pdiService.addMentor(mentor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdi-mentors', planId] });
      toast.success('Mentor adicionado!');
    },
  });

  const removeMentorMutation = useMutation({
    mutationFn: (mentorId: string) => pdiService.removeMentor(mentorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdi-mentors', planId] });
      toast.success('Mentor removido!');
    },
  });

  const createCheckinMutation = useMutation({
    mutationFn: (checkin: Omit<PDICheckin, 'id' | 'created_at'>) => 
      pdiService.createCheckin(checkin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdi-checkins', planId] });
      toast.success('Check-in registrado!');
    },
  });

  const applyTemplateMutation = useMutation({
    mutationFn: ({ planId, templateId }: { planId: string; templateId: string }) =>
      pdiService.applyTemplate(planId, templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['development-plans'] });
      toast.success('Template aplicado ao PDI!');
    },
  });

  return {
    templates: templatesQuery.data || [],
    mentors: mentorsQuery.data || [],
    checkins: checkinsQuery.data || [],
    isLoading: templatesQuery.isLoading,
    createTemplate: createTemplateMutation.mutate,
    addMentor: addMentorMutation.mutate,
    removeMentor: removeMentorMutation.mutate,
    createCheckin: createCheckinMutation.mutate,
    applyTemplate: applyTemplateMutation.mutate,
  };
};
