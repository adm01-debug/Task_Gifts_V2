# Tipos customizados (enums, domains, composites)

| tipo | kind | valores / definição | usado em |
|---|---|---|---|
| public.app_role | enum | {admin,manager,employee} | public.user_roles.role |
| public.audit_action | enum | {user_signup,user_login,profile_update,xp_gained,level_up,coins_earned,coins_spent,quest_created,quest_updated,quest_deleted,quest_assigned,quest_completed,kudos_given,kudos_received,achievement_unlocked,streak_updated,department_created,department_updated,team_member_added,team_member_removed,role_assigned,role_removed,api_key_created,api_key_rotated,api_key_status_changed,api_key_deleted} | public.audit_logs.action |
| public.climate_pillar | enum | {recognition,autonomy,growth,leadership,peers,purpose,environment,communication,benefits,balance} | public.action_plans.pillar, public.climate_benchmarks.pillar, public.climate_pillar_scores.pillar, public.climate_survey_questions.pillar, public.engagement_action_playbooks.pillar, public.engagement_factors.pillar, public.engagement_question_pool.pillar |
| public.engagement_answer_format | enum | {slider,stars,emoji,cards,checkbox,percentage,text} | public.engagement_question_pool.answer_format |
| public.engagement_cycle_status | enum | {scheduled,active,closed} | public.engagement_cycles.status |
| public.evaluator_type | enum | {self,manager,peer,direct_report,external} |  |
| public.feedback_cycle_status | enum | {draft,active,collecting,processing,completed,cancelled} |  |
| public.mission_frequency | enum | {daily,weekly,monthly} | public.department_missions.frequency |
| public.module_content_type | enum | {video,text,quiz,flashcard,infographic,simulation,checklist} | public.trail_modules.content_type |
| public.opinion_category | enum | {suggestion,complaint,compliment,question,other} | public.opinions.category |
| public.opinion_status | enum | {new,read,in_progress,resolved,archived} | public.opinions.status |
| public.opinion_urgency | enum | {low,normal,high,critical} | public.opinions.urgency |
| public.purchase_status | enum | {pending,approved,delivered,cancelled} | public.purchase_approvals.from_status, public.purchase_approvals.to_status, public.shop_purchases.status |
| public.quest_difficulty | enum | {easy,medium,hard,expert} | public.custom_quests.difficulty |
| public.quest_status | enum | {draft,active,archived} | public.custom_quests.status |
| public.reward_category | enum | {product,benefit,experience} | public.shop_rewards.category |
| public.reward_rarity | enum | {common,rare,epic,legendary} | public.shop_rewards.rarity |
| public.task_completion_status | enum | {pending,on_time,late,rejected,rework} | public.task_scores.status |
| public.trail_status | enum | {draft,published,archived} | public.learning_trails.status |
