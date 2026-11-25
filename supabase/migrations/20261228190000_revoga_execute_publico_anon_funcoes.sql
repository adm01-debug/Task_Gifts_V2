-- ============================================
-- Revoga EXECUTE de PUBLIC/anon/authenticated nas funcoes internas
-- ============================================
--
-- Paridade prod x repositorio: em producao 36 funcoes tem EXECUTE para PUBLIC e/ou anon
-- que uma reconstrucao a partir do repositorio nao concede (medido comparando
-- aclexplode(proacl) das 284 funcoes dos dois lados). Sao funcoes de trigger/hook internas
-- (war_hook_*, boss_hook_*, card_pack_hook_*, handle_new_user, handle_updated_at,
-- update_updated_at_column) e utilitarias de calculo.
--
-- Risco real: qualquer visitante sem login pode chamar /rest/v1/rpc/<nome> com a anon key.
-- Em funcoes SECURITY DEFINER acionadas por trigger o PostgreSQL recusa a chamada direta
-- ("trigger functions can only be called as triggers"), mas manter o grant e superficie de
-- ataque desnecessaria e diverge do rebuild.
--
-- Verificado antes de revogar (producao):
--   * nenhuma das 36 aparece em pg_policies.qual ou with_check (0 politicas);
--   * nenhuma aparece em default de coluna ou indice funcional;
--   * nenhuma e chamada via .rpc() em nenhum arquivo do repositorio (front, edge, scripts);
--   * EXECUTE de postgres e service_role e preservado.
REVOKE EXECUTE ON FUNCTION public._card_rarity_value(p_rarity text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public._card_set_milestone_split(p_total integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.audit_lucky_wheel_prize() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.auto_create_postmortem_on_resolve() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.boss_hook_attendance_streaks() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.boss_hook_task_scores() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.boss_hook_trail_enrollments() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.boss_phase_alert_hook() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.card_pack_hook_attendance_streaks() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.card_pack_hook_task_scores() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.card_pack_hook_trail_enrollments() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.card_pack_notify() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.chi_square_critical(p_df integer, p_alpha double precision) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_campaign_team_consistency() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.engagement_min_respondents() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.ensure_single_default_filter() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.erf_inverse(x double precision) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_lucky_wheel_budget_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_lucky_wheel_prize_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_prediction_settlement() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_purchase_requested() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_wager_integrity_review_event() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admins_of_monthly_report() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_dispatch_critical_alert() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trim_push_sync_events() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_notification_prefs_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_saved_filters_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.war_hook_attendance() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.war_hook_kudos() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.war_hook_module_progress() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.war_hook_quiz_scores() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.war_hook_task_scores() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.war_hook_trail_enrollments() FROM PUBLIC, anon, authenticated;