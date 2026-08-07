-- Create trail prerequisites junction table for flexible many-to-many prerequisites
CREATE TABLE public.trail_prerequisites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trail_id UUID NOT NULL REFERENCES public.learning_trails(id) ON DELETE CASCADE,
  prerequisite_trail_id UUID NOT NULL REFERENCES public.learning_trails(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(trail_id, prerequisite_trail_id),
  CHECK (trail_id != prerequisite_trail_id)
);

-- Enable RLS
ALTER TABLE public.trail_prerequisites ENABLE ROW LEVEL SECURITY;

-- Everyone can view prerequisites
CREATE POLICY "Everyone can view prerequisites"
  ON public.trail_prerequisites
  FOR SELECT
  USING (true);

-- Admins and managers can manage prerequisites
CREATE POLICY "Admins and managers can manage prerequisites"
  ON public.trail_prerequisites
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Add index for faster lookups
CREATE INDEX idx_trail_prerequisites_trail_id ON public.trail_prerequisites(trail_id);
CREATE INDEX idx_trail_prerequisites_prerequisite_id ON public.trail_prerequisites(prerequisite_trail_id);