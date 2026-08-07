import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/services/loggingService";

export interface PDITemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  target_role?: string;
  target_level?: string;
  actions_template: Array<{ title: string; description?: string; action_type: string; priority: string }>;
  estimated_duration_months?: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface PDIMentor {
  id: string;
  plan_id: string;
  mentor_id: string;
  role: string;
  status: string;
  notes?: string;
  created_at: string;
}

export interface PDICheckin {
  id: string;
  plan_id: string;
  checkin_date: string;
  progress_summary?: string;
  blockers?: string;
  next_steps?: string;
  mood_rating?: number;
  manager_feedback?: string;
  created_by: string;
  created_at: string;
}

export const pdiService = {
  async getTemplates(category?: string): Promise<PDITemplate[]> {
    let query = supabase.from('pdi_templates').select('*').eq('is_active', true).order('name');
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) { logger.error('Failed to fetch templates', 'PDIService', error); throw error; }
    return (data || []) as unknown as PDITemplate[];
  },

  async getTemplateById(id: string): Promise<PDITemplate | null> {
    const { data, error } = await supabase.from('pdi_templates').select('*').eq('id', id).maybeSingle();
    if (error) { logger.error('Failed to fetch template', 'PDIService', error); return null; }
    return data as unknown as PDITemplate;
  },

  async createTemplate(template: Omit<PDITemplate, 'id' | 'created_at'>): Promise<PDITemplate> {
    const { data, error } = await supabase.from('pdi_templates').insert(template).select().maybeSingle();
    if (error) { logger.error('Failed to create template', 'PDIService', error); throw error; }
    if (!data) throw new Error('Failed to create template');
    return data as unknown as PDITemplate;
  },

  async getMentors(planId: string): Promise<PDIMentor[]> {
    const { data, error } = await supabase.from('pdi_mentors').select('*').eq('plan_id', planId);
    if (error) { logger.error('Failed to fetch mentors', 'PDIService', error); throw error; }
    return (data || []) as unknown as PDIMentor[];
  },

  async addMentor(mentor: Omit<PDIMentor, 'id' | 'created_at'>): Promise<PDIMentor> {
    const { data, error } = await supabase.from('pdi_mentors').insert(mentor).select().maybeSingle();
    if (error) { logger.error('Failed to add mentor', 'PDIService', error); throw error; }
    if (!data) throw new Error('Failed to add mentor');
    return data as unknown as PDIMentor;
  },

  async removeMentor(mentorId: string): Promise<void> {
    const { error } = await supabase.from('pdi_mentors').delete().eq('id', mentorId);
    if (error) { logger.error('Failed to remove mentor', 'PDIService', error); throw error; }
  },

  async getCheckins(planId: string): Promise<PDICheckin[]> {
    const { data, error } = await supabase.from('pdi_checkins').select('*').eq('plan_id', planId).order('checkin_date', { ascending: false });
    if (error) { logger.error('Failed to fetch checkins', 'PDIService', error); throw error; }
    return (data || []) as unknown as PDICheckin[];
  },

  async createCheckin(checkin: Omit<PDICheckin, 'id' | 'created_at'>): Promise<PDICheckin> {
    const { data, error } = await supabase.from('pdi_checkins').insert(checkin).select().maybeSingle();
    if (error) { logger.error('Failed to create checkin', 'PDIService', error); throw error; }
    if (!data) throw new Error('Failed to create checkin');
    return data as unknown as PDICheckin;
  },

  async applyTemplate(planId: string, templateId: string): Promise<void> {
    const template = await this.getTemplateById(templateId);
    if (!template) throw new Error('Template not found');
    
    const actions = template.actions_template.map((action, index) => ({
      plan_id: planId,
      title: action.title,
      description: action.description,
      action_type: action.action_type,
      priority: action.priority,
      status: 'pending',
      progress_percent: 0,
    }));

    const { error } = await supabase.from('development_plan_actions').insert(actions);
    if (error) { logger.error('Failed to apply template', 'PDIService', error); throw error; }
  },
};
