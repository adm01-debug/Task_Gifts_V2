-- Create enum for audit action types
CREATE TYPE public.audit_action AS ENUM (
  'user_signup',
  'user_login',
  'profile_update',
  'xp_gained',
  'level_up',
  'coins_earned',
  'coins_spent',
  'quest_created',
  'quest_updated',
  'quest_deleted',
  'quest_assigned',
  'quest_completed',
  'kudos_given',
  'kudos_received',
  'achievement_unlocked',
  'streak_updated',
  'department_created',
  'department_updated',
  'team_member_added',
  'team_member_removed',
  'role_assigned',
  'role_removed'
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action audit_action NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Managers can view audit logs from their team
CREATE POLICY "Managers can view team audit logs"
ON public.audit_logs
FOR SELECT
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.team_members tm1
    JOIN public.team_members tm2 ON tm1.department_id = tm2.department_id
    WHERE tm1.user_id = auth.uid() 
    AND tm1.is_manager = true
    AND tm2.user_id = audit_logs.user_id
  )
);

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
ON public.audit_logs
FOR SELECT
USING (auth.uid() = user_id);

-- System can insert audit logs (any authenticated user can create logs)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);