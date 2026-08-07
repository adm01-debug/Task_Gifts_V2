-- Tabela para registros de ponto (check-in/check-out)
CREATE TABLE public.attendance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  check_out TIMESTAMP WITH TIME ZONE,
  is_punctual BOOLEAN NOT NULL DEFAULT false,
  late_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para configurações de ponto por departamento
CREATE TABLE public.attendance_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  work_start_time TIME NOT NULL DEFAULT '08:00:00',
  work_end_time TIME NOT NULL DEFAULT '18:00:00',
  tolerance_minutes INTEGER NOT NULL DEFAULT 10,
  xp_punctual_checkin INTEGER NOT NULL DEFAULT 15,
  xp_streak_bonus INTEGER NOT NULL DEFAULT 50,
  streak_milestone INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para streaks de pontualidade
CREATE TABLE public.attendance_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  last_punctual_date DATE,
  total_punctual_days INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attendance_records
CREATE POLICY "Users can view own attendance" ON public.attendance_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attendance" ON public.attendance_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can view team attendance" ON public.attendance_records
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role)
  );

-- RLS Policies for attendance_settings
CREATE POLICY "Everyone can view settings" ON public.attendance_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON public.attendance_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for attendance_streaks
CREATE POLICY "Users can view own streaks" ON public.attendance_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own streaks" ON public.attendance_streaks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Managers can view all streaks" ON public.attendance_streaks
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role)
  );

-- Insert default attendance settings (general, applies to all)
INSERT INTO public.attendance_settings (department_id, work_start_time, work_end_time, tolerance_minutes, xp_punctual_checkin, xp_streak_bonus, streak_milestone)
VALUES (NULL, '08:00:00', '18:00:00', 10, 15, 50, 5);

-- Enable realtime for attendance_streaks
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_streaks;