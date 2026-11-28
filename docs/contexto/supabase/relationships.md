# Relacionamentos (chaves estrangeiras)


| de | colunas | para | colunas | on delete | on update |
|---|---|---|---|---|---|
| public.action_plan_items | {plan_id} | public.action_plans | {id} | CASCADE | NO ACTION |
| public.action_plan_updates | {plan_id} | public.action_plans | {id} | CASCADE | NO ACTION |
| public.action_plans | {department_id} | public.departments | {id} | SET NULL | NO ACTION |
| public.action_plans | {engagement_factor_id} | public.engagement_factors | {id} | SET NULL | NO ACTION |
| public.action_plans | {nr1_category_id} | public.nr1_risk_categories | {id} | SET NULL | NO ACTION |
| public.action_plans | {opinion_id} | public.opinions | {id} | SET NULL | NO ACTION |
| public.action_plans | {related_survey_id} | public.climate_surveys | {id} | SET NULL | NO ACTION |
| public.ai_course_jobs | {generated_trail_id} | public.learning_trails | {id} | SET NULL | NO ACTION |
| public.ai_course_jobs | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.announcement_reactions | {announcement_id} | public.announcements | {id} | CASCADE | NO ACTION |
| public.announcement_reads | {announcement_id} | public.announcements | {id} | CASCADE | NO ACTION |
| public.announcements | {author_id} | public.profiles | {id} | CASCADE | NO ACTION |
| public.announcements | {department_id} | public.departments | {id} | SET NULL | NO ACTION |
| public.api_request_logs | {api_key_id} | public.external_api_keys | {id} | SET NULL | NO ACTION |
| public.attendance_records | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.attendance_settings | {department_id} | public.departments | {id} | CASCADE | NO ACTION |
| public.attendance_streaks | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.auction_admin_events | {actor_id} | auth.users | {id} | SET NULL | NO ACTION |
| public.auction_admin_events | {auction_id} | public.auctions | {id} | SET NULL | NO ACTION |
| public.auction_bids | {auction_id} | public.auctions | {id} | CASCADE | NO ACTION |
| public.auction_bids | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.auctions | {created_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.auctions | {reward_id} | public.shop_rewards | {id} | SET NULL | NO ACTION |
| public.auctions | {winner_id} | auth.users | {id} | SET NULL | NO ACTION |
| public.bingo_board_tasks | {board_id} | public.bingo_boards | {id} | CASCADE | NO ACTION |
| public.bingo_cards | {board_id} | public.bingo_boards | {id} | CASCADE | NO ACTION |
| public.bingo_cards | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.bingo_marks | {card_id} | public.bingo_cards | {id} | CASCADE | NO ACTION |
| public.bingo_marks | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.blocked_ips | {blocked_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.board_moves | {trail_id} | public.board_trails | {id} | CASCADE | NO ACTION |
| public.board_moves | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.board_player_states | {trail_id} | public.board_trails | {id} | CASCADE | NO ACTION |
| public.board_player_states | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.board_tiles | {trail_id} | public.board_trails | {id} | CASCADE | NO ACTION |
| public.board_trails | {created_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.board_trails | {department_id} | public.departments | {id} | SET NULL | NO ACTION |
| public.boss_battle_damage | {battle_id} | public.boss_battles | {id} | CASCADE | NO ACTION |
| public.boss_battle_damage | {department_id} | public.departments | {id} | SET NULL | NO ACTION |
| public.boss_battle_damage | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.boss_battle_rewards | {battle_id} | public.boss_battles | {id} | CASCADE | NO ACTION |
| public.boss_battle_rewards | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.boss_battles | {created_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.boss_battles | {department_id} | public.departments | {id} | SET NULL | NO ACTION |
| public.boss_win_rate_goals | {department_id} | public.departments | {id} | CASCADE | NO ACTION |
| public.boss_win_rate_goals | {updated_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.campaign_participants | {campaign_id} | public.sales_campaigns | {id} | CASCADE | NO ACTION |
| public.campaign_participants | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.campaign_progress_events | {campaign_id} | public.sales_campaigns | {id} | CASCADE | NO ACTION |
| public.campaign_progress_events | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.campaign_result_imports | {campaign_id} | public.sales_campaigns | {id} | CASCADE | NO ACTION |
| public.campaign_result_imports | {created_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.campaign_result_rows | {campaign_id} | public.sales_campaigns | {id} | CASCADE | NO ACTION |
| public.campaign_result_rows | {import_id} | public.campaign_result_imports | {id} | CASCADE | NO ACTION |
| public.campaign_result_rows | {user_id} | auth.users | {id} | SET NULL | NO ACTION |
| public.campaign_team_members | {campaign_id} | public.sales_campaigns | {id} | CASCADE | NO ACTION |
| public.campaign_team_members | {team_id} | public.campaign_teams | {id} | CASCADE | NO ACTION |
| public.campaign_team_members | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.campaign_team_split_batches | {campaign_id} | public.sales_campaigns | {id} | CASCADE | NO ACTION |
| public.campaign_team_split_batches | {executed_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.campaign_team_split_batches | {reverted_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.campaign_team_split_entries | {batch_id} | public.campaign_team_split_batches | {id} | CASCADE | NO ACTION |
| public.campaign_team_split_entries | {campaign_id} | public.sales_campaigns | {id} | CASCADE | NO ACTION |
| public.campaign_team_split_entries | {team_id} | public.campaign_teams | {id} | SET NULL | NO ACTION |
| public.campaign_team_split_entries | {user_id} | auth.users | {id} | SET NULL | NO ACTION |
| public.campaign_teams | {campaign_id} | public.sales_campaigns | {id} | CASCADE | NO ACTION |
| public.campaign_teams | {created_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.campaign_teams | {department_id} | public.departments | {id} | SET NULL | NO ACTION |
| public.card_packs | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.card_set_claims | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.card_trades | {offered_card_id} | public.card_definitions | {id} | CASCADE | NO ACTION |
| public.card_trades | {proposer_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.card_trades | {requested_card_id} | public.card_definitions | {id} | CASCADE | NO ACTION |
| public.card_trades | {responder_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.celebrations | {user_id} | public.profiles | {id} | CASCADE | NO ACTION |
| public.certifications | {department_id} | public.departments | {id} | SET NULL | NO ACTION |
| public.certifications | {trail_id} | public.learning_trails | {id} | RESTRICT | NO ACTION |
| public.checkins | {template_id} | public.checkin_templates | {id} | RESTRICT | NO ACTION |
| public.climate_pillar_scores | {department_id} | public.departments | {id} | SET NULL | NO ACTION |
| public.climate_pillar_scores | {survey_id} | public.climate_surveys | {id} | CASCADE | NO ACTION |
| public.climate_question_answers | {question_id} | public.climate_survey_questions | {id} | CASCADE | NO ACTION |
| public.climate_question_answers | {response_id} | public.climate_survey_responses | {id} | CASCADE | NO ACTION |
| public.climate_survey_questions | {survey_id} | public.climate_surveys | {id} | CASCADE | NO ACTION |
| public.climate_survey_responses | {survey_id} | public.climate_surveys | {id} | CASCADE | NO ACTION |
| public.climate_surveys | {department_id} | public.departments | {id} | SET NULL | NO ACTION |
| public.competencies | {department_id} | public.departments | {id} | SET NULL | NO ACTION |
| public.custom_badges | {theme_id} | public.gamification_themes | {id} | CASCADE | NO ACTION |
| public.custom_quests | {department_id} | public.departments | {id} | SET NULL | NO ACTION |
| public.custom_ranks | {theme_id} | public.gamification_themes | {id} | CASCADE | NO ACTION |
| public.custom_titles | {theme_id} | public.gamification_themes | {id} | CASCADE | NO ACTION |
| public.department_missions | {department_id} | public.departments | {id} | CASCADE | NO ACTION |
| public.department_rankings | {department_id} | public.departments | {id} | CASCADE | NO ACTION |
| public.department_war_contributions | {department_id} | public.departments | {id} | CASCADE | NO ACTION |
| public.department_war_contributions | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.department_war_contributions | {war_id} | public.department_wars | {id} | CASCADE | NO ACTION |
| public.department_war_departments | {department_id} | public.departments | {id} | CASCADE | NO ACTION |
| public.department_war_departments | {war_id} | public.department_wars | {id} | CASCADE | NO ACTION |
| public.department_war_metrics | {war_id} | public.department_wars | {id} | CASCADE | NO ACTION |
| public.department_war_results | {department_id} | public.departments | {id} | CASCADE | NO ACTION |
| public.department_war_results | {war_id} | public.department_wars | {id} | CASCADE | NO ACTION |
| public.department_wars | {created_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.development_plan_actions | {competency_id} | public.competencies | {id} | RESTRICT | NO ACTION |
| public.development_plan_actions | {plan_id} | public.development_plans | {id} | CASCADE | NO ACTION |
| public.development_plans | {created_by} | auth.users | {id} | NO ACTION | NO ACTION |
| public.development_plans | {linked_feedback_id} | public.feedback_responses | {id} | SET NULL | NO ACTION |
| public.development_plans | {linked_nine_box_id} | public.nine_box_evaluations | {id} | SET NULL | NO ACTION |
| public.development_plans | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.engagement_answers | {cycle_id} | public.engagement_cycles | {id} | CASCADE | NO ACTION |
| public.engagement_answers | {department_id} | public.departments | {id} | SET NULL | NO ACTION |
| public.engagement_answers | {question_id} | public.engagement_question_pool | {id} | CASCADE | NO ACTION |
| public.engagement_answers | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.engagement_cycles | {created_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.engagement_cycles | {department_id} | public.departments | {id} | SET NULL | NO ACTION |
| public.engagement_question_assignments | {cycle_id} | public.engagement_cycles | {id} | CASCADE | NO ACTION |
| public.engagement_question_assignments | {question_id} | public.engagement_question_pool | {id} | CASCADE | NO ACTION |
| public.engagement_question_assignments | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.engagement_question_pool | {factor_id} | public.engagement_factors | {id} | SET NULL | NO ACTION |
| public.engagement_snapshots | {department_id} | public.departments | {id} | SET NULL | NO ACTION |
| public.enps_responses | {survey_id} | public.enps_surveys | {id} | CASCADE | NO ACTION |
| public.enps_responses | {user_id} | auth.users | {id} | NO ACTION | NO ACTION |
| public.enps_surveys | {created_by} | auth.users | {id} | NO ACTION | NO ACTION |
| public.enps_surveys | {department_id} | public.departments | {id} | SET NULL | NO ACTION |
| public.entity_versions | {changed_by} | auth.users | {id} | NO ACTION | NO ACTION |
| public.external_tasks | {api_key_id} | public.external_api_keys | {id} | SET NULL | NO ACTION |
| public.feedback_cycles | {department_id} | public.departments | {id} | SET NULL | NO ACTION |
| public.feedback_evaluations | {cycle_id} | public.feedback_cycles | {id} | CASCADE | NO ACTION |
| public.feedback_questions | {competency_id} | public.competencies | {id} | RESTRICT | NO ACTION |
| public.feedback_questions | {cycle_id} | public.feedback_cycles | {id} | CASCADE | NO ACTION |
| public.feedback_requests | {cycle_id} | public.feedback_cycles | {id} | CASCADE | NO ACTION |
| public.feedback_responses | {request_id} | public.feedback_requests | {id} | CASCADE | NO ACTION |
| public.feedback_results | {competency_id} | public.competencies | {id} | RESTRICT | NO ACTION |
| public.feedback_results | {cycle_id} | public.feedback_cycles | {id} | CASCADE | NO ACTION |
| public.gamification_themes | {department_id} | public.departments | {id} | CASCADE | NO ACTION |
| public.geo_access_logs | {user_id} | auth.users | {id} | NO ACTION | NO ACTION |
| public.geo_allowed_countries | {created_by} | auth.users | {id} | NO ACTION | NO ACTION |
| public.geo_blocking_rules | {created_by} | auth.users | {id} | NO ACTION | NO ACTION |
| public.geo_settings | {updated_by} | auth.users | {id} | NO ACTION | NO ACTION |
| public.goal_templates | {created_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.goal_updates | {goal_id} | public.goals | {id} | CASCADE | NO ACTION |
| public.goal_updates | {key_result_id} | public.key_results | {id} | CASCADE | NO ACTION |
| public.goals | {department_id} | public.departments | {id} | SET NULL | NO ACTION |
| public.ip_access_logs | {user_id} | auth.users | {id} | NO ACTION | NO ACTION |
| public.ip_whitelist | {created_by} | auth.users | {id} | NO ACTION | NO ACTION |
| public.key_results | {goal_id} | public.goals | {id} | CASCADE | NO ACTION |
| public.kudos | {badge_id} | public.kudos_badges | {id} | SET NULL | NO ACTION |
| public.league_history | {from_league_id} | public.leagues | {id} | RESTRICT | NO ACTION |
| public.league_history | {to_league_id} | public.leagues | {id} | RESTRICT | NO ACTION |
| public.league_history | {user_id} | public.profiles | {id} | CASCADE | NO ACTION |
| public.leagues | {department_id} | public.departments | {id} | SET NULL | NO ACTION |
| public.leagues | {theme_id} | public.gamification_themes | {id} | SET NULL | NO ACTION |
| public.learning_trails | {department_id} | public.departments | {id} | SET NULL | NO ACTION |
| public.level_configs | {rank_id} | public.custom_ranks | {id} | SET NULL | NO ACTION |
| public.level_configs | {theme_id} | public.gamification_themes | {id} | CASCADE | NO ACTION |
| public.lightning_quiz_answers | {question_id} | public.lightning_quiz_questions | {id} | CASCADE | NO ACTION |
| public.lightning_quiz_answers | {session_id} | public.lightning_quiz_sessions | {id} | CASCADE | NO ACTION |
| public.lightning_quiz_answers | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.lightning_quiz_sessions | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.lucky_wheel_prize_audit | {changed_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.lucky_wheel_prize_audit | {prize_id} | public.lucky_wheel_prizes | {id} | SET NULL | NO ACTION |
| public.lucky_wheel_prizes | {achievement_id} | public.achievements | {id} | SET NULL | NO ACTION |
| public.lucky_wheel_settings | {updated_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.lucky_wheel_settings_audit | {changed_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.lucky_wheel_spins | {prize_id} | public.lucky_wheel_prizes | {id} | SET NULL | NO ACTION |
| public.lucky_wheel_spins | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.lucky_wheel_whatif_snapshots | {created_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.memory_decks | {created_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.memory_decks | {department_id} | public.departments | {id} | SET NULL | NO ACTION |
| public.memory_pairs | {deck_id} | public.memory_decks | {id} | CASCADE | NO ACTION |
| public.memory_sessions | {deck_id} | public.memory_decks | {id} | CASCADE | NO ACTION |
| public.memory_sessions | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.mentorship_mission_progress | {mission_id} | public.mentorship_missions | {id} | CASCADE | NO ACTION |
| public.mentorship_mission_progress | {pair_id} | public.mentorship_pairs | {id} | CASCADE | NO ACTION |
| public.module_progress | {module_id} | public.trail_modules | {id} | CASCADE | NO ACTION |
| public.new_device_alerts | {device_id} | public.user_devices | {id} | CASCADE | NO ACTION |
| public.nine_box_evaluations | {evaluator_id} | auth.users | {id} | NO ACTION | NO ACTION |
| public.nine_box_evaluations | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.nr1_factor_mappings | {category_id} | public.nr1_risk_categories | {id} | CASCADE | NO ACTION |
| public.nr1_factor_mappings | {factor_id} | public.engagement_factors | {id} | CASCADE | NO ACTION |
| public.opinion_responses | {opinion_id} | public.opinions | {id} | CASCADE | NO ACTION |
| public.opinion_supports | {opinion_id} | public.opinions | {id} | CASCADE | NO ACTION |
| public.opinion_supports | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.opinion_tags | {opinion_id} | public.opinions | {id} | CASCADE | NO ACTION |
| public.org_members | {org_id} | public.organizations | {id} | CASCADE | NO ACTION |
| public.org_theme_history | {org_id} | public.organizations | {id} | CASCADE | NO ACTION |
| public.password_reset_requests | {reviewed_by} | auth.users | {id} | NO ACTION | NO ACTION |
| public.password_reset_requests | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.pdi_checkins | {plan_id} | public.development_plans | {id} | CASCADE | NO ACTION |
| public.pdi_mentors | {plan_id} | public.development_plans | {id} | CASCADE | NO ACTION |
| public.position_competencies | {competency_id} | public.competencies | {id} | CASCADE | NO ACTION |
| public.position_competencies | {position_id} | public.positions | {id} | CASCADE | NO ACTION |
| public.position_task_templates | {position_id} | public.positions | {id} | CASCADE | NO ACTION |
| public.positions | {department_id} | public.departments | {id} | SET NULL | NO ACTION |
| public.postmortem_actions | {owner_user_id} | auth.users | {id} | SET NULL | NO ACTION |
| public.postmortem_actions | {postmortem_id} | public.postmortems | {id} | CASCADE | NO ACTION |
| public.postmortems | {alert_id} | public.security_alerts | {id} | SET NULL | NO ACTION |
| public.postmortems | {created_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.prediction_admin_events | {actor_id} | auth.users | {id} | SET NULL | NO ACTION |
| public.prediction_admin_events | {market_id} | public.prediction_markets | {id} | CASCADE | NO ACTION |
| public.prediction_markets | {created_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.prediction_markets | {settled_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.prediction_markets | {winning_option_id} | public.prediction_options | {id} | SET NULL | NO ACTION |
| public.prediction_options | {market_id} | public.prediction_markets | {id} | CASCADE | NO ACTION |
| public.prediction_stakes | {market_id} | public.prediction_markets | {id} | CASCADE | NO ACTION |
| public.prediction_stakes | {option_id} | public.prediction_options | {id} | CASCADE | NO ACTION |
| public.prediction_stakes | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.profiles | {id} | auth.users | {id} | CASCADE | NO ACTION |
| public.pulse_responses | {survey_id} | public.pulse_surveys | {id} | CASCADE | NO ACTION |
| public.pulse_surveys | {department_id} | public.departments | {id} | SET NULL | NO ACTION |
| public.purchase_approvals | {actor_id} | auth.users | {id} | SET NULL | NO ACTION |
| public.purchase_approvals | {purchase_id} | public.shop_purchases | {id} | CASCADE | NO ACTION |
| public.push_notification_logs | {subscription_id} | public.push_subscriptions | {id} | SET NULL | NO ACTION |
| public.push_outbox | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.push_subscriptions | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.push_sync_events | {subscription_id} | public.push_subscriptions | {id} | SET NULL | NO ACTION |
| public.push_sync_events | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.quest_assignments | {quest_id} | public.custom_quests | {id} | CASCADE | NO ACTION |
| public.quest_steps | {quest_id} | public.custom_quests | {id} | CASCADE | NO ACTION |
| public.quiz_answers | {question_id} | public.quiz_questions | {id} | CASCADE | NO ACTION |
| public.quiz_answers | {selected_option_id} | public.quiz_options | {id} | SET NULL | NO ACTION |
| public.quiz_options | {question_id} | public.quiz_questions | {id} | CASCADE | NO ACTION |
| public.quiz_questions | {department_id} | public.departments | {id} | SET NULL | NO ACTION |
| public.rate_limit_logs | {user_id} | auth.users | {id} | SET NULL | NO ACTION |
| public.role_permissions | {permission_id} | public.permissions | {id} | CASCADE | NO ACTION |
| public.role_permissions | {role_id} | public.roles | {id} | CASCADE | NO ACTION |
| public.runbook_executions | {alert_id} | public.security_alerts | {id} | CASCADE | NO ACTION |
| public.runbook_executions | {performed_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.sales_campaigns | {created_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.sales_campaigns | {department_id} | public.departments | {id} | SET NULL | NO ACTION |
| public.sales_campaigns | {org_id} | public.organizations | {id} | CASCADE | NO ACTION |
| public.saved_filters | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.scratch_cards | {prize_id} | public.scratch_card_prizes | {id} | SET NULL | NO ACTION |
| public.scratch_cards | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.seasonal_challenges | {event_id} | public.seasonal_events | {id} | CASCADE | NO ACTION |
| public.security_alerts | {acknowledged_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.security_alerts | {resolved_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.security_alerts | {user_id} | auth.users | {id} | SET NULL | NO ACTION |
| public.sequence_attempts | {procedure_id} | public.sequence_procedures | {id} | CASCADE | NO ACTION |
| public.sequence_attempts | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.sequence_procedures | {created_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.sequence_procedures | {department_id} | public.departments | {id} | SET NULL | NO ACTION |
| public.sequence_steps | {procedure_id} | public.sequence_procedures | {id} | CASCADE | NO ACTION |
| public.session_logs | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.shop_promotions | {reward_id} | public.shop_rewards | {id} | CASCADE | NO ACTION |
| public.shop_purchases | {approved_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.shop_purchases | {first_approver_id} | auth.users | {id} | SET NULL | NO ACTION |
| public.shop_purchases | {reward_id} | public.shop_rewards | {id} | CASCADE | NO ACTION |
| public.shop_purchases | {user_id} | public.profiles | {id} | CASCADE | NO ACTION |
| public.task_penalties | {task_score_id} | public.task_scores | {id} | CASCADE | NO ACTION |
| public.task_scores | {task_template_id} | public.position_task_templates | {id} | SET NULL | NO ACTION |
| public.team_members | {department_id} | public.departments | {id} | CASCADE | NO ACTION |
| public.team_members | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.tournament_matches | {away_participant_id} | public.tournament_participants | {id} | SET NULL | NO ACTION |
| public.tournament_matches | {home_participant_id} | public.tournament_participants | {id} | SET NULL | NO ACTION |
| public.tournament_matches | {tournament_id} | public.tournaments | {id} | CASCADE | NO ACTION |
| public.tournament_matches | {winner_participant_id} | public.tournament_participants | {id} | SET NULL | NO ACTION |
| public.tournament_participants | {tournament_id} | public.tournaments | {id} | CASCADE | NO ACTION |
| public.tournament_participants | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.tournaments | {champion_user_id} | auth.users | {id} | SET NULL | NO ACTION |
| public.tournaments | {created_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.tournaments | {runner_up_user_id} | auth.users | {id} | SET NULL | NO ACTION |
| public.trail_enrollments | {trail_id} | public.learning_trails | {id} | CASCADE | NO ACTION |
| public.trail_modules | {trail_id} | public.learning_trails | {id} | CASCADE | NO ACTION |
| public.trail_prerequisites | {prerequisite_trail_id} | public.learning_trails | {id} | CASCADE | NO ACTION |
| public.trail_prerequisites | {trail_id} | public.learning_trails | {id} | CASCADE | NO ACTION |
| public.user_achievements | {achievement_id} | public.achievements | {id} | CASCADE | NO ACTION |
| public.user_avatar_config | {selected_accessory} | public.avatar_items | {id} | SET NULL | NO ACTION |
| public.user_avatar_config | {selected_background} | public.avatar_items | {id} | SET NULL | NO ACTION |
| public.user_avatar_config | {selected_badge_style} | public.avatar_items | {id} | SET NULL | NO ACTION |
| public.user_avatar_config | {selected_effect} | public.avatar_items | {id} | SET NULL | NO ACTION |
| public.user_avatar_config | {selected_frame} | public.avatar_items | {id} | SET NULL | NO ACTION |
| public.user_avatar_items | {item_id} | public.avatar_items | {id} | CASCADE | NO ACTION |
| public.user_cards | {card_id} | public.card_definitions | {id} | CASCADE | NO ACTION |
| public.user_cards | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.user_certifications | {certification_id} | public.certifications | {id} | CASCADE | NO ACTION |
| public.user_challenges | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.user_competency_assessments | {competency_id} | public.competencies | {id} | CASCADE | NO ACTION |
| public.user_competency_assessments | {feedback_cycle_id} | public.feedback_cycles | {id} | RESTRICT | NO ACTION |
| public.user_demographic_values | {attribute_id} | public.demographic_attributes | {id} | CASCADE | NO ACTION |
| public.user_leagues | {league_id} | public.leagues | {id} | RESTRICT | NO ACTION |
| public.user_leagues | {user_id} | public.profiles | {id} | CASCADE | NO ACTION |
| public.user_mission_progress | {mission_id} | public.department_missions | {id} | CASCADE | NO ACTION |
| public.user_permission_groups | {permission_group_id} | public.permission_groups | {id} | CASCADE | NO ACTION |
| public.user_positions | {position_id} | public.positions | {id} | CASCADE | NO ACTION |
| public.user_roles | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.user_seasonal_progress | {challenge_id} | public.seasonal_challenges | {id} | CASCADE | NO ACTION |
| public.user_titles | {title_id} | public.custom_titles | {id} | CASCADE | NO ACTION |
| public.user_two_factor | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.wager_budget_settings | {updated_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.wager_entries | {question_id} | public.wager_questions | {id} | CASCADE | NO ACTION |
| public.wager_entries | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.wager_integrity_review_events | {changed_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.wager_integrity_review_events | {review_id} | public.wager_integrity_reviews | {id} | CASCADE | NO ACTION |
| public.wager_integrity_review_events | {target_user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.wager_integrity_reviews | {reviewed_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.wager_integrity_reviews | {target_user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.wager_questions | {created_by} | auth.users | {id} | SET NULL | NO ACTION |
| public.webauthn_challenges | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.webauthn_credentials | {user_id} | auth.users | {id} | CASCADE | NO ACTION |
| public.webhook_delivery_logs | {subscription_id} | public.webhook_subscriptions | {id} | CASCADE | NO ACTION |
| public.webhook_subscriptions | {api_key_id} | public.external_api_keys | {id} | CASCADE | NO ACTION |


_Diagrama omitido: mais de 120 tabelas._
