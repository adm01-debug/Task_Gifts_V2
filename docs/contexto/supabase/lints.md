# Lints de segurança e performance

Verificações objetivas feitas no catálogo. Um agente deve ler isto antes de propor mudanças em RLS, functions ou índices.

| severidade | código | objeto | detalhe |
|---|---|---|---|
| ALTA | view_security_definer | public.connection_monitor | View em public sem security_invoker: executa como owner e ignora RLS das tabelas base. |
| ALTA | view_security_definer | public.demographic_values_panel | View em public sem security_invoker: executa como owner e ignora RLS das tabelas base. |
| ALTA | view_security_definer | public.index_health_report | View em public sem security_invoker: executa como owner e ignora RLS das tabelas base. |
| ALTA | view_security_definer | public.profiles_public | View em public sem security_invoker: executa como owner e ignora RLS das tabelas base. |
| ALTA | view_security_definer | public.query_performance_summary | View em public sem security_invoker: executa como owner e ignora RLS das tabelas base. |
| ALTA | view_security_definer | public.webhook_delivery_stats_24h | View em public sem security_invoker: executa como owner e ignora RLS das tabelas base. |
| MÉDIA | rls_no_policies | public.cron_job_watch_baseline | RLS ligado sem policies: inacessível via API (só service_role). |
| BAIXA | extension_in_public | pg_net | Extensão instalada no schema public (recomendado: schema extensions). |
| BAIXA | fk_without_index | public.auction_admin_events.auction_admin_events_actor_id_fkey | FK sem índice nas colunas {actor_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.auction_bids.auction_bids_user_id_fkey | FK sem índice nas colunas {user_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.auctions.auctions_created_by_fkey | FK sem índice nas colunas {created_by}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.auctions.auctions_winner_id_fkey | FK sem índice nas colunas {winner_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.bingo_marks.bingo_marks_user_id_fkey | FK sem índice nas colunas {user_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.board_moves.board_moves_user_id_fkey | FK sem índice nas colunas {user_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.board_trails.board_trails_created_by_fkey | FK sem índice nas colunas {created_by}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.board_trails.board_trails_department_id_fkey | FK sem índice nas colunas {department_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.boss_battle_damage.boss_battle_damage_department_id_fkey | FK sem índice nas colunas {department_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.boss_battle_rewards.boss_battle_rewards_user_id_fkey | FK sem índice nas colunas {user_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.boss_battles.boss_battles_created_by_fkey | FK sem índice nas colunas {created_by}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.boss_win_rate_goals.boss_win_rate_goals_updated_by_fkey | FK sem índice nas colunas {updated_by}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.campaign_result_imports.campaign_result_imports_created_by_fkey | FK sem índice nas colunas {created_by}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.campaign_result_rows.campaign_result_rows_user_id_fkey | FK sem índice nas colunas {user_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.campaign_team_members.campaign_team_members_user_id_fkey | FK sem índice nas colunas {user_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.campaign_team_split_batches.campaign_team_split_batches_executed_by_fkey | FK sem índice nas colunas {executed_by}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.campaign_team_split_batches.campaign_team_split_batches_reverted_by_fkey | FK sem índice nas colunas {reverted_by}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.campaign_team_split_entries.campaign_team_split_entries_team_id_fkey | FK sem índice nas colunas {team_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.campaign_teams.campaign_teams_created_by_fkey | FK sem índice nas colunas {created_by}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.card_trades.card_trades_offered_card_id_fkey | FK sem índice nas colunas {offered_card_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.card_trades.card_trades_requested_card_id_fkey | FK sem índice nas colunas {requested_card_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.department_war_contributions.department_war_contributions_department_id_fkey | FK sem índice nas colunas {department_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.department_war_contributions.department_war_contributions_user_id_fkey | FK sem índice nas colunas {user_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.department_war_departments.department_war_departments_department_id_fkey | FK sem índice nas colunas {department_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.department_war_results.department_war_results_department_id_fkey | FK sem índice nas colunas {department_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.department_wars.department_wars_created_by_fkey | FK sem índice nas colunas {created_by}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.engagement_cycles.engagement_cycles_created_by_fkey | FK sem índice nas colunas {created_by}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.engagement_cycles.engagement_cycles_department_id_fkey | FK sem índice nas colunas {department_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.engagement_question_assignments.engagement_question_assignments_question_id_fkey | FK sem índice nas colunas {question_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.entity_versions.entity_versions_changed_by_fkey | FK sem índice nas colunas {changed_by}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.goal_templates.goal_templates_created_by_fkey | FK sem índice nas colunas {created_by}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.lightning_quiz_answers.lightning_quiz_answers_question_id_fkey | FK sem índice nas colunas {question_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.lucky_wheel_prize_audit.lucky_wheel_prize_audit_changed_by_fkey | FK sem índice nas colunas {changed_by}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.lucky_wheel_prizes.lucky_wheel_prizes_achievement_id_fkey | FK sem índice nas colunas {achievement_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.lucky_wheel_settings.lucky_wheel_settings_updated_by_fkey | FK sem índice nas colunas {updated_by}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.lucky_wheel_settings_audit.lucky_wheel_settings_audit_changed_by_fkey | FK sem índice nas colunas {changed_by}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.lucky_wheel_spins.lucky_wheel_spins_prize_id_fkey | FK sem índice nas colunas {prize_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.lucky_wheel_whatif_snapshots.lucky_wheel_whatif_snapshots_created_by_fkey | FK sem índice nas colunas {created_by}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.memory_decks.memory_decks_created_by_fkey | FK sem índice nas colunas {created_by}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.memory_decks.memory_decks_department_id_fkey | FK sem índice nas colunas {department_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.opinion_supports.opinion_supports_user_id_fkey | FK sem índice nas colunas {user_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.prediction_admin_events.prediction_admin_events_actor_id_fkey | FK sem índice nas colunas {actor_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.prediction_markets.prediction_markets_created_by_fkey | FK sem índice nas colunas {created_by}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.prediction_markets.prediction_markets_settled_by_fkey | FK sem índice nas colunas {settled_by}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.prediction_markets.prediction_markets_winning_option_fk | FK sem índice nas colunas {winning_option_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.prediction_stakes.prediction_stakes_option_id_fkey | FK sem índice nas colunas {option_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.purchase_approvals.purchase_approvals_actor_id_fkey | FK sem índice nas colunas {actor_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.push_sync_events.push_sync_events_subscription_id_fkey | FK sem índice nas colunas {subscription_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.scratch_cards.scratch_cards_prize_id_fkey | FK sem índice nas colunas {prize_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.sequence_procedures.sequence_procedures_created_by_fkey | FK sem índice nas colunas {created_by}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.sequence_procedures.sequence_procedures_department_id_fkey | FK sem índice nas colunas {department_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.shop_purchases.shop_purchases_approved_by_fkey | FK sem índice nas colunas {approved_by}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.shop_purchases.shop_purchases_first_approver_id_fkey | FK sem índice nas colunas {first_approver_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.tournament_matches.tournament_matches_away_participant_id_fkey | FK sem índice nas colunas {away_participant_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.tournament_matches.tournament_matches_home_participant_id_fkey | FK sem índice nas colunas {home_participant_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.tournament_matches.tournament_matches_winner_participant_id_fkey | FK sem índice nas colunas {winner_participant_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.tournaments.tournaments_champion_user_id_fkey | FK sem índice nas colunas {champion_user_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.tournaments.tournaments_created_by_fkey | FK sem índice nas colunas {created_by}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.tournaments.tournaments_runner_up_user_id_fkey | FK sem índice nas colunas {runner_up_user_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.user_cards.user_cards_card_id_fkey | FK sem índice nas colunas {card_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.wager_budget_settings.wager_budget_settings_updated_by_fkey | FK sem índice nas colunas {updated_by}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.wager_integrity_review_events.wager_integrity_review_events_changed_by_fkey | FK sem índice nas colunas {changed_by}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.wager_integrity_review_events.wager_integrity_review_events_target_user_id_fkey | FK sem índice nas colunas {target_user_id}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.wager_integrity_reviews.wager_integrity_reviews_reviewed_by_fkey | FK sem índice nas colunas {reviewed_by}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.wager_questions.wager_questions_created_by_fkey | FK sem índice nas colunas {created_by}: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | policy_auth_fn_not_wrapped | public.achievements.Admins can manage achievements | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.action_plan_items.Manage action plan items | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.action_plan_items.View action plan items | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.action_plan_updates.Create action plan updates | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.action_plan_updates.View action plan updates | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.action_plans.Admins delete action plans | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.action_plans.Managers create action plans | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.action_plans.Owners update action plans | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.action_plans.View action plans | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.activity_comments.Authenticated users can create comments | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.activity_comments.Users can delete their own comments | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.activity_comments.Users can update their own comments | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.activity_reactions.Authenticated users can add reactions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.activity_reactions.Users can remove their own reactions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.ai_coach_messages.Users can delete their own messages | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.ai_coach_messages.Users can insert their own messages | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.ai_coach_messages.Users can view their own messages | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.ai_course_jobs.Users create own ai course jobs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.ai_course_jobs.Users update own ai course jobs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.ai_course_jobs.Users view own ai course jobs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.announcement_reactions.Users can react to announcements | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.announcement_reads.Users can mark as read | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.announcement_reads.Users can view own reads | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.announcements.Admins can delete announcements | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.announcements.Authors can manage own announcements | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.announcements.Everyone can view published announcements | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.announcements.Managers can create announcements | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.api_request_logs.Admins can view API logs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.attendance_records.Managers can view team attendance | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.attendance_records.Users can insert own attendance | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.attendance_records.Users can view own attendance | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.attendance_settings.Admins can manage settings | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.attendance_streaks.Managers can view all streaks | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.attendance_streaks.Users can manage own streaks | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.attendance_streaks.Users can view own streaks | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.auction_admin_events.auction_admin_events_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.auction_bids.auction_bids_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.auction_bids.auction_bids_user_own | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.auctions.auctions_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.auctions.auctions_user_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.audit_logs.Admins can view all audit logs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.audit_logs.Authenticated insert audit logs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.audit_logs.Managers can view team audit logs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.audit_logs.Users can view own audit logs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.avatar_items.Admins can manage avatar items | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.avatar_items.Everyone can view active avatar items | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.bingo_board_tasks.bingo_board_tasks_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.bingo_boards.bingo_boards_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.bingo_boards.bingo_boards_user_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.bingo_cards.bingo_cards_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.bingo_cards.bingo_cards_user_own | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.bingo_marks.bingo_marks_admin_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.bingo_marks.bingo_marks_user_own | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.bitrix24_sync_mappings.Admins and managers can view sync mappings | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.bitrix24_sync_mappings.Admins can manage sync mappings | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.bitrix24_tokens.Admins can manage bitrix tokens | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.bitrix24_webhook_logs.Admins can view webhook logs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.bitrix24_webhook_logs.Authenticated insert webhook logs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.blocked_ips.Admins can manage blocked_ips | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.board_moves.board_moves_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.board_moves.board_moves_user_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.board_player_states.board_player_states_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.board_player_states.board_player_states_manager_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.board_player_states.board_player_states_user_own | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.board_tiles.board_tiles_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.board_trails.board_trails_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.board_trails.board_trails_user_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.boss_battle_damage.boss_battle_damage_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.boss_battle_damage.boss_battle_damage_user_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.boss_battle_rewards.boss_battle_rewards_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.boss_battle_rewards.boss_battle_rewards_user_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.boss_battles.boss_battles_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.boss_battles.boss_battles_user_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.boss_win_rate_goals.boss_win_rate_goals_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.campaign_participants.participants_delete_admin | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.campaign_participants.participants_insert_self_or_admin | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.campaign_participants.participants_update_self_or_admin | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.campaign_progress_events.campaign_events_insert_self_or_admin | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.campaign_result_imports.campaign_imports_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.campaign_result_imports.campaign_imports_creator_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.campaign_result_rows.campaign_result_rows_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.campaign_team_members.campaign_team_members_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.campaign_team_split_batches.campaign_team_split_batches_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.campaign_team_split_entries.campaign_team_split_entries_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.campaign_teams.campaign_teams_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.card_definitions.card_definitions_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.card_definitions.card_definitions_user_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.card_packs.card_packs_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.card_packs.card_packs_user_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.card_set_claims.card_set_claims_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.card_set_claims.card_set_claims_user_own | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.card_trades.card_trades_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.card_trades.card_trades_participants_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.card_trades.card_trades_participants_update | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.card_trades.card_trades_proposer_insert | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.celebrations.Authenticated create celebrations | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.celebrations.Users can manage own celebrations | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.celebrations.Users can view public celebrations | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.certifications.Admins can manage certifications | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.checkin_templates.Managers can create templates | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.checkin_templates.Template owners can manage | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.checkins.Admins can view all checkins | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.checkins.Managers can create checkins | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.checkins.Participants can update checkins | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.checkins.Participants can view their checkins | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.climate_benchmarks.Admins manage benchmarks | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.climate_pillar_scores.Managers can view pillar scores | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.climate_pillar_scores.System can manage pillar scores | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.climate_question_answers.Users view own answers | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.climate_survey_questions.Managers can add survey questions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.climate_survey_questions.Managers can delete draft survey questions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.climate_survey_questions.Managers can update survey questions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.climate_survey_questions.View survey questions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.climate_survey_responses.Users can view own responses | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.climate_surveys.Admins can delete surveys | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.climate_surveys.Creators can update surveys | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.climate_surveys.Everyone can view active surveys | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.climate_surveys.Managers can create climate surveys | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.competencies.Admins can manage competencies | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.custom_badges.Admins can manage badges | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.custom_badges.Everyone can view active badges | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.custom_quests.Everyone can view active quests | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.custom_quests.Managers and admins can create quests | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.custom_quests.Managers and admins can delete their quests | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.custom_quests.Managers and admins can update their quests | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.custom_ranks.Admins can manage ranks | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.custom_titles.Admins can manage titles | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.custom_titles.Everyone can view active titles | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.demographic_attributes.Admins can manage demographic attributes | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.demographic_attributes.Everyone can view active demographic attributes | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.department_missions.Admins can manage missions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.department_missions.Everyone can view active missions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.department_rankings.System can manage rankings | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.department_war_contributions.department_war_contributions_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.department_war_contributions.department_war_contributions_user_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.department_war_departments.dept_war_departments_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.department_war_metrics.department_war_metrics_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.department_war_results.dept_war_results_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.department_wars.department_wars_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.department_wars.department_wars_user_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.departments.Admins can manage departments | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.development_plan_actions.Admins can view all plan actions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.development_plan_actions.Users can create plan actions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.development_plan_actions.Users can delete plan actions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.development_plan_actions.Users can update plan actions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.development_plan_actions.Users can view their plan actions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.development_plans.Admins can view all development plans | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.development_plans.Managers can view team development plans | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.development_plans.Users and managers can update development plans | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.development_plans.Users can create their own development plans | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.development_plans.Users can view their own development plans | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.direct_duels.Users can create duels | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.direct_duels.Users can update their duels | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.direct_duels.Users can view their duels | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.engagement_action_playbooks.engagement_action_playbooks_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.engagement_action_playbooks.engagement_action_playbooks_manager_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.engagement_answers.engagement_answers_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.engagement_answers.engagement_answers_manager_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.engagement_answers.engagement_answers_user_insert | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.engagement_answers.engagement_answers_user_select_own | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.engagement_cycles.engagement_cycles_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.engagement_cycles.engagement_cycles_user_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.engagement_factors.engagement_factors_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.engagement_question_assignments.engagement_question_assignments_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.engagement_question_assignments.engagement_question_assignments_user_own | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.engagement_question_pool.engagement_question_pool_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.engagement_snapshots.Admins can manage snapshots | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.engagement_snapshots.Managers can view department snapshots | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.enps_responses.Admins can view all responses | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.enps_responses.Users can submit their responses | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.enps_responses.Users can view their own responses | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.enps_surveys.Admins can manage surveys | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.enps_surveys.Everyone can view active surveys | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.entity_versions.Users can insert versions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.entity_versions.Users can view versions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.executive_monthly_reports.Admins manage monthly reports | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.executive_monthly_reports.Admins read monthly reports | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.external_api_keys.Admins can manage API keys | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.external_tasks.Admins manage external tasks | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.external_tasks.Users can view own external tasks | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.feedback_cycles.Everyone can view active cycles | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.feedback_cycles.Managers can manage cycles | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.feedback_evaluations.Users insert own evaluations | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.feedback_evaluations.feedback_evaluations_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.feedback_evaluations.feedback_evaluations_update | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.feedback_requests.Admins can view all requests | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.feedback_requests.Managers can create requests | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.feedback_requests.Users can update their requests | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.feedback_requests.Users can view their feedback requests | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.feedback_responses.Admins can view all responses | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.feedback_responses.Receivers can view non-anonymous feedback | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.feedback_responses.Submitters can create responses | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.feedback_responses.Submitters can view own responses | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.feedback_results.Managers insert feedback results | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.feedback_results.feedback_results_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.gamification_themes.Admins can manage themes | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.gamification_themes.Everyone can view active themes | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.geo_access_logs.Admins podem ver logs de acesso geográfico | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.geo_access_logs.Authenticated insert geo logs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.geo_allowed_countries.Admins can manage allowed countries | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.geo_blocking_rules.Admins podem gerenciar regras de geo blocking | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.geo_settings.Admins can manage geo settings | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.goal_templates.goal_templates_delete | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.goal_templates.goal_templates_insert | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.goal_templates.goal_templates_update | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.goal_updates.Goal owners and admins can view goal updates | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.goal_updates.Goal owners can insert updates | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.goals.Managers can manage team goals | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.goals.Users can create own goals | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.goals.Users can delete own draft goals | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.goals.Users can update own goals | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.goals.Users can view own goals | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.goals.Users can view team goals | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.ip_access_logs.Admins can view IP access logs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.ip_whitelist.Admins can delete IP whitelist | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.ip_whitelist.Admins can insert IP whitelist | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.ip_whitelist.Admins can update IP whitelist | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.ip_whitelist.Admins can view IP whitelist | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.key_results.Goal owners and admins can view key results | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.key_results.Goal owners can manage key results | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.kudos.Authenticated users can give kudos | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.kudos.Public kudos are viewable by all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.kudos.Users can delete kudos they gave | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.kudos_badges.Admins can manage badges | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.league_history.Authenticated insert league history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.leagues.Admins can manage leagues | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.learning_trails.Creators and admins can delete trails | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.learning_trails.Creators and admins can update trails | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.learning_trails.Everyone can view published trails | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.learning_trails.Managers and admins can create trails | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.level_configs.Admins can manage level configs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.lightning_quiz_answers.lightning_quiz_answers_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.lightning_quiz_answers.lightning_quiz_answers_admin_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.lightning_quiz_answers.lightning_quiz_answers_user_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.lightning_quiz_questions.lightning_quiz_questions_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.lightning_quiz_questions.lightning_quiz_questions_user_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.lightning_quiz_sessions.lightning_quiz_sessions_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.lightning_quiz_sessions.lightning_quiz_sessions_user_own | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.login_attempts.Admins can view login attempts | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.lucky_wheel_payout_snapshots.lucky_wheel_payout_snapshots_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.lucky_wheel_prize_audit.lucky_wheel_prize_audit_admin_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.lucky_wheel_prizes.lucky_wheel_prizes_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.lucky_wheel_prizes.lucky_wheel_prizes_user_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.lucky_wheel_settings.lucky_wheel_settings_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.lucky_wheel_settings_audit.lucky_wheel_settings_audit_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.lucky_wheel_spins.lucky_wheel_spins_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.lucky_wheel_spins.lucky_wheel_spins_user_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.lucky_wheel_whatif_snapshots.lucky_wheel_whatif_snapshots_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.memory_decks.memory_decks_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.memory_decks.memory_decks_user_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.memory_pairs.memory_pairs_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.memory_sessions.memory_sessions_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.memory_sessions.memory_sessions_user_own | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.mentorship_mission_progress.Users can insert progress for their pairs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.mentorship_mission_progress.Users can update their pair progress | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.mentorship_mission_progress.Users can view their pair progress | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.mentorship_missions.Admins can manage missions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.mentorship_missions.Everyone can view active missions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.mentorship_pairs.Users can create mentorship pairs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.mentorship_pairs.Users can update their own pairs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.mentorship_pairs.Users can view their own mentorship pairs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.mentorship_requests.Users can create requests | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.mentorship_requests.Users can update requests targeting them | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.mentorship_requests.Users can view their requests | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.module_progress.Users can insert own progress | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.module_progress.Users can update own progress | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.module_progress.Users can view own progress | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.mood_entries.Managers and admins can view team mood data | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.mood_entries.Users can manage own mood entries | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.new_device_alerts.Authenticated insert device alerts | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.new_device_alerts.Users can update their own alerts | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.new_device_alerts.Users can view their own alerts | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.nine_box_evaluations.Admins and managers can create evaluations | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.nine_box_evaluations.Admins and managers can update evaluations | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.nine_box_evaluations.Admins can view all evaluations | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.nine_box_evaluations.Managers can view their team evaluations | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.nine_box_evaluations.Users can view their own evaluations | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.notification_preferences.Users can manage own notification preferences | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.notifications.Authenticated insert notifications | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.notifications.Users can delete their own notifications | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.notifications.Users can update their own notifications | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.notifications.Users can view their own notifications | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.nr1_factor_mappings.nr1_factor_mappings_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.nr1_risk_categories.nr1_risk_categories_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.onboarding_progress.Users can insert own onboarding | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.onboarding_progress.Users can update own onboarding | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.onboarding_progress.Users can view own onboarding | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.opinion_responses.Responders can create responses | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.opinion_responses.View opinion responses | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.opinion_supports.opinion_supports_user_own | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.opinion_tags.Manage opinion tags | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.opinions.Recipients can update opinions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.opinions.Users can create opinions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.opinions.View opinions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.org_members.Members can view their org membership | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.org_members.Org admins manage members | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.org_theme_history.Org admins insert history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.org_theme_history.Org admins view history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.organizations.Org admins can update | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.password_reset_requests.Managers can update team password reset requests | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.password_reset_requests.Managers can view team password reset requests | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.password_reset_requests.Users can create own password reset requests | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.password_reset_requests.Users can view own password reset requests | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.pdi_checkins.pdi_checkins_insert | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.pdi_checkins.pdi_checkins_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.pdi_mentors.Managers assign PDI mentors | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.pdi_mentors.pdi_mentors_delete | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.pdi_mentors.pdi_mentors_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.pdi_templates.pdi_templates_delete_admin | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.pdi_templates.pdi_templates_insert_admin | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.pdi_templates.pdi_templates_update_admin | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.penalty_rules.Admins can manage penalty rules | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.penalty_rules.Everyone can view active rules | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.permission_groups.Admins can manage permission groups | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.permissions.Admins can manage permissions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.position_competencies.Admins manage position competencies | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.position_task_templates.Admins and managers can manage templates | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.position_task_templates.Everyone can view active templates | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.positions.Admins can manage positions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.postmortem_actions.Admins manage postmortem actions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.postmortems.Admins manage postmortems | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.prediction_admin_events.prediction_admin_events_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.prediction_markets.prediction_markets_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.prediction_markets.prediction_markets_user_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.prediction_options.prediction_options_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.prediction_options.prediction_options_user_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.prediction_stakes.prediction_stakes_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.prediction_stakes.prediction_stakes_user_own | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.profiles.Users can insert their own profile | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.profiles.Users can update own profile | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.pulse_responses.Managers can view anonymous aggregated responses | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.pulse_responses.Users can submit responses | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.pulse_responses.Users can view own responses | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.pulse_surveys.Managers can manage surveys | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.pulse_surveys.Users can view active surveys for their department | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.purchase_approvals.purchase_approvals_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.purchase_approvals.purchase_approvals_user_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.push_notification_logs.Users read own push logs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.push_outbox.push_outbox_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.push_outbox.push_outbox_user_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.push_outbox_health_snapshots.push_outbox_health_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.push_subscriptions.Users manage own push subs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.push_sync_events.push_sync_events_admin_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.push_sync_events.push_sync_events_authenticated_insert | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.push_sync_events.push_sync_events_user_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.query_telemetry.Admins can delete telemetry | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.query_telemetry.Admins can read telemetry | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.query_telemetry.Users can insert their own telemetry | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.quest_assignments.Managers can create assignments | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.quest_assignments.Managers can view team assignments | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.quest_assignments.Users can update their own progress | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.quest_assignments.Users can view their own assignments | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.quest_steps.Quest creators can manage steps | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.quiz_answers.Users can insert own answers | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.quiz_answers.Users can view own quiz answers | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.quiz_options.Admins and managers can manage options | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.quiz_options.Everyone can view options of active questions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.quiz_questions.Admins and managers can manage questions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.quiz_questions.Everyone can view active questions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.quiz_scores.Users can insert their own scores | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.rate_limit_logs.Admins can view rate limit logs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.rate_limit_rules.Admins can manage rate_limit_rules | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.role_permissions.Admins can manage role permissions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.runbook_executions.Admins manage runbook executions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.sales_campaigns.campaigns_delete_admin | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.sales_campaigns.campaigns_insert_admin_manager | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.sales_campaigns.campaigns_update_admin_manager | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.saved_filters.Users can delete own filters | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.saved_filters.Users can insert own filters | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.saved_filters.Users can update own filters | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.saved_filters.Users can view own filters | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.scratch_card_prizes.scratch_card_prizes_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.scratch_card_prizes.scratch_card_prizes_user_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.scratch_cards.scratch_cards_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.scratch_cards.scratch_cards_user_insert | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.scratch_cards.scratch_cards_user_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.scratch_cards.scratch_cards_user_update | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.seasonal_challenges.Admins can manage challenges | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.seasonal_challenges.Everyone can view challenges | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.seasonal_events.Admins can manage events | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.seasonal_events.Everyone can view active events | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.security_alerts.Admins can manage security alerts | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.sequence_attempts.sequence_attempts_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.sequence_attempts.sequence_attempts_user_own | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.sequence_procedures.sequence_procedures_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.sequence_procedures.sequence_procedures_user_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.sequence_steps.sequence_steps_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.session_logs.Users can update own sessions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.session_logs.Users can view own sessions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.shop_promotions.Admins can manage promotions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.shop_promotions.Admins can view all promotions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.shop_purchases.Admins can update purchases | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.shop_purchases.Admins can view all purchases | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.shop_purchases.Users can create purchases | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.shop_purchases.Users can view own purchases | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.shop_rewards.Admins can manage rewards | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.shop_rewards.Everyone can view active rewards | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.sla_targets.Admins manage SLA targets | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.task_penalties.Admins can manage penalties | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.task_penalties.Managers can view all penalties | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.task_penalties.Users can view own penalties | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.task_scores.Admins can manage task scores | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.task_scores.Managers can view all task scores | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.task_scores.Managers insert task scores | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.task_scores.Managers update task scores | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.task_scores.Users can view own task scores | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.team_members.Admins can manage team members | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.team_members.Managers can view their team members | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.team_members.Users can view their own team membership | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.tournament_matches.tournament_matches_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.tournament_participants.tournament_participants_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.tournaments.tournaments_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.tournaments.tournaments_user_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.trail_enrollments.Users can enroll themselves | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.trail_enrollments.Users can update own enrollments | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.trail_enrollments.Users can view own enrollments | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.trail_modules.Everyone can view modules of published trails | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.trail_modules.Trail creators can manage modules | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.trail_prerequisites.Admins and managers can manage prerequisites | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_achievements.Managers can view team achievements | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_achievements.System can insert achievements | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_achievements.Users can view own achievements | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_avatar_config.Users can insert own avatar config | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_avatar_config.Users can update own avatar config | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_avatar_items.Users can insert own avatar items | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_avatar_items.Users can view own avatar items | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_cards.user_cards_admin_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_cards.user_cards_user_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_certifications.Authenticated insert certifications | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_certifications.Managers can update certifications | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_certifications.Managers can view team certifications | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_certifications.Users can view own certifications | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_challenges.Users can insert their own challenges | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_challenges.Users can update their own challenges | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_challenges.Users can view their own challenges | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_combos.Managers can view team combos | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_combos.Users can insert own combos | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_combos.Users can update own combos | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_combos.Users can view own combos | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_competency_assessments.Managers insert competency assessments | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_competency_assessments.user_competency_assessments_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_demographic_values.Admins can view demographic values | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_demographic_values.Users can manage own demographic values | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_devices.Authenticated insert devices | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_devices.Users can update their own devices | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_devices.Users can view their own devices | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_leagues.System can manage user leagues | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_leagues.Users can insert own league | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_mission_progress.Users can insert own progress | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_mission_progress.Users can update own progress | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_mission_progress.Users can view own progress | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_permission_groups.Admins can manage user permission groups | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_permission_groups.Users can view own permission groups | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_positions.Admins can manage user positions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_positions.Managers can view team positions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_positions.Users can view own positions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_roles.Admins can manage all roles | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_roles.Users can view their own roles | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_seasonal_progress.Managers can view all progress | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_seasonal_progress.Users can insert own progress | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_seasonal_progress.Users can update own progress | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_seasonal_progress.Users can view own progress | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_titles.Admins can manage user titles | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_titles.Users can view own titles | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_two_factor.Users can insert their own 2FA settings | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_two_factor.Users can update their own 2FA settings | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.user_two_factor.Users can view their own 2FA settings | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.wager_budget_settings.wager_budget_settings_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.wager_budget_settings.wager_budget_settings_manager_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.wager_entries.wager_entries_admin_manage | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.wager_entries.wager_entries_admin_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.wager_entries.wager_entries_user_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.wager_integrity_review_events.wager_integrity_review_events_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.wager_integrity_reviews.Managers and admins can read integrity reviews | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.wager_integrity_reviews.wager_integrity_reviews_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.wager_questions.wager_questions_admin_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.wager_questions.wager_questions_user_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.wager_questions.wager_questions_user_select_own_entries | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.webauthn_challenges.Users can manage their own challenges | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.webauthn_credentials.Users can delete their own credentials | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.webauthn_credentials.Users can insert their own credentials | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.webauthn_credentials.Users can update their own credentials | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.webauthn_credentials.Users can view their own credentials | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.webhook_delivery_logs.Admins can view webhook logs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.webhook_subscriptions.Admins can manage webhooks | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.weekly_challenges.Admins can delete weekly challenges | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.weekly_challenges.Admins can insert weekly challenges | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.weekly_challenges.Admins can update weekly challenges | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | storage.objects.Authenticated users can upload course files | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | storage.objects.Users can view their own course files | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| INFO | rpc_anon_executable | public.check_login_lockout(p_email text) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.get_user_department_id(p_user_id uuid) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.has_role(_user_id uuid, _role app_role) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.is_country_allowed(p_country_code character varying) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.is_department_manager(_user_id uuid, _department_id uuid) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.is_ip_blocked(p_ip_address inet) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.is_ip_whitelisted(p_ip_address inet) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.log_geo_access(p_ip_address inet, p_country_code character varying, p_country_name character varying, p_user_id uuid, p_was_allowed boolean, p_reason text, p_user_agent text, p_endpoint text) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.log_ip_access(p_ip_address inet, p_user_id uuid, p_endpoint text, p_was_allowed boolean, p_reason text, p_user_agent text) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.log_login_attempt(p_email text, p_ip_address inet, p_user_agent text, p_attempt_type text, p_error_message text) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.request_password_reset(p_user_id uuid) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.request_password_reset_by_email(p_email text) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.reset_password_with_token(p_token uuid, p_password text) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.rls_auto_enable() | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.user_has_passkeys(p_user_id uuid) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.validate_api_key(p_api_key text, p_api_secret text) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.verify_certificate(_code text) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
