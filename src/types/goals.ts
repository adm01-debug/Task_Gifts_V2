/**
 * @fileoverview OKR (Objectives and Key Results) type definitions
 * @module types/goals
 */

/**
 * Key Result - Measurable outcome that indicates goal progress
 * Part of the OKR framework for tracking objectives
 */
export interface KeyResult {
  /** Unique key result ID */
  id: string;
  /** Parent goal this key result belongs to */
  goal_id: string;
  /** Short title describing the key result */
  title: string;
  /** Detailed description of what needs to be achieved */
  description?: string | null;
  /** Current progress value */
  current_value: number;
  /** Target value to achieve */
  target_value: number;
  /** Type of metric for proper formatting and calculation */
  metric_type: "percentage" | "number" | "currency" | "boolean";
  /** Unit label for the metric (e.g., "users", "R$", "%") */
  unit: string | null;
  /** Weight for weighted progress calculation (0-100) */
  weight: number;
  /** ISO timestamp when key result was completed */
  completed_at: string | null;
  /** ISO timestamp of creation */
  created_at: string;
  /** ISO timestamp of last update */
  updated_at: string;
}

/**
 * Goal - Objective with optional Key Results for tracking progress
 * Supports personal, team, and company-wide goals
 */
export interface Goal {
  /** Unique goal ID */
  id: string;
  /** Owner of the goal */
  user_id: string;
  /** Goal title */
  title: string;
  /** Detailed description of the goal */
  description?: string | null;
  /** Scope of the goal */
  goal_type: "personal" | "team" | "company";
  /** Current status in the goal lifecycle */
  status: "draft" | "active" | "completed" | "cancelled";
  /** Urgency/importance level */
  priority: "low" | "medium" | "high" | "critical";
  /** Overall progress percentage (0-100) */
  progress_percent: number;
  /** ISO date when work should begin */
  start_date: string;
  /** ISO date when goal should be completed */
  due_date?: string | null;
  /** ISO timestamp when goal was completed */
  completed_at: string | null;
  /** XP reward upon completion */
  xp_reward: number;
  /** Coin reward upon completion */
  coin_reward: number;
  /** Associated department (for team/company goals) */
  department_id?: string | null;
  /** Parent goal for hierarchical OKRs */
  parent_goal_id?: string | null;
  /** ISO timestamp of creation */
  created_at: string;
  /** ISO timestamp of last update */
  updated_at: string;
  /** Associated key results for measuring progress */
  key_results?: KeyResult[];
}

/**
 * Goal Update - Historical record of progress changes
 * Used for tracking timeline and generating reports
 */
export interface GoalUpdate {
  /** Unique update ID */
  id: string;
  /** Goal being updated */
  goal_id: string;
  /** User who made the update */
  user_id: string;
  /** Key result being updated (if applicable) */
  key_result_id?: string | null;
  /** Value before the update */
  previous_value?: number | null;
  /** New value after the update */
  new_value: number;
  /** Optional note explaining the update */
  note?: string | null;
  /** ISO timestamp of the update */
  created_at: string;
}
