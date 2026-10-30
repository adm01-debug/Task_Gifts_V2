-- ============================================================
-- Onda 2 (2026-10-30): FKs com ON DELETE explícito
-- 31 FKs tinham delete_rule='NO ACTION' (implícito = RESTRICT,
-- mas sem intenção declarada). Esta migration torna as intenções
-- explícitas por grupo semântico. Idempotente (DROP + ADD).
-- ============================================================

-- GRUPO 1: department_id nullable → SET NULL
ALTER TABLE public.action_plans
  DROP CONSTRAINT IF EXISTS action_plans_department_id_fkey,
  ADD CONSTRAINT action_plans_department_id_fkey
    FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;

ALTER TABLE public.announcements
  DROP CONSTRAINT IF EXISTS announcements_department_id_fkey,
  ADD CONSTRAINT announcements_department_id_fkey
    FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;

ALTER TABLE public.certifications
  DROP CONSTRAINT IF EXISTS certifications_department_id_fkey,
  ADD CONSTRAINT certifications_department_id_fkey
    FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;

ALTER TABLE public.climate_pillar_scores
  DROP CONSTRAINT IF EXISTS climate_pillar_scores_department_id_fkey,
  ADD CONSTRAINT climate_pillar_scores_department_id_fkey
    FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;

ALTER TABLE public.climate_surveys
  DROP CONSTRAINT IF EXISTS climate_surveys_department_id_fkey,
  ADD CONSTRAINT climate_surveys_department_id_fkey
    FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;

ALTER TABLE public.competencies
  DROP CONSTRAINT IF EXISTS competencies_department_id_fkey,
  ADD CONSTRAINT competencies_department_id_fkey
    FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;

ALTER TABLE public.department_missions
  DROP CONSTRAINT IF EXISTS department_missions_department_id_fkey,
  ADD CONSTRAINT department_missions_department_id_fkey
    FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;

ALTER TABLE public.department_rankings
  DROP CONSTRAINT IF EXISTS department_rankings_department_id_fkey,
  ADD CONSTRAINT department_rankings_department_id_fkey
    FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;

ALTER TABLE public.engagement_snapshots
  DROP CONSTRAINT IF EXISTS engagement_snapshots_department_id_fkey,
  ADD CONSTRAINT engagement_snapshots_department_id_fkey
    FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;

ALTER TABLE public.enps_surveys
  DROP CONSTRAINT IF EXISTS enps_surveys_department_id_fkey,
  ADD CONSTRAINT enps_surveys_department_id_fkey
    FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;

ALTER TABLE public.feedback_cycles
  DROP CONSTRAINT IF EXISTS feedback_cycles_department_id_fkey,
  ADD CONSTRAINT feedback_cycles_department_id_fkey
    FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;

ALTER TABLE public.goals
  DROP CONSTRAINT IF EXISTS goals_department_id_fkey,
  ADD CONSTRAINT goals_department_id_fkey
    FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;

ALTER TABLE public.learning_trails
  DROP CONSTRAINT IF EXISTS learning_trails_department_id_fkey,
  ADD CONSTRAINT learning_trails_department_id_fkey
    FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


-- GRUPO 2: avatar_items → SET NULL
ALTER TABLE public.user_avatar_config
  DROP CONSTRAINT IF EXISTS user_avatar_config_selected_accessory_fkey,
  ADD CONSTRAINT user_avatar_config_selected_accessory_fkey
    FOREIGN KEY (selected_accessory) REFERENCES public.avatar_items(id) ON DELETE SET NULL;

ALTER TABLE public.user_avatar_config
  DROP CONSTRAINT IF EXISTS user_avatar_config_selected_background_fkey,
  ADD CONSTRAINT user_avatar_config_selected_background_fkey
    FOREIGN KEY (selected_background) REFERENCES public.avatar_items(id) ON DELETE SET NULL;

ALTER TABLE public.user_avatar_config
  DROP CONSTRAINT IF EXISTS user_avatar_config_selected_badge_style_fkey,
  ADD CONSTRAINT user_avatar_config_selected_badge_style_fkey
    FOREIGN KEY (selected_badge_style) REFERENCES public.avatar_items(id) ON DELETE SET NULL;

ALTER TABLE public.user_avatar_config
  DROP CONSTRAINT IF EXISTS user_avatar_config_selected_effect_fkey,
  ADD CONSTRAINT user_avatar_config_selected_effect_fkey
    FOREIGN KEY (selected_effect) REFERENCES public.avatar_items(id) ON DELETE SET NULL;

ALTER TABLE public.user_avatar_config
  DROP CONSTRAINT IF EXISTS user_avatar_config_selected_frame_fkey,
  ADD CONSTRAINT user_avatar_config_selected_frame_fkey
    FOREIGN KEY (selected_frame) REFERENCES public.avatar_items(id) ON DELETE SET NULL;

-- GRUPO 3: ligas → RESTRICT (integridade de ranking)
ALTER TABLE public.league_history
  DROP CONSTRAINT IF EXISTS league_history_from_league_id_fkey,
  ADD CONSTRAINT league_history_from_league_id_fkey
    FOREIGN KEY (from_league_id) REFERENCES public.leagues(id) ON DELETE RESTRICT;

ALTER TABLE public.league_history
  DROP CONSTRAINT IF EXISTS league_history_to_league_id_fkey,
  ADD CONSTRAINT league_history_to_league_id_fkey
    FOREIGN KEY (to_league_id) REFERENCES public.leagues(id) ON DELETE RESTRICT;

ALTER TABLE public.user_leagues
  DROP CONSTRAINT IF EXISTS user_leagues_league_id_fkey,
  ADD CONSTRAINT user_leagues_league_id_fkey
    FOREIGN KEY (league_id) REFERENCES public.leagues(id) ON DELETE RESTRICT;

-- GRUPO 4: dados de RH / links opcionais
ALTER TABLE public.development_plan_actions
  DROP CONSTRAINT IF EXISTS development_plan_actions_competency_id_fkey,
  ADD CONSTRAINT development_plan_actions_competency_id_fkey
    FOREIGN KEY (competency_id) REFERENCES public.competencies(id) ON DELETE RESTRICT;

ALTER TABLE public.feedback_questions
  DROP CONSTRAINT IF EXISTS feedback_questions_competency_id_fkey,
  ADD CONSTRAINT feedback_questions_competency_id_fkey
    FOREIGN KEY (competency_id) REFERENCES public.competencies(id) ON DELETE RESTRICT;

ALTER TABLE public.feedback_results
  DROP CONSTRAINT IF EXISTS feedback_results_competency_id_fkey,
  ADD CONSTRAINT feedback_results_competency_id_fkey
    FOREIGN KEY (competency_id) REFERENCES public.competencies(id) ON DELETE RESTRICT;

ALTER TABLE public.development_plans
  DROP CONSTRAINT IF EXISTS development_plans_linked_feedback_id_fkey,
  ADD CONSTRAINT development_plans_linked_feedback_id_fkey
    FOREIGN KEY (linked_feedback_id) REFERENCES public.feedback_responses(id) ON DELETE SET NULL;

ALTER TABLE public.development_plans
  DROP CONSTRAINT IF EXISTS development_plans_linked_nine_box_id_fkey,
  ADD CONSTRAINT development_plans_linked_nine_box_id_fkey
    FOREIGN KEY (linked_nine_box_id) REFERENCES public.nine_box_evaluations(id) ON DELETE SET NULL;

ALTER TABLE public.checkins
  DROP CONSTRAINT IF EXISTS checkins_template_id_fkey,
  ADD CONSTRAINT checkins_template_id_fkey
    FOREIGN KEY (template_id) REFERENCES public.checkin_templates(id) ON DELETE RESTRICT;

ALTER TABLE public.action_plans
  DROP CONSTRAINT IF EXISTS action_plans_related_survey_id_fkey,
  ADD CONSTRAINT action_plans_related_survey_id_fkey
    FOREIGN KEY (related_survey_id) REFERENCES public.climate_surveys(id) ON DELETE SET NULL;

ALTER TABLE public.certifications
  DROP CONSTRAINT IF EXISTS certifications_trail_id_fkey,
  ADD CONSTRAINT certifications_trail_id_fkey
    FOREIGN KEY (trail_id) REFERENCES public.learning_trails(id) ON DELETE RESTRICT;

ALTER TABLE public.user_competency_assessments
  DROP CONSTRAINT IF EXISTS user_competency_assessments_feedback_cycle_id_fkey,
  ADD CONSTRAINT user_competency_assessments_feedback_cycle_id_fkey
    FOREIGN KEY (feedback_cycle_id) REFERENCES public.feedback_cycles(id) ON DELETE RESTRICT;

ALTER TABLE public.pulse_surveys
  DROP CONSTRAINT IF EXISTS pulse_surveys_department_id_fkey,
  ADD CONSTRAINT pulse_surveys_department_id_fkey
    FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


