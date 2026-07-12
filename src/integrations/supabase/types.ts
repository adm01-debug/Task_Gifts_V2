export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          coin_reward: number
          created_at: string
          description: string | null
          icon: string
          id: string
          key: string
          name: string
          rarity: string
          xp_reward: number
        }
        Insert: {
          category?: string
          coin_reward?: number
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          key: string
          name: string
          rarity?: string
          xp_reward?: number
        }
        Update: {
          category?: string
          coin_reward?: number
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          key?: string
          name?: string
          rarity?: string
          xp_reward?: number
        }
        Relationships: []
      }
      action_plan_items: {
        Row: {
          completed_at: string | null
          created_at: string
          how_method: string | null
          how_much_cost: number | null
          how_much_currency: string | null
          id: string
          impact_notes: string | null
          impact_score: number | null
          order_index: number
          plan_id: string
          priority: string
          progress_percent: number
          status: string
          updated_at: string
          what_description: string | null
          what_title: string
          when_end: string | null
          when_start: string | null
          where_location: string | null
          who_participants: Json | null
          who_responsible_id: string
          why_reason: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          how_method?: string | null
          how_much_cost?: number | null
          how_much_currency?: string | null
          id?: string
          impact_notes?: string | null
          impact_score?: number | null
          order_index?: number
          plan_id: string
          priority?: string
          progress_percent?: number
          status?: string
          updated_at?: string
          what_description?: string | null
          what_title: string
          when_end?: string | null
          when_start?: string | null
          where_location?: string | null
          who_participants?: Json | null
          who_responsible_id: string
          why_reason?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          how_method?: string | null
          how_much_cost?: number | null
          how_much_currency?: string | null
          id?: string
          impact_notes?: string | null
          impact_score?: number | null
          order_index?: number
          plan_id?: string
          priority?: string
          progress_percent?: number
          status?: string
          updated_at?: string
          what_description?: string | null
          what_title?: string
          when_end?: string | null
          when_start?: string | null
          where_location?: string | null
          who_participants?: Json | null
          who_responsible_id?: string
          why_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_plan_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "action_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      action_plan_updates: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          new_value: string | null
          old_value: string | null
          plan_id: string
          update_type: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          plan_id: string
          update_type?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          plan_id?: string
          update_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_plan_updates_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "action_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      action_plans: {
        Row: {
          coin_reward: number
          completed_at: string | null
          created_at: string
          current_score: number | null
          department_id: string | null
          description: string | null
          id: string
          initial_score: number | null
          owner_id: string
          pillar: Database["public"]["Enums"]["climate_pillar"] | null
          progress_percent: number
          related_survey_id: string | null
          reviewer_id: string | null
          root_cause_summary: string | null
          root_causes: Json
          status: string
          target_date: string
          target_score: number | null
          title: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          coin_reward?: number
          completed_at?: string | null
          created_at?: string
          current_score?: number | null
          department_id?: string | null
          description?: string | null
          id?: string
          initial_score?: number | null
          owner_id: string
          pillar?: Database["public"]["Enums"]["climate_pillar"] | null
          progress_percent?: number
          related_survey_id?: string | null
          reviewer_id?: string | null
          root_cause_summary?: string | null
          root_causes?: Json
          status?: string
          target_date: string
          target_score?: number | null
          title: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          coin_reward?: number
          completed_at?: string | null
          created_at?: string
          current_score?: number | null
          department_id?: string | null
          description?: string | null
          id?: string
          initial_score?: number | null
          owner_id?: string
          pillar?: Database["public"]["Enums"]["climate_pillar"] | null
          progress_percent?: number
          related_survey_id?: string | null
          reviewer_id?: string | null
          root_cause_summary?: string | null
          root_causes?: Json
          status?: string
          target_date?: string
          target_score?: number | null
          title?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "action_plans_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_plans_related_survey_id_fkey"
            columns: ["related_survey_id"]
            isOneToOne: false
            referencedRelation: "climate_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_comments: {
        Row: {
          activity_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_id: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      activity_reactions: {
        Row: {
          activity_id: string
          created_at: string
          emoji: string
          id: string
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          emoji: string
          id?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          emoji?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_coach_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      announcement_reactions: {
        Row: {
          announcement_id: string
          created_at: string
          emoji: string
          id: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          created_at?: string
          emoji: string
          id?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          created_at?: string
          emoji?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reactions_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          author_id: string
          category: string
          content: string
          created_at: string
          department_id: string | null
          expires_at: string | null
          id: string
          is_pinned: boolean
          pin_expires_at: string | null
          published_at: string | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author_id: string
          category?: string
          content: string
          created_at?: string
          department_id?: string | null
          expires_at?: string | null
          id?: string
          is_pinned?: boolean
          pin_expires_at?: string | null
          published_at?: string | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_id?: string
          category?: string
          content?: string
          created_at?: string
          department_id?: string | null
          expires_at?: string | null
          id?: string
          is_pinned?: boolean
          pin_expires_at?: string | null
          published_at?: string | null
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      api_request_logs: {
        Row: {
          api_key_id: string | null
          created_at: string
          duration_ms: number | null
          endpoint: string
          id: string
          ip_address: string | null
          method: string
          request_body: Json | null
          response_body: Json | null
          response_status: number
          user_agent: string | null
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string
          duration_ms?: number | null
          endpoint: string
          id?: string
          ip_address?: string | null
          method: string
          request_body?: Json | null
          response_body?: Json | null
          response_status: number
          user_agent?: string | null
        }
        Update: {
          api_key_id?: string | null
          created_at?: string
          duration_ms?: number | null
          endpoint?: string
          id?: string
          ip_address?: string | null
          method?: string
          request_body?: Json | null
          response_body?: Json | null
          response_status?: number
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_request_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "external_api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          check_in: string
          check_out: string | null
          created_at: string
          id: string
          is_punctual: boolean
          late_minutes: number | null
          notes: string | null
          user_id: string
        }
        Insert: {
          check_in?: string
          check_out?: string | null
          created_at?: string
          id?: string
          is_punctual?: boolean
          late_minutes?: number | null
          notes?: string | null
          user_id: string
        }
        Update: {
          check_in?: string
          check_out?: string | null
          created_at?: string
          id?: string
          is_punctual?: boolean
          late_minutes?: number | null
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      attendance_settings: {
        Row: {
          created_at: string
          department_id: string | null
          id: string
          streak_milestone: number
          tolerance_minutes: number
          updated_at: string
          work_end_time: string
          work_start_time: string
          xp_punctual_checkin: number
          xp_streak_bonus: number
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          id?: string
          streak_milestone?: number
          tolerance_minutes?: number
          updated_at?: string
          work_end_time?: string
          work_start_time?: string
          xp_punctual_checkin?: number
          xp_streak_bonus?: number
        }
        Update: {
          created_at?: string
          department_id?: string | null
          id?: string
          streak_milestone?: number
          tolerance_minutes?: number
          updated_at?: string
          work_end_time?: string
          work_start_time?: string
          xp_punctual_checkin?: number
          xp_streak_bonus?: number
        }
        Relationships: [
          {
            foreignKeyName: "attendance_settings_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_streaks: {
        Row: {
          best_streak: number
          current_streak: number
          id: string
          last_punctual_date: string | null
          total_punctual_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          best_streak?: number
          current_streak?: number
          id?: string
          last_punctual_date?: string | null
          total_punctual_days?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          best_streak?: number
          current_streak?: number
          id?: string
          last_punctual_date?: string | null
          total_punctual_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      avatar_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          preview_color: string | null
          price_coins: number | null
          rarity: string
          unlock_achievement_key: string | null
          unlock_requirement: number | null
          unlock_type: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          preview_color?: string | null
          price_coins?: number | null
          rarity?: string
          unlock_achievement_key?: string | null
          unlock_requirement?: number | null
          unlock_type?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          preview_color?: string | null
          price_coins?: number | null
          rarity?: string
          unlock_achievement_key?: string | null
          unlock_requirement?: number | null
          unlock_type?: string
        }
        Relationships: []
      }
      bitrix24_sync_mappings: {
        Row: {
          bitrix_entity_type: string
          bitrix_id: string
          created_at: string
          entity_type: string
          id: string
          last_synced_at: string | null
          local_id: string
          metadata: Json | null
          sync_status: string
          updated_at: string
        }
        Insert: {
          bitrix_entity_type: string
          bitrix_id: string
          created_at?: string
          entity_type: string
          id?: string
          last_synced_at?: string | null
          local_id: string
          metadata?: Json | null
          sync_status?: string
          updated_at?: string
        }
        Update: {
          bitrix_entity_type?: string
          bitrix_id?: string
          created_at?: string
          entity_type?: string
          id?: string
          last_synced_at?: string | null
          local_id?: string
          metadata?: Json | null
          sync_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      bitrix24_tokens: {
        Row: {
          access_token: string
          created_at: string
          domain: string
          expires_at: string
          id: string
          member_id: string | null
          refresh_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          domain: string
          expires_at: string
          id?: string
          member_id?: string | null
          refresh_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          domain?: string
          expires_at?: string
          id?: string
          member_id?: string | null
          refresh_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bitrix24_webhook_logs: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          processed: boolean
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          processed?: boolean
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean
        }
        Relationships: []
      }
      blocked_ips: {
        Row: {
          block_type: string
          blocked_at: string
          blocked_by: string | null
          created_at: string
          expires_at: string | null
          id: string
          ip_address: unknown
          is_permanent: boolean
          metadata: Json | null
          reason: string
          updated_at: string
          violation_count: number
        }
        Insert: {
          block_type?: string
          blocked_at?: string
          blocked_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address: unknown
          is_permanent?: boolean
          metadata?: Json | null
          reason: string
          updated_at?: string
          violation_count?: number
        }
        Update: {
          block_type?: string
          blocked_at?: string
          blocked_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          is_permanent?: boolean
          metadata?: Json | null
          reason?: string
          updated_at?: string
          violation_count?: number
        }
        Relationships: []
      }
      celebrations: {
        Row: {
          auto_generated: boolean
          celebration_date: string
          celebration_type: string
          coin_reward: number
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          title: string
          user_id: string
          xp_reward: number
          year_count: number | null
        }
        Insert: {
          auto_generated?: boolean
          celebration_date: string
          celebration_type: string
          coin_reward?: number
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          title: string
          user_id: string
          xp_reward?: number
          year_count?: number | null
        }
        Update: {
          auto_generated?: boolean
          celebration_date?: string
          celebration_type?: string
          coin_reward?: number
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          title?: string
          user_id?: string
          xp_reward?: number
          year_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "celebrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "celebrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          category: string
          coin_reward: number
          created_at: string
          department_id: string | null
          description: string | null
          icon: string
          id: string
          is_mandatory: boolean
          name: string
          trail_id: string | null
          updated_at: string
          validity_months: number | null
          xp_reward: number
        }
        Insert: {
          category?: string
          coin_reward?: number
          created_at?: string
          department_id?: string | null
          description?: string | null
          icon?: string
          id?: string
          is_mandatory?: boolean
          name: string
          trail_id?: string | null
          updated_at?: string
          validity_months?: number | null
          xp_reward?: number
        }
        Update: {
          category?: string
          coin_reward?: number
          created_at?: string
          department_id?: string | null
          description?: string | null
          icon?: string
          id?: string
          is_mandatory?: boolean
          name?: string
          trail_id?: string | null
          updated_at?: string
          validity_months?: number | null
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "certifications_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certifications_trail_id_fkey"
            columns: ["trail_id"]
            isOneToOne: false
            referencedRelation: "learning_trails"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_templates: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          questions: Json
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          questions?: Json
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          questions?: Json
        }
        Relationships: []
      }
      checkins: {
        Row: {
          action_items: Json | null
          completed_at: string | null
          created_at: string
          employee_id: string
          id: string
          manager_id: string
          mood_rating: number | null
          notes: string | null
          responses: Json | null
          scheduled_at: string
          status: string
          template_id: string | null
          updated_at: string
          xp_reward: number
        }
        Insert: {
          action_items?: Json | null
          completed_at?: string | null
          created_at?: string
          employee_id: string
          id?: string
          manager_id: string
          mood_rating?: number | null
          notes?: string | null
          responses?: Json | null
          scheduled_at: string
          status?: string
          template_id?: string | null
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          action_items?: Json | null
          completed_at?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          manager_id?: string
          mood_rating?: number | null
          notes?: string | null
          responses?: Json | null
          scheduled_at?: string
          status?: string
          template_id?: string | null
          updated_at?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "checkins_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checkin_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      climate_benchmarks: {
        Row: {
          average_score: number
          company_size: string
          created_at: string
          id: string
          industry: string
          period: string
          pillar: Database["public"]["Enums"]["climate_pillar"]
          region: string
          sample_size: number
          top_10_percent_score: number
          top_quartile_score: number
          updated_at: string
        }
        Insert: {
          average_score: number
          company_size?: string
          created_at?: string
          id?: string
          industry?: string
          period: string
          pillar: Database["public"]["Enums"]["climate_pillar"]
          region?: string
          sample_size?: number
          top_10_percent_score: number
          top_quartile_score: number
          updated_at?: string
        }
        Update: {
          average_score?: number
          company_size?: string
          created_at?: string
          id?: string
          industry?: string
          period?: string
          pillar?: Database["public"]["Enums"]["climate_pillar"]
          region?: string
          sample_size?: number
          top_10_percent_score?: number
          top_quartile_score?: number
          updated_at?: string
        }
        Relationships: []
      }
      climate_pillar_scores: {
        Row: {
          calculated_at: string
          department_id: string | null
          id: string
          pillar: Database["public"]["Enums"]["climate_pillar"]
          previous_score: number | null
          response_count: number
          score: number
          survey_id: string
          trend: string | null
        }
        Insert: {
          calculated_at?: string
          department_id?: string | null
          id?: string
          pillar: Database["public"]["Enums"]["climate_pillar"]
          previous_score?: number | null
          response_count?: number
          score: number
          survey_id: string
          trend?: string | null
        }
        Update: {
          calculated_at?: string
          department_id?: string | null
          id?: string
          pillar?: Database["public"]["Enums"]["climate_pillar"]
          previous_score?: number | null
          response_count?: number
          score?: number
          survey_id?: string
          trend?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "climate_pillar_scores_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "climate_pillar_scores_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "climate_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      climate_question_answers: {
        Row: {
          created_at: string
          id: string
          question_id: string
          response_id: string
          score: number | null
          selected_options: Json | null
          skipped: boolean
          text_answer: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          response_id: string
          score?: number | null
          selected_options?: Json | null
          skipped?: boolean
          text_answer?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          response_id?: string
          score?: number | null
          selected_options?: Json | null
          skipped?: boolean
          text_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "climate_question_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "climate_survey_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "climate_question_answers_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "climate_survey_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      climate_survey_questions: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          options: Json | null
          order_index: number
          pillar: Database["public"]["Enums"]["climate_pillar"]
          question_text: string
          question_text_en: string | null
          question_text_es: string | null
          question_type: string
          survey_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          options?: Json | null
          order_index?: number
          pillar: Database["public"]["Enums"]["climate_pillar"]
          question_text: string
          question_text_en?: string | null
          question_text_es?: string | null
          question_type?: string
          survey_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          options?: Json | null
          order_index?: number
          pillar?: Database["public"]["Enums"]["climate_pillar"]
          question_text?: string
          question_text_en?: string | null
          question_text_es?: string | null
          question_type?: string
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "climate_survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "climate_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      climate_survey_responses: {
        Row: {
          completed_at: string | null
          completion_time_seconds: number | null
          created_at: string
          id: string
          is_complete: boolean
          started_at: string
          survey_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completion_time_seconds?: number | null
          created_at?: string
          id?: string
          is_complete?: boolean
          started_at?: string
          survey_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completion_time_seconds?: number | null
          created_at?: string
          id?: string
          is_complete?: boolean
          started_at?: string
          survey_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "climate_survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "climate_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      climate_surveys: {
        Row: {
          allow_skip: boolean
          created_at: string
          created_by: string
          department_id: string | null
          description: string | null
          ends_at: string
          id: string
          is_anonymous: boolean
          is_recurring: boolean
          recurrence_pattern: string | null
          reminder_frequency: string | null
          send_reminders: boolean
          starts_at: string
          status: string
          survey_type: string
          title: string
          updated_at: string
        }
        Insert: {
          allow_skip?: boolean
          created_at?: string
          created_by: string
          department_id?: string | null
          description?: string | null
          ends_at: string
          id?: string
          is_anonymous?: boolean
          is_recurring?: boolean
          recurrence_pattern?: string | null
          reminder_frequency?: string | null
          send_reminders?: boolean
          starts_at: string
          status?: string
          survey_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          allow_skip?: boolean
          created_at?: string
          created_by?: string
          department_id?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          is_anonymous?: boolean
          is_recurring?: boolean
          recurrence_pattern?: string | null
          reminder_frequency?: string | null
          send_reminders?: boolean
          starts_at?: string
          status?: string
          survey_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "climate_surveys_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      competencies: {
        Row: {
          category: string
          created_at: string
          department_id: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competencies_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_badges: {
        Row: {
          category: string | null
          coin_reward: number | null
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          order_index: number | null
          rarity: string | null
          theme_id: string | null
          unlock_condition: Json | null
          updated_at: string | null
          xp_reward: number | null
        }
        Insert: {
          category?: string | null
          coin_reward?: number | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_index?: number | null
          rarity?: string | null
          theme_id?: string | null
          unlock_condition?: Json | null
          updated_at?: string | null
          xp_reward?: number | null
        }
        Update: {
          category?: string | null
          coin_reward?: number | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          rarity?: string | null
          theme_id?: string | null
          unlock_condition?: Json | null
          updated_at?: string | null
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_badges_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "gamification_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_quests: {
        Row: {
          coin_reward: number
          created_at: string
          created_by: string
          deadline_days: number | null
          department_id: string | null
          description: string
          difficulty: Database["public"]["Enums"]["quest_difficulty"]
          icon: string
          id: string
          max_participants: number | null
          requirements: string[] | null
          status: Database["public"]["Enums"]["quest_status"]
          tags: string[] | null
          title: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          coin_reward?: number
          created_at?: string
          created_by: string
          deadline_days?: number | null
          department_id?: string | null
          description: string
          difficulty?: Database["public"]["Enums"]["quest_difficulty"]
          icon?: string
          id?: string
          max_participants?: number | null
          requirements?: string[] | null
          status?: Database["public"]["Enums"]["quest_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          coin_reward?: number
          created_at?: string
          created_by?: string
          deadline_days?: number | null
          department_id?: string | null
          description?: string
          difficulty?: Database["public"]["Enums"]["quest_difficulty"]
          icon?: string
          id?: string
          max_participants?: number | null
          requirements?: string[] | null
          status?: Database["public"]["Enums"]["quest_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "custom_quests_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_ranks: {
        Row: {
          badge_url: string | null
          coin_multiplier: number | null
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          max_level: number | null
          min_level: number
          name: string
          order_index: number | null
          special_perks: Json | null
          theme_id: string | null
          title: string
          updated_at: string | null
          xp_multiplier: number | null
        }
        Insert: {
          badge_url?: string | null
          coin_multiplier?: number | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          max_level?: number | null
          min_level?: number
          name: string
          order_index?: number | null
          special_perks?: Json | null
          theme_id?: string | null
          title: string
          updated_at?: string | null
          xp_multiplier?: number | null
        }
        Update: {
          badge_url?: string | null
          coin_multiplier?: number | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          max_level?: number | null
          min_level?: number
          name?: string
          order_index?: number | null
          special_perks?: Json | null
          theme_id?: string | null
          title?: string
          updated_at?: string | null
          xp_multiplier?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_ranks_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "gamification_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_titles: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_limited: boolean | null
          max_holders: number | null
          name: string
          order_index: number | null
          prefix: string | null
          suffix: string | null
          theme_id: string | null
          unlock_requirement: Json | null
          unlock_type: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_limited?: boolean | null
          max_holders?: number | null
          name: string
          order_index?: number | null
          prefix?: string | null
          suffix?: string | null
          theme_id?: string | null
          unlock_requirement?: Json | null
          unlock_type?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_limited?: boolean | null
          max_holders?: number | null
          name?: string
          order_index?: number | null
          prefix?: string | null
          suffix?: string | null
          theme_id?: string | null
          unlock_requirement?: Json | null
          unlock_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_titles_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "gamification_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      demographic_attributes: {
        Row: {
          allow_prefer_not_answer: boolean
          attribute_type: string
          created_at: string
          id: string
          is_active: boolean
          is_required: boolean
          is_restricted: boolean
          is_visible_in_reports: boolean
          name: string
          name_en: string | null
          name_es: string | null
          options: Json | null
          order_index: number
          updated_at: string
        }
        Insert: {
          allow_prefer_not_answer?: boolean
          attribute_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          is_restricted?: boolean
          is_visible_in_reports?: boolean
          name: string
          name_en?: string | null
          name_es?: string | null
          options?: Json | null
          order_index?: number
          updated_at?: string
        }
        Update: {
          allow_prefer_not_answer?: boolean
          attribute_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          is_restricted?: boolean
          is_visible_in_reports?: boolean
          name?: string
          name_en?: string | null
          name_es?: string | null
          options?: Json | null
          order_index?: number
          updated_at?: string
        }
        Relationships: []
      }
      department_missions: {
        Row: {
          coin_reward: number | null
          created_at: string | null
          department_id: string | null
          description: string | null
          frequency: Database["public"]["Enums"]["mission_frequency"] | null
          icon: string | null
          id: string
          is_active: boolean | null
          metric_key: string
          order_index: number | null
          target_value: number | null
          title: string
          updated_at: string | null
          xp_reward: number | null
        }
        Insert: {
          coin_reward?: number | null
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          frequency?: Database["public"]["Enums"]["mission_frequency"] | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          metric_key: string
          order_index?: number | null
          target_value?: number | null
          title: string
          updated_at?: string | null
          xp_reward?: number | null
        }
        Update: {
          coin_reward?: number | null
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          frequency?: Database["public"]["Enums"]["mission_frequency"] | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          metric_key?: string
          order_index?: number | null
          target_value?: number | null
          title?: string
          updated_at?: string | null
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "department_missions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      department_rankings: {
        Row: {
          created_at: string | null
          department_id: string
          id: string
          metrics: Json | null
          period_end: string
          period_start: string
          period_type: string
          rank_position: number | null
          total_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          department_id: string
          id?: string
          metrics?: Json | null
          period_end: string
          period_start: string
          period_type?: string
          rank_position?: number | null
          total_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          department_id?: string
          id?: string
          metrics?: Json | null
          period_end?: string
          period_start?: string
          period_type?: string
          rank_position?: number | null
          total_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_rankings_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      development_plan_actions: {
        Row: {
          action_type: string
          competency_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          evidence_url: string | null
          id: string
          notes: string | null
          plan_id: string
          priority: string
          progress_percent: number
          status: string
          title: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          action_type?: string
          competency_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          evidence_url?: string | null
          id?: string
          notes?: string | null
          plan_id: string
          priority?: string
          progress_percent?: number
          status?: string
          title: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          action_type?: string
          competency_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          evidence_url?: string | null
          id?: string
          notes?: string | null
          plan_id?: string
          priority?: string
          progress_percent?: number
          status?: string
          title?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "development_plan_actions_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "development_plan_actions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "development_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      development_plans: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          linked_feedback_id: string | null
          linked_nine_box_id: string | null
          start_date: string
          status: string
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          linked_feedback_id?: string | null
          linked_nine_box_id?: string | null
          start_date?: string
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          linked_feedback_id?: string | null
          linked_nine_box_id?: string | null
          start_date?: string
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "development_plans_linked_feedback_id_fkey"
            columns: ["linked_feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "development_plans_linked_nine_box_id_fkey"
            columns: ["linked_nine_box_id"]
            isOneToOne: false
            referencedRelation: "nine_box_evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_duels: {
        Row: {
          challenger_id: string
          challenger_xp_gained: number
          challenger_xp_start: number
          coin_reward: number
          created_at: string
          duration_hours: number
          ends_at: string | null
          id: string
          message: string | null
          opponent_id: string
          opponent_xp_gained: number
          opponent_xp_start: number
          starts_at: string | null
          status: string
          updated_at: string
          winner_id: string | null
          xp_reward: number
        }
        Insert: {
          challenger_id: string
          challenger_xp_gained?: number
          challenger_xp_start?: number
          coin_reward?: number
          created_at?: string
          duration_hours?: number
          ends_at?: string | null
          id?: string
          message?: string | null
          opponent_id: string
          opponent_xp_gained?: number
          opponent_xp_start?: number
          starts_at?: string | null
          status?: string
          updated_at?: string
          winner_id?: string | null
          xp_reward?: number
        }
        Update: {
          challenger_id?: string
          challenger_xp_gained?: number
          challenger_xp_start?: number
          coin_reward?: number
          created_at?: string
          duration_hours?: number
          ends_at?: string | null
          id?: string
          message?: string | null
          opponent_id?: string
          opponent_xp_gained?: number
          opponent_xp_start?: number
          starts_at?: string | null
          status?: string
          updated_at?: string
          winner_id?: string | null
          xp_reward?: number
        }
        Relationships: []
      }
      engagement_snapshots: {
        Row: {
          active_users: number | null
          created_at: string
          department_id: string | null
          enps_score: number | null
          id: string
          kudos_given: number | null
          metadata: Json | null
          mood_avg: number | null
          participation_rate: number | null
          period_type: string
          punctuality_rate: number | null
          quests_completed: number | null
          snapshot_date: string
          total_users: number | null
          training_completion_rate: number | null
        }
        Insert: {
          active_users?: number | null
          created_at?: string
          department_id?: string | null
          enps_score?: number | null
          id?: string
          kudos_given?: number | null
          metadata?: Json | null
          mood_avg?: number | null
          participation_rate?: number | null
          period_type?: string
          punctuality_rate?: number | null
          quests_completed?: number | null
          snapshot_date?: string
          total_users?: number | null
          training_completion_rate?: number | null
        }
        Update: {
          active_users?: number | null
          created_at?: string
          department_id?: string | null
          enps_score?: number | null
          id?: string
          kudos_given?: number | null
          metadata?: Json | null
          mood_avg?: number | null
          participation_rate?: number | null
          period_type?: string
          punctuality_rate?: number | null
          quests_completed?: number | null
          snapshot_date?: string
          total_users?: number | null
          training_completion_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_snapshots_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      enps_responses: {
        Row: {
          category: string | null
          created_at: string
          follow_up_answer: string | null
          id: string
          score: number
          survey_id: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          follow_up_answer?: string | null
          id?: string
          score: number
          survey_id: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          follow_up_answer?: string | null
          id?: string
          score?: number
          survey_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enps_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "enps_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      enps_surveys: {
        Row: {
          created_at: string
          created_by: string
          department_id: string | null
          description: string | null
          ends_at: string
          follow_up_question: string | null
          id: string
          is_anonymous: boolean
          starts_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          department_id?: string | null
          description?: string | null
          ends_at: string
          follow_up_question?: string | null
          id?: string
          is_anonymous?: boolean
          starts_at?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          department_id?: string | null
          description?: string | null
          ends_at?: string
          follow_up_question?: string | null
          id?: string
          is_anonymous?: boolean
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enps_surveys_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      external_api_keys: {
        Row: {
          api_key: string
          api_secret: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          last_used_at: string | null
          name: string
          permissions: Json
          rate_limit_per_minute: number
          system_type: string
          updated_at: string
        }
        Insert: {
          api_key: string
          api_secret: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          name: string
          permissions?: Json
          rate_limit_per_minute?: number
          system_type?: string
          updated_at?: string
        }
        Update: {
          api_key?: string
          api_secret?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          name?: string
          permissions?: Json
          rate_limit_per_minute?: number
          system_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      external_tasks: {
        Row: {
          api_key_id: string | null
          category: string | null
          coin_reward: number
          completed_at: string | null
          created_at: string
          deadline_at: string | null
          description: string | null
          external_id: string
          external_system: string
          id: string
          metadata: Json | null
          priority: string | null
          started_at: string | null
          status: string
          title: string
          updated_at: string
          user_email: string
          user_id: string | null
          xp_penalty_late: number
          xp_penalty_rework: number
          xp_reward: number
        }
        Insert: {
          api_key_id?: string | null
          category?: string | null
          coin_reward?: number
          completed_at?: string | null
          created_at?: string
          deadline_at?: string | null
          description?: string | null
          external_id: string
          external_system: string
          id?: string
          metadata?: Json | null
          priority?: string | null
          started_at?: string | null
          status?: string
          title: string
          updated_at?: string
          user_email: string
          user_id?: string | null
          xp_penalty_late?: number
          xp_penalty_rework?: number
          xp_reward?: number
        }
        Update: {
          api_key_id?: string | null
          category?: string | null
          coin_reward?: number
          completed_at?: string | null
          created_at?: string
          deadline_at?: string | null
          description?: string | null
          external_id?: string
          external_system?: string
          id?: string
          metadata?: Json | null
          priority?: string | null
          started_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_email?: string
          user_id?: string | null
          xp_penalty_late?: number
          xp_penalty_rework?: number
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "external_tasks_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "external_api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_cycles: {
        Row: {
          created_at: string
          created_by: string
          cycle_type: string
          department_id: string | null
          description: string | null
          ends_at: string
          grace_period_days: number | null
          id: string
          include_direct_report_evaluation: boolean | null
          include_manager_evaluation: boolean | null
          include_peer_evaluation: boolean | null
          include_self_evaluation: boolean | null
          is_anonymous: boolean | null
          min_evaluators: number | null
          name: string
          questions: Json
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          cycle_type?: string
          department_id?: string | null
          description?: string | null
          ends_at: string
          grace_period_days?: number | null
          id?: string
          include_direct_report_evaluation?: boolean | null
          include_manager_evaluation?: boolean | null
          include_peer_evaluation?: boolean | null
          include_self_evaluation?: boolean | null
          is_anonymous?: boolean | null
          min_evaluators?: number | null
          name: string
          questions?: Json
          starts_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          cycle_type?: string
          department_id?: string | null
          description?: string | null
          ends_at?: string
          grace_period_days?: number | null
          id?: string
          include_direct_report_evaluation?: boolean | null
          include_manager_evaluation?: boolean | null
          include_peer_evaluation?: boolean | null
          include_self_evaluation?: boolean | null
          is_anonymous?: boolean | null
          min_evaluators?: number | null
          name?: string
          questions?: Json
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_cycles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_evaluations: {
        Row: {
          completed_at: string | null
          created_at: string
          cycle_id: string
          evaluatee_id: string
          evaluator_id: string
          evaluator_type: string | null
          id: string
          reminder_sent_at: string | null
          started_at: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          cycle_id: string
          evaluatee_id: string
          evaluator_id: string
          evaluator_type?: string | null
          id?: string
          reminder_sent_at?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          cycle_id?: string
          evaluatee_id?: string
          evaluator_id?: string
          evaluator_type?: string | null
          id?: string
          reminder_sent_at?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_evaluations_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "feedback_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_questions: {
        Row: {
          competency_id: string | null
          created_at: string
          cycle_id: string
          id: string
          is_required: boolean | null
          options: Json | null
          order_index: number | null
          question_text: string
          question_text_en: string | null
          question_text_es: string | null
          question_type: string | null
          scale_labels: Json | null
          scale_max: number | null
          scale_min: number | null
          weight: number | null
        }
        Insert: {
          competency_id?: string | null
          created_at?: string
          cycle_id: string
          id?: string
          is_required?: boolean | null
          options?: Json | null
          order_index?: number | null
          question_text: string
          question_text_en?: string | null
          question_text_es?: string | null
          question_type?: string | null
          scale_labels?: Json | null
          scale_max?: number | null
          scale_min?: number | null
          weight?: number | null
        }
        Update: {
          competency_id?: string | null
          created_at?: string
          cycle_id?: string
          id?: string
          is_required?: boolean | null
          options?: Json | null
          order_index?: number | null
          question_text?: string
          question_text_en?: string | null
          question_text_es?: string | null
          question_type?: string | null
          scale_labels?: Json | null
          scale_max?: number | null
          scale_min?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_questions_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_questions_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "feedback_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_requests: {
        Row: {
          created_at: string
          cycle_id: string
          due_date: string | null
          from_user_id: string
          id: string
          relationship: string
          status: string
          to_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cycle_id: string
          due_date?: string | null
          from_user_id: string
          id?: string
          relationship: string
          status?: string
          to_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cycle_id?: string
          due_date?: string | null
          from_user_id?: string
          id?: string
          relationship?: string
          status?: string
          to_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_requests_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "feedback_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_responses: {
        Row: {
          answers: Json
          id: string
          improvements: string | null
          is_anonymous: boolean
          overall_rating: number | null
          request_id: string
          strengths: string | null
          submitted_at: string
        }
        Insert: {
          answers?: Json
          id?: string
          improvements?: string | null
          is_anonymous?: boolean
          overall_rating?: number | null
          request_id: string
          strengths?: string | null
          submitted_at?: string
        }
        Update: {
          answers?: Json
          id?: string
          improvements?: string | null
          is_anonymous?: boolean
          overall_rating?: number | null
          request_id?: string
          strengths?: string | null
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_responses_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "feedback_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_results: {
        Row: {
          blind_spots: Json | null
          calculated_at: string | null
          competency_id: string | null
          created_at: string
          cycle_id: string
          direct_report_score: number | null
          hidden_strengths: Json | null
          id: string
          manager_score: number | null
          overall_score: number | null
          peer_score: number | null
          response_count: number | null
          self_score: number | null
          user_id: string
        }
        Insert: {
          blind_spots?: Json | null
          calculated_at?: string | null
          competency_id?: string | null
          created_at?: string
          cycle_id: string
          direct_report_score?: number | null
          hidden_strengths?: Json | null
          id?: string
          manager_score?: number | null
          overall_score?: number | null
          peer_score?: number | null
          response_count?: number | null
          self_score?: number | null
          user_id: string
        }
        Update: {
          blind_spots?: Json | null
          calculated_at?: string | null
          competency_id?: string | null
          created_at?: string
          cycle_id?: string
          direct_report_score?: number | null
          hidden_strengths?: Json | null
          id?: string
          manager_score?: number | null
          overall_score?: number | null
          peer_score?: number | null
          response_count?: number | null
          self_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_results_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_results_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "feedback_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_themes: {
        Row: {
          color_primary: string | null
          color_secondary: string | null
          created_at: string | null
          created_by: string
          department_id: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          color_primary?: string | null
          color_secondary?: string | null
          created_at?: string | null
          created_by: string
          department_id?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          color_primary?: string | null
          color_secondary?: string | null
          created_at?: string | null
          created_by?: string
          department_id?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gamification_themes_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: true
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      geo_access_logs: {
        Row: {
          country_code: string | null
          country_name: string | null
          created_at: string
          endpoint: string | null
          id: string
          ip_address: unknown
          reason: string | null
          user_agent: string | null
          user_id: string | null
          was_allowed: boolean
        }
        Insert: {
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          endpoint?: string | null
          id?: string
          ip_address: unknown
          reason?: string | null
          user_agent?: string | null
          user_id?: string | null
          was_allowed: boolean
        }
        Update: {
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          endpoint?: string | null
          id?: string
          ip_address?: unknown
          reason?: string | null
          user_agent?: string | null
          user_id?: string | null
          was_allowed?: boolean
        }
        Relationships: []
      }
      geo_allowed_countries: {
        Row: {
          country_code: string
          country_name: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      geo_blocking_rules: {
        Row: {
          country_code: string
          country_name: string
          created_at: string
          created_by: string | null
          id: string
          is_allowed: boolean
          updated_at: string
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_allowed?: boolean
          updated_at?: string
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_allowed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      geo_settings: {
        Row: {
          block_unknown_countries: boolean
          id: string
          is_enabled: boolean
          log_all_access: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          block_unknown_countries?: boolean
          id?: string
          is_enabled?: boolean
          log_all_access?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          block_unknown_countries?: boolean
          id?: string
          is_enabled?: boolean
          log_all_access?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      goal_updates: {
        Row: {
          created_at: string
          goal_id: string
          id: string
          key_result_id: string | null
          new_value: number
          note: string | null
          previous_value: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          goal_id: string
          id?: string
          key_result_id?: string | null
          new_value: number
          note?: string | null
          previous_value?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          goal_id?: string
          id?: string
          key_result_id?: string | null
          new_value?: number
          note?: string | null
          previous_value?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_updates_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_updates_key_result_id_fkey"
            columns: ["key_result_id"]
            isOneToOne: false
            referencedRelation: "key_results"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          coin_reward: number
          completed_at: string | null
          created_at: string
          department_id: string | null
          description: string | null
          due_date: string | null
          goal_type: string
          id: string
          priority: string
          progress_percent: number
          start_date: string
          status: string
          title: string
          updated_at: string
          user_id: string
          xp_reward: number
        }
        Insert: {
          coin_reward?: number
          completed_at?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          due_date?: string | null
          goal_type?: string
          id?: string
          priority?: string
          progress_percent?: number
          start_date?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
          xp_reward?: number
        }
        Update: {
          coin_reward?: number
          completed_at?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          due_date?: string | null
          goal_type?: string
          id?: string
          priority?: string
          progress_percent?: number
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "goals_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_access_logs: {
        Row: {
          created_at: string | null
          endpoint: string | null
          id: string
          ip_address: unknown
          reason: string | null
          user_agent: string | null
          user_id: string | null
          was_allowed: boolean
        }
        Insert: {
          created_at?: string | null
          endpoint?: string | null
          id?: string
          ip_address: unknown
          reason?: string | null
          user_agent?: string | null
          user_id?: string | null
          was_allowed: boolean
        }
        Update: {
          created_at?: string | null
          endpoint?: string | null
          id?: string
          ip_address?: unknown
          reason?: string | null
          user_agent?: string | null
          user_id?: string | null
          was_allowed?: boolean
        }
        Relationships: []
      }
      ip_whitelist: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          expires_at: string | null
          id: string
          ip_address: unknown
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          ip_address: unknown
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      key_results: {
        Row: {
          completed_at: string | null
          created_at: string
          current_value: number
          description: string | null
          goal_id: string
          id: string
          metric_type: string
          target_value: number
          title: string
          unit: string | null
          updated_at: string
          weight: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_value?: number
          description?: string | null
          goal_id: string
          id?: string
          metric_type?: string
          target_value?: number
          title: string
          unit?: string | null
          updated_at?: string
          weight?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_value?: number
          description?: string | null
          goal_id?: string
          id?: string
          metric_type?: string
          target_value?: number
          title?: string
          unit?: string | null
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "key_results_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      kudos: {
        Row: {
          badge_id: string | null
          created_at: string
          from_user_id: string
          id: string
          is_public: boolean
          message: string
          to_user_id: string
        }
        Insert: {
          badge_id?: string | null
          created_at?: string
          from_user_id: string
          id?: string
          is_public?: boolean
          message: string
          to_user_id: string
        }
        Update: {
          badge_id?: string | null
          created_at?: string
          from_user_id?: string
          id?: string
          is_public?: boolean
          message?: string
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kudos_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "kudos_badges"
            referencedColumns: ["id"]
          },
        ]
      }
      kudos_badges: {
        Row: {
          category: string
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          xp_value: number
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name: string
          xp_value?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          xp_value?: number
        }
        Relationships: []
      }
      league_history: {
        Row: {
          change_type: string
          created_at: string
          from_league_id: string | null
          id: string
          to_league_id: string
          user_id: string
          week_date: string
          weekly_xp: number
        }
        Insert: {
          change_type: string
          created_at?: string
          from_league_id?: string | null
          id?: string
          to_league_id: string
          user_id: string
          week_date: string
          weekly_xp?: number
        }
        Update: {
          change_type?: string
          created_at?: string
          from_league_id?: string | null
          id?: string
          to_league_id?: string
          user_id?: string
          week_date?: string
          weekly_xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "league_history_from_league_id_fkey"
            columns: ["from_league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_history_to_league_id_fkey"
            columns: ["to_league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          color: string
          created_at: string
          demotion_slots: number
          department_id: string | null
          description: string | null
          icon: string
          id: string
          min_xp_weekly: number
          name: string
          promotion_slots: number
          special_rewards: Json | null
          theme_id: string | null
          tier: number
          xp_bonus_percent: number
        }
        Insert: {
          color?: string
          created_at?: string
          demotion_slots?: number
          department_id?: string | null
          description?: string | null
          icon?: string
          id?: string
          min_xp_weekly?: number
          name: string
          promotion_slots?: number
          special_rewards?: Json | null
          theme_id?: string | null
          tier: number
          xp_bonus_percent?: number
        }
        Update: {
          color?: string
          created_at?: string
          demotion_slots?: number
          department_id?: string | null
          description?: string | null
          icon?: string
          id?: string
          min_xp_weekly?: number
          name?: string
          promotion_slots?: number
          special_rewards?: Json | null
          theme_id?: string | null
          tier?: number
          xp_bonus_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "leagues_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leagues_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "gamification_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_trails: {
        Row: {
          badge_icon: string | null
          badge_name: string | null
          coin_reward: number | null
          created_at: string | null
          created_by: string
          department_id: string | null
          description: string | null
          estimated_hours: number | null
          icon: string | null
          id: string
          order_index: number | null
          status: Database["public"]["Enums"]["trail_status"] | null
          title: string
          updated_at: string | null
          xp_reward: number | null
        }
        Insert: {
          badge_icon?: string | null
          badge_name?: string | null
          coin_reward?: number | null
          created_at?: string | null
          created_by: string
          department_id?: string | null
          description?: string | null
          estimated_hours?: number | null
          icon?: string | null
          id?: string
          order_index?: number | null
          status?: Database["public"]["Enums"]["trail_status"] | null
          title: string
          updated_at?: string | null
          xp_reward?: number | null
        }
        Update: {
          badge_icon?: string | null
          badge_name?: string | null
          coin_reward?: number | null
          created_at?: string | null
          created_by?: string
          department_id?: string | null
          description?: string | null
          estimated_hours?: number | null
          icon?: string | null
          id?: string
          order_index?: number | null
          status?: Database["public"]["Enums"]["trail_status"] | null
          title?: string
          updated_at?: string | null
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_trails_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      level_configs: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          level: number
          name: string | null
          rank_id: string | null
          rewards: Json | null
          theme_id: string | null
          xp_required: number
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          level: number
          name?: string | null
          rank_id?: string | null
          rewards?: Json | null
          theme_id?: string | null
          xp_required: number
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          level?: number
          name?: string | null
          rank_id?: string | null
          rewards?: Json | null
          theme_id?: string | null
          xp_required?: number
        }
        Relationships: [
          {
            foreignKeyName: "level_configs_rank_id_fkey"
            columns: ["rank_id"]
            isOneToOne: false
            referencedRelation: "custom_ranks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "level_configs_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "gamification_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempt_type: string
          created_at: string
          email: string
          error_message: string | null
          id: string
          ip_address: unknown
          user_agent: string | null
        }
        Insert: {
          attempt_type?: string
          created_at?: string
          email: string
          error_message?: string | null
          id?: string
          ip_address: unknown
          user_agent?: string | null
        }
        Update: {
          attempt_type?: string
          created_at?: string
          email?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Relationships: []
      }
      mentorship_mission_progress: {
        Row: {
          apprentice_completed_at: string | null
          completed_by_apprentice: boolean
          completed_by_mentor: boolean
          created_at: string
          id: string
          mentor_completed_at: string | null
          mission_id: string
          pair_id: string
          rewards_claimed: boolean
          updated_at: string
        }
        Insert: {
          apprentice_completed_at?: string | null
          completed_by_apprentice?: boolean
          completed_by_mentor?: boolean
          created_at?: string
          id?: string
          mentor_completed_at?: string | null
          mission_id: string
          pair_id: string
          rewards_claimed?: boolean
          updated_at?: string
        }
        Update: {
          apprentice_completed_at?: string | null
          completed_by_apprentice?: boolean
          completed_by_mentor?: boolean
          created_at?: string
          id?: string
          mentor_completed_at?: string | null
          mission_id?: string
          pair_id?: string
          rewards_claimed?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_mission_progress_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "mentorship_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorship_mission_progress_pair_id_fkey"
            columns: ["pair_id"]
            isOneToOne: false
            referencedRelation: "mentorship_pairs"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_missions: {
        Row: {
          coin_reward: number
          created_at: string
          description: string | null
          difficulty: string
          icon: string
          id: string
          is_active: boolean
          mission_type: string
          order_index: number
          title: string
          xp_reward: number
        }
        Insert: {
          coin_reward?: number
          created_at?: string
          description?: string | null
          difficulty?: string
          icon?: string
          id?: string
          is_active?: boolean
          mission_type?: string
          order_index?: number
          title: string
          xp_reward?: number
        }
        Update: {
          coin_reward?: number
          created_at?: string
          description?: string | null
          difficulty?: string
          icon?: string
          id?: string
          is_active?: boolean
          mission_type?: string
          order_index?: number
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      mentorship_pairs: {
        Row: {
          apprentice_id: string
          completed_at: string | null
          created_at: string
          id: string
          mentor_id: string
          started_at: string | null
          status: string
          total_missions_completed: number
          total_xp_earned: number
          updated_at: string
        }
        Insert: {
          apprentice_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          mentor_id: string
          started_at?: string | null
          status?: string
          total_missions_completed?: number
          total_xp_earned?: number
          updated_at?: string
        }
        Update: {
          apprentice_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          mentor_id?: string
          started_at?: string | null
          status?: string
          total_missions_completed?: number
          total_xp_earned?: number
          updated_at?: string
        }
        Relationships: []
      }
      mentorship_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          request_type: string
          requester_id: string
          responded_at: string | null
          status: string
          target_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          request_type: string
          requester_id: string
          responded_at?: string | null
          status?: string
          target_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          request_type?: string
          requester_id?: string
          responded_at?: string | null
          status?: string
          target_id?: string | null
        }
        Relationships: []
      }
      module_progress: {
        Row: {
          attempts: number | null
          completed_at: string | null
          id: string
          module_id: string
          score: number | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          id?: string
          module_id: string
          score?: number | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          id?: string
          module_id?: string
          score?: number | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "trail_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_entries: {
        Row: {
          created_at: string
          entry_date: string
          factors: Json | null
          id: string
          is_anonymous: boolean
          mood_emoji: string
          mood_score: number
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_date?: string
          factors?: Json | null
          id?: string
          is_anonymous?: boolean
          mood_emoji?: string
          mood_score: number
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          entry_date?: string
          factors?: Json | null
          id?: string
          is_anonymous?: boolean
          mood_emoji?: string
          mood_score?: number
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      new_device_alerts: {
        Row: {
          created_at: string
          device_id: string | null
          id: string
          ip_address: unknown
          is_acknowledged: boolean | null
          is_read: boolean | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          id?: string
          ip_address?: unknown
          is_acknowledged?: boolean | null
          is_read?: boolean | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string | null
          id?: string
          ip_address?: unknown
          is_acknowledged?: boolean | null
          is_read?: boolean | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "new_device_alerts_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "user_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      nine_box_evaluations: {
        Row: {
          box_position: number | null
          created_at: string
          development_areas: string[] | null
          evaluation_period: string
          evaluator_id: string
          goals_for_next_period: string[] | null
          id: string
          performance_notes: string | null
          performance_score: number
          potential_notes: string | null
          potential_score: number
          strengths: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          box_position?: number | null
          created_at?: string
          development_areas?: string[] | null
          evaluation_period: string
          evaluator_id: string
          goals_for_next_period?: string[] | null
          id?: string
          performance_notes?: string | null
          performance_score: number
          potential_notes?: string | null
          potential_score: number
          strengths?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          box_position?: number | null
          created_at?: string
          development_areas?: string[] | null
          evaluation_period?: string
          evaluator_id?: string
          goals_for_next_period?: string[] | null
          id?: string
          performance_notes?: string | null
          performance_score?: number
          potential_notes?: string | null
          potential_score?: number
          strengths?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          channel_email: boolean | null
          channel_in_app: boolean | null
          channel_push: boolean | null
          created_at: string
          digest_enabled: boolean
          digest_frequency: string
          digest_time: string | null
          do_not_disturb_enabled: boolean
          do_not_disturb_end: string | null
          do_not_disturb_start: string | null
          do_not_disturb_weekends: boolean
          email_enabled: boolean
          frequency: string | null
          id: string
          in_app_enabled: boolean
          language: string
          push_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          type_preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_email?: boolean | null
          channel_in_app?: boolean | null
          channel_push?: boolean | null
          created_at?: string
          digest_enabled?: boolean
          digest_frequency?: string
          digest_time?: string | null
          do_not_disturb_enabled?: boolean
          do_not_disturb_end?: string | null
          do_not_disturb_start?: string | null
          do_not_disturb_weekends?: boolean
          email_enabled?: boolean
          frequency?: string | null
          id?: string
          in_app_enabled?: boolean
          language?: string
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          type_preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_email?: boolean | null
          channel_in_app?: boolean | null
          channel_push?: boolean | null
          created_at?: string
          digest_enabled?: boolean
          digest_frequency?: string
          digest_time?: string | null
          do_not_disturb_enabled?: boolean
          do_not_disturb_end?: string | null
          do_not_disturb_start?: string | null
          do_not_disturb_weekends?: boolean
          email_enabled?: boolean
          frequency?: string | null
          id?: string
          in_app_enabled?: boolean
          language?: string
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          type_preferences?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          body_template: string
          body_template_html: string | null
          category: string | null
          channels: Json | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          key: string
          name: string
          subject_template: string | null
          updated_at: string
          variables: Json | null
        }
        Insert: {
          body_template: string
          body_template_html?: string | null
          category?: string | null
          channels?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          name: string
          subject_template?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          body_template?: string
          body_template_html?: string | null
          category?: string | null
          channels?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          name?: string
          subject_template?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_progress: {
        Row: {
          completed_at: string | null
          completed_steps: string[] | null
          created_at: string | null
          current_step: number
          id: string
          rewards_claimed: string[] | null
          started_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_steps?: string[] | null
          created_at?: string | null
          current_step?: number
          id?: string
          rewards_claimed?: string[] | null
          started_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_steps?: string[] | null
          created_at?: string | null
          current_step?: number
          id?: string
          rewards_claimed?: string[] | null
          started_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      opinion_responses: {
        Row: {
          content: string
          created_at: string
          id: string
          is_internal: boolean
          opinion_id: string
          responder_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean
          opinion_id: string
          responder_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          opinion_id?: string
          responder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opinion_responses_opinion_id_fkey"
            columns: ["opinion_id"]
            isOneToOne: false
            referencedRelation: "opinions"
            referencedColumns: ["id"]
          },
        ]
      }
      opinion_tags: {
        Row: {
          created_at: string
          id: string
          opinion_id: string
          tag: string
        }
        Insert: {
          created_at?: string
          id?: string
          opinion_id: string
          tag: string
        }
        Update: {
          created_at?: string
          id?: string
          opinion_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "opinion_tags_opinion_id_fkey"
            columns: ["opinion_id"]
            isOneToOne: false
            referencedRelation: "opinions"
            referencedColumns: ["id"]
          },
        ]
      }
      opinions: {
        Row: {
          category: Database["public"]["Enums"]["opinion_category"]
          content: string
          created_at: string
          id: string
          is_anonymous: boolean
          read_at: string | null
          read_by: string | null
          recipient_id: string | null
          recipient_type: string
          sender_id: string
          status: Database["public"]["Enums"]["opinion_status"]
          subject: string | null
          updated_at: string
          urgency: Database["public"]["Enums"]["opinion_urgency"]
        }
        Insert: {
          category?: Database["public"]["Enums"]["opinion_category"]
          content: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          read_at?: string | null
          read_by?: string | null
          recipient_id?: string | null
          recipient_type: string
          sender_id: string
          status?: Database["public"]["Enums"]["opinion_status"]
          subject?: string | null
          updated_at?: string
          urgency?: Database["public"]["Enums"]["opinion_urgency"]
        }
        Update: {
          category?: Database["public"]["Enums"]["opinion_category"]
          content?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          read_at?: string | null
          read_by?: string | null
          recipient_id?: string | null
          recipient_type?: string
          sender_id?: string
          status?: Database["public"]["Enums"]["opinion_status"]
          subject?: string | null
          updated_at?: string
          urgency?: Database["public"]["Enums"]["opinion_urgency"]
        }
        Relationships: []
      }
      password_reset_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          expires_at: string
          id: string
          requested_at: string
          reset_token: string | null
          reset_token_expires_at: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          requested_at?: string
          reset_token?: string | null
          reset_token_expires_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          requested_at?: string
          reset_token?: string | null
          reset_token_expires_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pdi_checkins: {
        Row: {
          blockers: string | null
          checkin_date: string
          created_at: string
          created_by: string
          id: string
          manager_feedback: string | null
          mood_rating: number | null
          next_steps: string | null
          plan_id: string
          progress_summary: string | null
        }
        Insert: {
          blockers?: string | null
          checkin_date: string
          created_at?: string
          created_by: string
          id?: string
          manager_feedback?: string | null
          mood_rating?: number | null
          next_steps?: string | null
          plan_id: string
          progress_summary?: string | null
        }
        Update: {
          blockers?: string | null
          checkin_date?: string
          created_at?: string
          created_by?: string
          id?: string
          manager_feedback?: string | null
          mood_rating?: number | null
          next_steps?: string | null
          plan_id?: string
          progress_summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdi_checkins_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "development_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      pdi_mentors: {
        Row: {
          created_at: string
          id: string
          mentor_id: string
          notes: string | null
          plan_id: string
          role: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          mentor_id: string
          notes?: string | null
          plan_id: string
          role?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          mentor_id?: string
          notes?: string | null
          plan_id?: string
          role?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdi_mentors_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "development_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      pdi_templates: {
        Row: {
          actions_template: Json
          category: string | null
          created_at: string
          created_by: string
          description: string | null
          estimated_duration_months: number | null
          id: string
          is_active: boolean | null
          name: string
          target_level: string | null
          target_role: string | null
          updated_at: string
        }
        Insert: {
          actions_template?: Json
          category?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          estimated_duration_months?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          target_level?: string | null
          target_role?: string | null
          updated_at?: string
        }
        Update: {
          actions_template?: Json
          category?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          estimated_duration_months?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          target_level?: string | null
          target_role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      penalty_rules: {
        Row: {
          coin_penalty_fixed: number | null
          coin_penalty_percent: number | null
          created_at: string
          description: string | null
          escalation_multiplier: number | null
          id: string
          is_active: boolean
          is_escalating: boolean
          name: string
          penalty_type: string
          trigger_condition: string
          updated_at: string
          xp_penalty_fixed: number | null
          xp_penalty_percent: number | null
        }
        Insert: {
          coin_penalty_fixed?: number | null
          coin_penalty_percent?: number | null
          created_at?: string
          description?: string | null
          escalation_multiplier?: number | null
          id?: string
          is_active?: boolean
          is_escalating?: boolean
          name: string
          penalty_type: string
          trigger_condition: string
          updated_at?: string
          xp_penalty_fixed?: number | null
          xp_penalty_percent?: number | null
        }
        Update: {
          coin_penalty_fixed?: number | null
          coin_penalty_percent?: number | null
          created_at?: string
          description?: string | null
          escalation_multiplier?: number | null
          id?: string
          is_active?: boolean
          is_escalating?: boolean
          name?: string
          penalty_type?: string
          trigger_condition?: string
          updated_at?: string
          xp_penalty_fixed?: number | null
          xp_penalty_percent?: number | null
        }
        Relationships: []
      }
      permission_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          permissions: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          permissions?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          permissions?: Json
          updated_at?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_system: boolean | null
          key: string
          module: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean | null
          key: string
          module: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean | null
          key?: string
          module?: string
          name?: string
        }
        Relationships: []
      }
      position_competencies: {
        Row: {
          competency_id: string
          created_at: string
          id: string
          is_mandatory: boolean | null
          position_id: string
          required_level: number
          updated_at: string
          weight: number | null
        }
        Insert: {
          competency_id: string
          created_at?: string
          id?: string
          is_mandatory?: boolean | null
          position_id: string
          required_level: number
          updated_at?: string
          weight?: number | null
        }
        Update: {
          competency_id?: string
          created_at?: string
          id?: string
          is_mandatory?: boolean | null
          position_id?: string
          required_level?: number
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "position_competencies_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_competencies_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      position_task_templates: {
        Row: {
          coin_reward: number
          created_at: string
          created_by: string
          deadline_hours: number | null
          description: string | null
          expected_duration_minutes: number | null
          frequency: string
          id: string
          is_active: boolean
          position_id: string
          priority: string
          title: string
          updated_at: string
          xp_penalty_late: number
          xp_penalty_rework: number
          xp_reward: number
        }
        Insert: {
          coin_reward?: number
          created_at?: string
          created_by: string
          deadline_hours?: number | null
          description?: string | null
          expected_duration_minutes?: number | null
          frequency?: string
          id?: string
          is_active?: boolean
          position_id: string
          priority?: string
          title: string
          updated_at?: string
          xp_penalty_late?: number
          xp_penalty_rework?: number
          xp_reward?: number
        }
        Update: {
          coin_reward?: number
          created_at?: string
          created_by?: string
          deadline_hours?: number | null
          description?: string | null
          expected_duration_minutes?: number | null
          frequency?: string
          id?: string
          is_active?: boolean
          position_id?: string
          priority?: string
          title?: string
          updated_at?: string
          xp_penalty_late?: number
          xp_penalty_rework?: number
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "position_task_templates_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          created_at: string
          department_id: string | null
          description: string | null
          id: string
          is_active: boolean
          level: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          level?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          level?: number
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      postmortem_actions: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          owner_label: string | null
          owner_user_id: string | null
          postmortem_id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          owner_label?: string | null
          owner_user_id?: string | null
          postmortem_id: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          owner_label?: string | null
          owner_user_id?: string | null
          postmortem_id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "postmortem_actions_postmortem_id_fkey"
            columns: ["postmortem_id"]
            isOneToOne: false
            referencedRelation: "postmortems"
            referencedColumns: ["id"]
          },
        ]
      }
      postmortems: {
        Row: {
          action_items: string | null
          alert_id: string | null
          alert_type: string | null
          contributing_factors: string | null
          created_at: string
          created_by: string | null
          duration_seconds: number | null
          id: string
          incident_resolved_at: string | null
          incident_started_at: string | null
          lessons_learned: string | null
          metadata: Json
          root_cause: string | null
          severity: string | null
          status: string
          summary: string | null
          timeline: string | null
          title: string
          updated_at: string
        }
        Insert: {
          action_items?: string | null
          alert_id?: string | null
          alert_type?: string | null
          contributing_factors?: string | null
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          id?: string
          incident_resolved_at?: string | null
          incident_started_at?: string | null
          lessons_learned?: string | null
          metadata?: Json
          root_cause?: string | null
          severity?: string | null
          status?: string
          summary?: string | null
          timeline?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          action_items?: string | null
          alert_id?: string | null
          alert_type?: string | null
          contributing_factors?: string | null
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          id?: string
          incident_resolved_at?: string | null
          incident_started_at?: string | null
          lessons_learned?: string | null
          metadata?: Json
          root_cause?: string | null
          severity?: string | null
          status?: string
          summary?: string | null
          timeline?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "postmortems_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: true
            referencedRelation: "security_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          best_streak: number
          birth_date: string | null
          coins: number
          contract_type: string | null
          cpf: string | null
          created_at: string
          display_name: string | null
          email: string | null
          employee_id: string | null
          hire_date: string | null
          id: string
          last_access_at: string | null
          level: number
          personal_email: string | null
          phone: string | null
          quests_completed: number
          status: string
          streak: number
          updated_at: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          best_streak?: number
          birth_date?: string | null
          coins?: number
          contract_type?: string | null
          cpf?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          employee_id?: string | null
          hire_date?: string | null
          id: string
          last_access_at?: string | null
          level?: number
          personal_email?: string | null
          phone?: string | null
          quests_completed?: number
          status?: string
          streak?: number
          updated_at?: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          best_streak?: number
          birth_date?: string | null
          coins?: number
          contract_type?: string | null
          cpf?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          employee_id?: string | null
          hire_date?: string | null
          id?: string
          last_access_at?: string | null
          level?: number
          personal_email?: string | null
          phone?: string | null
          quests_completed?: number
          status?: string
          streak?: number
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      pulse_responses: {
        Row: {
          answers: Json
          id: string
          submitted_at: string
          survey_id: string
          user_id: string
        }
        Insert: {
          answers?: Json
          id?: string
          submitted_at?: string
          survey_id: string
          user_id: string
        }
        Update: {
          answers?: Json
          id?: string
          submitted_at?: string
          survey_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pulse_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "pulse_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      pulse_surveys: {
        Row: {
          created_at: string
          created_by: string
          department_id: string | null
          description: string | null
          ends_at: string
          id: string
          is_anonymous: boolean
          questions: Json
          starts_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          department_id?: string | null
          description?: string | null
          ends_at: string
          id?: string
          is_anonymous?: boolean
          questions?: Json
          starts_at?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          department_id?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          is_anonymous?: boolean
          questions?: Json
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pulse_surveys_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      query_telemetry: {
        Row: {
          count_mode: string | null
          created_at: string
          duration_ms: number
          error_message: string | null
          id: string
          operation: string
          query_limit: number | null
          query_offset: number | null
          record_count: number | null
          rpc_name: string | null
          severity: string
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          count_mode?: string | null
          created_at?: string
          duration_ms?: number
          error_message?: string | null
          id?: string
          operation?: string
          query_limit?: number | null
          query_offset?: number | null
          record_count?: number | null
          rpc_name?: string | null
          severity?: string
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          count_mode?: string | null
          created_at?: string
          duration_ms?: number
          error_message?: string | null
          id?: string
          operation?: string
          query_limit?: number | null
          query_offset?: number | null
          record_count?: number | null
          rpc_name?: string | null
          severity?: string
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      quest_assignments: {
        Row: {
          completed_at: string | null
          current_step: number
          id: string
          quest_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          current_step?: number
          id?: string
          quest_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          current_step?: number
          id?: string
          quest_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_assignments_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "custom_quests"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_steps: {
        Row: {
          created_at: string
          description: string | null
          id: string
          order_index: number
          quest_id: string
          title: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          quest_id: string
          title: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          quest_id?: string
          title?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "quest_steps_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "custom_quests"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_answers: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          selected_option_id: string | null
          time_spent_ms: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct: boolean
          question_id: string
          selected_option_id?: string | null
          time_spent_ms?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_option_id?: string | null
          time_spent_ms?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_selected_option_id_fkey"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "quiz_options"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_options: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          order_index: number
          question_id: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct?: boolean
          order_index?: number
          question_id: string
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          order_index?: number
          question_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          department_id: string | null
          difficulty: string
          explanation: string | null
          id: string
          is_active: boolean
          points: number
          question: string
          quiz_type: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by: string
          department_id?: string | null
          difficulty?: string
          explanation?: string | null
          id?: string
          is_active?: boolean
          points?: number
          question: string
          quiz_type?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string
          department_id?: string | null
          difficulty?: string
          explanation?: string | null
          id?: string
          is_active?: boolean
          points?: number
          question?: string
          quiz_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_scores: {
        Row: {
          correct_answers: number
          created_at: string
          id: string
          played_at: string
          quiz_type: string
          score: number
          streak_bonus: number
          time_bonus: number
          total_questions: number
          user_id: string
        }
        Insert: {
          correct_answers?: number
          created_at?: string
          id?: string
          played_at?: string
          quiz_type?: string
          score?: number
          streak_bonus?: number
          time_bonus?: number
          total_questions?: number
          user_id: string
        }
        Update: {
          correct_answers?: number
          created_at?: string
          id?: string
          played_at?: string
          quiz_type?: string
          score?: number
          streak_bonus?: number
          time_bonus?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      rate_limit_logs: {
        Row: {
          country_code: string | null
          created_at: string
          endpoint: string
          id: string
          ip_address: unknown
          method: string
          request_count: number
          user_agent: string | null
          user_id: string | null
          was_blocked: boolean
          window_end: string
          window_start: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          endpoint: string
          id?: string
          ip_address: unknown
          method?: string
          request_count?: number
          user_agent?: string | null
          user_id?: string | null
          was_blocked?: boolean
          window_end?: string
          window_start?: string
        }
        Update: {
          country_code?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: unknown
          method?: string
          request_count?: number
          user_agent?: string | null
          user_id?: string | null
          was_blocked?: boolean
          window_end?: string
          window_start?: string
        }
        Relationships: []
      }
      rate_limit_rules: {
        Row: {
          applies_to_anonymous: boolean
          applies_to_authenticated: boolean
          block_duration_minutes: number
          created_at: string
          endpoint_pattern: string
          id: string
          is_active: boolean
          name: string
          requests_per_hour: number
          requests_per_minute: number
          updated_at: string
        }
        Insert: {
          applies_to_anonymous?: boolean
          applies_to_authenticated?: boolean
          block_duration_minutes?: number
          created_at?: string
          endpoint_pattern: string
          id?: string
          is_active?: boolean
          name: string
          requests_per_hour?: number
          requests_per_minute?: number
          updated_at?: string
        }
        Update: {
          applies_to_anonymous?: boolean
          applies_to_authenticated?: boolean
          block_duration_minutes?: number
          created_at?: string
          endpoint_pattern?: string
          id?: string
          is_active?: boolean
          name?: string
          requests_per_hour?: number
          requests_per_minute?: number
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          is_system: boolean | null
          key: string
          level: number | null
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean | null
          key: string
          level?: number | null
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean | null
          key?: string
          level?: number | null
          name?: string
        }
        Relationships: []
      }
      runbook_executions: {
        Row: {
          alert_id: string | null
          created_at: string
          id: string
          notes: string | null
          performed_by: string | null
          phase: string
          runbook_slug: string
          step_index: number | null
          step_title: string | null
        }
        Insert: {
          alert_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          performed_by?: string | null
          phase: string
          runbook_slug: string
          step_index?: number | null
          step_title?: string | null
        }
        Update: {
          alert_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          performed_by?: string | null
          phase?: string
          runbook_slug?: string
          step_index?: number | null
          step_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "runbook_executions_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "security_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      seasonal_challenges: {
        Row: {
          badge_icon: string | null
          badge_name: string | null
          coin_reward: number
          created_at: string
          description: string | null
          event_id: string
          icon: string
          id: string
          metric_key: string
          order_index: number
          target_value: number
          title: string
          xp_reward: number
        }
        Insert: {
          badge_icon?: string | null
          badge_name?: string | null
          coin_reward?: number
          created_at?: string
          description?: string | null
          event_id: string
          icon?: string
          id?: string
          metric_key: string
          order_index?: number
          target_value?: number
          title: string
          xp_reward?: number
        }
        Update: {
          badge_icon?: string | null
          badge_name?: string | null
          coin_reward?: number
          created_at?: string
          description?: string | null
          event_id?: string
          icon?: string
          id?: string
          metric_key?: string
          order_index?: number
          target_value?: number
          title?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "seasonal_challenges_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "seasonal_events"
            referencedColumns: ["id"]
          },
        ]
      }
      seasonal_events: {
        Row: {
          banner_color: string
          created_at: string
          description: string | null
          ends_at: string
          icon: string
          id: string
          is_active: boolean
          starts_at: string
          theme: string
          title: string
          updated_at: string
          xp_multiplier: number
        }
        Insert: {
          banner_color?: string
          created_at?: string
          description?: string | null
          ends_at: string
          icon?: string
          id?: string
          is_active?: boolean
          starts_at: string
          theme: string
          title: string
          updated_at?: string
          xp_multiplier?: number
        }
        Update: {
          banner_color?: string
          created_at?: string
          description?: string | null
          ends_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          starts_at?: string
          theme?: string
          title?: string
          updated_at?: string
          xp_multiplier?: number
        }
        Relationships: []
      }
      security_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          acknowledgment_notes: string | null
          alert_type: string
          created_at: string
          description: string | null
          id: string
          ip_address: unknown
          is_resolved: boolean
          metadata: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          runbook_slug: string | null
          severity: string
          title: string
          user_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          acknowledgment_notes?: string | null
          alert_type: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: unknown
          is_resolved?: boolean
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          runbook_slug?: string | null
          severity?: string
          title: string
          user_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          acknowledgment_notes?: string | null
          alert_type?: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: unknown
          is_resolved?: boolean
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          runbook_slug?: string | null
          severity?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      session_logs: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          id: string
          ip_address: unknown
          is_active: boolean
          last_activity_at: string
          login_at: string
          logout_at: string | null
          os: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_activity_at?: string
          login_at?: string
          logout_at?: string | null
          os?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_activity_at?: string
          login_at?: string
          logout_at?: string | null
          os?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shop_promotions: {
        Row: {
          created_at: string
          current_claims: number
          description: string | null
          discount_coins: number | null
          discount_percent: number | null
          ends_at: string
          id: string
          is_active: boolean
          max_claims: number | null
          reward_id: string
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_claims?: number
          description?: string | null
          discount_coins?: number | null
          discount_percent?: number | null
          ends_at: string
          id?: string
          is_active?: boolean
          max_claims?: number | null
          reward_id: string
          starts_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_claims?: number
          description?: string | null
          discount_coins?: number | null
          discount_percent?: number | null
          ends_at?: string
          id?: string
          is_active?: boolean
          max_claims?: number | null
          reward_id?: string
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_promotions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "shop_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_purchases: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          quantity: number
          reward_id: string
          status: Database["public"]["Enums"]["purchase_status"]
          total_coins: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          quantity?: number
          reward_id: string
          status?: Database["public"]["Enums"]["purchase_status"]
          total_coins: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          quantity?: number
          reward_id?: string
          status?: Database["public"]["Enums"]["purchase_status"]
          total_coins?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_purchases_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "shop_rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_rewards: {
        Row: {
          category: Database["public"]["Enums"]["reward_category"]
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price_coins: number
          rarity: Database["public"]["Enums"]["reward_rarity"]
          stock: number | null
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["reward_category"]
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price_coins?: number
          rarity?: Database["public"]["Enums"]["reward_rarity"]
          stock?: number | null
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["reward_category"]
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price_coins?: number
          rarity?: Database["public"]["Enums"]["reward_rarity"]
          stock?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      sla_targets: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          mtta_target_seconds: number
          mttr_target_seconds: number
          notes: string | null
          updated_at: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          mtta_target_seconds: number
          mttr_target_seconds: number
          notes?: string | null
          updated_at?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          mtta_target_seconds?: number
          mttr_target_seconds?: number
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      task_penalties: {
        Row: {
          applied_by: string | null
          coins_deducted: number
          created_at: string
          id: string
          penalty_type: string
          reason: string | null
          task_score_id: string | null
          user_id: string
          xp_deducted: number
        }
        Insert: {
          applied_by?: string | null
          coins_deducted?: number
          created_at?: string
          id?: string
          penalty_type: string
          reason?: string | null
          task_score_id?: string | null
          user_id: string
          xp_deducted?: number
        }
        Update: {
          applied_by?: string | null
          coins_deducted?: number
          created_at?: string
          id?: string
          penalty_type?: string
          reason?: string | null
          task_score_id?: string | null
          user_id?: string
          xp_deducted?: number
        }
        Relationships: [
          {
            foreignKeyName: "task_penalties_task_score_id_fkey"
            columns: ["task_score_id"]
            isOneToOne: false
            referencedRelation: "task_scores"
            referencedColumns: ["id"]
          },
        ]
      }
      task_scores: {
        Row: {
          assigned_at: string
          bitrix_metadata: Json | null
          bitrix_task_id: string | null
          coins_earned: number
          completed_at: string | null
          created_at: string
          deadline_at: string | null
          description: string | null
          id: string
          is_late: boolean
          late_hours: number | null
          rework_count: number
          source: string
          started_at: string | null
          status: Database["public"]["Enums"]["task_completion_status"]
          task_template_id: string | null
          title: string
          updated_at: string
          user_id: string
          xp_earned: number
          xp_penalty: number
        }
        Insert: {
          assigned_at?: string
          bitrix_metadata?: Json | null
          bitrix_task_id?: string | null
          coins_earned?: number
          completed_at?: string | null
          created_at?: string
          deadline_at?: string | null
          description?: string | null
          id?: string
          is_late?: boolean
          late_hours?: number | null
          rework_count?: number
          source?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_completion_status"]
          task_template_id?: string | null
          title: string
          updated_at?: string
          user_id: string
          xp_earned?: number
          xp_penalty?: number
        }
        Update: {
          assigned_at?: string
          bitrix_metadata?: Json | null
          bitrix_task_id?: string | null
          coins_earned?: number
          completed_at?: string | null
          created_at?: string
          deadline_at?: string | null
          description?: string | null
          id?: string
          is_late?: boolean
          late_hours?: number | null
          rework_count?: number
          source?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_completion_status"]
          task_template_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          xp_earned?: number
          xp_penalty?: number
        }
        Relationships: [
          {
            foreignKeyName: "task_scores_task_template_id_fkey"
            columns: ["task_template_id"]
            isOneToOne: false
            referencedRelation: "position_task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          department_id: string
          id: string
          is_manager: boolean
          joined_at: string
          user_id: string
        }
        Insert: {
          department_id: string
          id?: string
          is_manager?: boolean
          joined_at?: string
          user_id: string
        }
        Update: {
          department_id?: string
          id?: string
          is_manager?: boolean
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      trail_enrollments: {
        Row: {
          completed_at: string | null
          id: string
          progress_percent: number | null
          started_at: string | null
          trail_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          progress_percent?: number | null
          started_at?: string | null
          trail_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          progress_percent?: number | null
          started_at?: string | null
          trail_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trail_enrollments_trail_id_fkey"
            columns: ["trail_id"]
            isOneToOne: false
            referencedRelation: "learning_trails"
            referencedColumns: ["id"]
          },
        ]
      }
      trail_modules: {
        Row: {
          content: Json | null
          content_type:
            | Database["public"]["Enums"]["module_content_type"]
            | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          order_index: number | null
          title: string
          trail_id: string
          updated_at: string | null
          video_url: string | null
          xp_reward: number | null
        }
        Insert: {
          content?: Json | null
          content_type?:
            | Database["public"]["Enums"]["module_content_type"]
            | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          order_index?: number | null
          title: string
          trail_id: string
          updated_at?: string | null
          video_url?: string | null
          xp_reward?: number | null
        }
        Update: {
          content?: Json | null
          content_type?:
            | Database["public"]["Enums"]["module_content_type"]
            | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          order_index?: number | null
          title?: string
          trail_id?: string
          updated_at?: string | null
          video_url?: string | null
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trail_modules_trail_id_fkey"
            columns: ["trail_id"]
            isOneToOne: false
            referencedRelation: "learning_trails"
            referencedColumns: ["id"]
          },
        ]
      }
      trail_prerequisites: {
        Row: {
          created_at: string
          id: string
          prerequisite_trail_id: string
          trail_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          prerequisite_trail_id: string
          trail_id: string
        }
        Update: {
          created_at?: string
          id?: string
          prerequisite_trail_id?: string
          trail_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trail_prerequisites_prerequisite_trail_id_fkey"
            columns: ["prerequisite_trail_id"]
            isOneToOne: false
            referencedRelation: "learning_trails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trail_prerequisites_trail_id_fkey"
            columns: ["trail_id"]
            isOneToOne: false
            referencedRelation: "learning_trails"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_avatar_config: {
        Row: {
          id: string
          selected_accessory: string | null
          selected_background: string | null
          selected_badge_style: string | null
          selected_effect: string | null
          selected_frame: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          selected_accessory?: string | null
          selected_background?: string | null
          selected_badge_style?: string | null
          selected_effect?: string | null
          selected_frame?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          selected_accessory?: string | null
          selected_background?: string | null
          selected_badge_style?: string | null
          selected_effect?: string | null
          selected_frame?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_avatar_config_selected_accessory_fkey"
            columns: ["selected_accessory"]
            isOneToOne: false
            referencedRelation: "avatar_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_avatar_config_selected_background_fkey"
            columns: ["selected_background"]
            isOneToOne: false
            referencedRelation: "avatar_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_avatar_config_selected_badge_style_fkey"
            columns: ["selected_badge_style"]
            isOneToOne: false
            referencedRelation: "avatar_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_avatar_config_selected_effect_fkey"
            columns: ["selected_effect"]
            isOneToOne: false
            referencedRelation: "avatar_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_avatar_config_selected_frame_fkey"
            columns: ["selected_frame"]
            isOneToOne: false
            referencedRelation: "avatar_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_avatar_items: {
        Row: {
          id: string
          item_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          id?: string
          item_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          id?: string
          item_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_avatar_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "avatar_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_certifications: {
        Row: {
          certification_id: string
          created_at: string
          expires_at: string | null
          id: string
          issued_at: string
          issued_by: string | null
          notes: string | null
          renewal_count: number
          renewed_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          certification_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_at?: string
          issued_by?: string | null
          notes?: string | null
          renewal_count?: number
          renewed_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          certification_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_at?: string
          issued_by?: string | null
          notes?: string | null
          renewal_count?: number
          renewed_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_certifications_certification_id_fkey"
            columns: ["certification_id"]
            isOneToOne: false
            referencedRelation: "certifications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          coin_reward: number
          completed_at: string | null
          created_at: string | null
          current: number
          description: string | null
          difficulty: string
          expires_at: string
          icon: string | null
          id: string
          is_active: boolean
          target: number
          title: string
          type: string
          updated_at: string | null
          user_id: string
          xp_reward: number
        }
        Insert: {
          coin_reward?: number
          completed_at?: string | null
          created_at?: string | null
          current?: number
          description?: string | null
          difficulty?: string
          expires_at: string
          icon?: string | null
          id?: string
          is_active?: boolean
          target?: number
          title: string
          type: string
          updated_at?: string | null
          user_id: string
          xp_reward?: number
        }
        Update: {
          coin_reward?: number
          completed_at?: string | null
          created_at?: string | null
          current?: number
          description?: string | null
          difficulty?: string
          expires_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          target?: number
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
          xp_reward?: number
        }
        Relationships: []
      }
      user_combos: {
        Row: {
          actions_count: number
          combo_date: string
          created_at: string | null
          current_multiplier: number
          id: string
          last_action_at: string | null
          max_multiplier_reached: number
          total_bonus_xp: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actions_count?: number
          combo_date?: string
          created_at?: string | null
          current_multiplier?: number
          id?: string
          last_action_at?: string | null
          max_multiplier_reached?: number
          total_bonus_xp?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actions_count?: number
          combo_date?: string
          created_at?: string | null
          current_multiplier?: number
          id?: string
          last_action_at?: string | null
          max_multiplier_reached?: number
          total_bonus_xp?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_competency_assessments: {
        Row: {
          assessed_level: number
          assessment_type: string | null
          assessor_id: string | null
          competency_id: string
          created_at: string
          evidence: string | null
          feedback_cycle_id: string | null
          id: string
          updated_at: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          assessed_level: number
          assessment_type?: string | null
          assessor_id?: string | null
          competency_id: string
          created_at?: string
          evidence?: string | null
          feedback_cycle_id?: string | null
          id?: string
          updated_at?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          assessed_level?: number
          assessment_type?: string | null
          assessor_id?: string | null
          competency_id?: string
          created_at?: string
          evidence?: string | null
          feedback_cycle_id?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_competency_assessments_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_competency_assessments_feedback_cycle_id_fkey"
            columns: ["feedback_cycle_id"]
            isOneToOne: false
            referencedRelation: "feedback_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_demographic_values: {
        Row: {
          attribute_id: string
          created_at: string
          date_value: string | null
          id: string
          number_value: number | null
          updated_at: string
          user_id: string
          value: string | null
          values_array: Json | null
        }
        Insert: {
          attribute_id: string
          created_at?: string
          date_value?: string | null
          id?: string
          number_value?: number | null
          updated_at?: string
          user_id: string
          value?: string | null
          values_array?: Json | null
        }
        Update: {
          attribute_id?: string
          created_at?: string
          date_value?: string | null
          id?: string
          number_value?: number | null
          updated_at?: string
          user_id?: string
          value?: string | null
          values_array?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_demographic_values_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "demographic_attributes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          browser: string | null
          created_at: string
          device_fingerprint: string
          device_type: string | null
          first_seen_at: string
          id: string
          ip_address: unknown
          is_trusted: boolean | null
          last_seen_at: string
          location_city: string | null
          location_country: string | null
          os: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_fingerprint: string
          device_type?: string | null
          first_seen_at?: string
          id?: string
          ip_address?: unknown
          is_trusted?: boolean | null
          last_seen_at?: string
          location_city?: string | null
          location_country?: string | null
          os?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_fingerprint?: string
          device_type?: string | null
          first_seen_at?: string
          id?: string
          ip_address?: unknown
          is_trusted?: boolean | null
          last_seen_at?: string
          location_city?: string | null
          location_country?: string | null
          os?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_leagues: {
        Row: {
          created_at: string
          demoted_at: string | null
          id: string
          league_id: string
          promoted_at: string | null
          rank_in_league: number | null
          updated_at: string
          user_id: string
          week_start: string
          weekly_xp: number
        }
        Insert: {
          created_at?: string
          demoted_at?: string | null
          id?: string
          league_id: string
          promoted_at?: string | null
          rank_in_league?: number | null
          updated_at?: string
          user_id: string
          week_start?: string
          weekly_xp?: number
        }
        Update: {
          created_at?: string
          demoted_at?: string | null
          id?: string
          league_id?: string
          promoted_at?: string | null
          rank_in_league?: number | null
          updated_at?: string
          user_id?: string
          week_start?: string
          weekly_xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_leagues_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_leagues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_leagues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mission_progress: {
        Row: {
          claimed: boolean | null
          completed_at: string | null
          created_at: string | null
          current_value: number | null
          id: string
          mission_id: string
          period_end: string
          period_start: string
          user_id: string
        }
        Insert: {
          claimed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          id?: string
          mission_id: string
          period_end: string
          period_start: string
          user_id: string
        }
        Update: {
          claimed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          id?: string
          mission_id?: string
          period_end?: string
          period_start?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_mission_progress_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "department_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permission_groups: {
        Row: {
          created_at: string
          id: string
          permission_group_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_group_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_group_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permission_groups_permission_group_id_fkey"
            columns: ["permission_group_id"]
            isOneToOne: false
            referencedRelation: "permission_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_positions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          is_primary: boolean
          position_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_primary?: boolean
          position_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_primary?: boolean
          position_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_positions_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_seasonal_progress: {
        Row: {
          challenge_id: string
          claimed: boolean
          completed_at: string | null
          created_at: string
          current_value: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          claimed?: boolean
          completed_at?: string | null
          created_at?: string
          current_value?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          claimed?: boolean
          completed_at?: string | null
          created_at?: string
          current_value?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_seasonal_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "seasonal_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_titles: {
        Row: {
          earned_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          title_id: string | null
          user_id: string
        }
        Insert: {
          earned_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          title_id?: string | null
          user_id: string
        }
        Update: {
          earned_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          title_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_titles_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "custom_titles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_two_factor: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          id: string
          is_enabled: boolean
          totp_secret: string | null
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          totp_secret?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          totp_secret?: string | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      webauthn_challenges: {
        Row: {
          challenge: string
          created_at: string
          expires_at: string
          id: string
          type: string
          user_id: string | null
        }
        Insert: {
          challenge: string
          created_at?: string
          expires_at?: string
          id?: string
          type: string
          user_id?: string | null
        }
        Update: {
          challenge?: string
          created_at?: string
          expires_at?: string
          id?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      webauthn_credentials: {
        Row: {
          aaguid: string | null
          counter: number
          created_at: string
          credential_id: string
          device_name: string | null
          device_type: string | null
          id: string
          is_active: boolean
          last_used_at: string | null
          public_key: string
          transports: string[] | null
          user_id: string
        }
        Insert: {
          aaguid?: string | null
          counter?: number
          created_at?: string
          credential_id: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          public_key: string
          transports?: string[] | null
          user_id: string
        }
        Update: {
          aaguid?: string | null
          counter?: number
          created_at?: string
          credential_id?: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          public_key?: string
          transports?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      webhook_delivery_logs: {
        Row: {
          attempt_count: number
          created_at: string
          duration_ms: number | null
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          subscription_id: string | null
          success: boolean
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          response_body?: string | null
          response_status?: number | null
          subscription_id?: string | null
          success?: boolean
        }
        Update: {
          attempt_count?: number
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          subscription_id?: string | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "webhook_delivery_logs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "webhook_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_idempotency: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          idempotency_key: string
          provider: string
          response_body: Json | null
          status: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          idempotency_key: string
          provider: string
          response_body?: Json | null
          status: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          idempotency_key?: string
          provider?: string
          response_body?: Json | null
          status?: string
        }
        Relationships: []
      }
      webhook_subscriptions: {
        Row: {
          api_key_id: string | null
          created_at: string
          events: string[]
          headers: Json | null
          id: string
          is_active: boolean
          last_status: number | null
          last_triggered_at: string | null
          name: string
          retry_count: number
          secret: string
          secret_next: string | null
          secret_next_expires_at: string | null
          timeout_seconds: number
          updated_at: string
          url: string
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string
          events?: string[]
          headers?: Json | null
          id?: string
          is_active?: boolean
          last_status?: number | null
          last_triggered_at?: string | null
          name: string
          retry_count?: number
          secret: string
          secret_next?: string | null
          secret_next_expires_at?: string | null
          timeout_seconds?: number
          updated_at?: string
          url: string
        }
        Update: {
          api_key_id?: string | null
          created_at?: string
          events?: string[]
          headers?: Json | null
          id?: string
          is_active?: boolean
          last_status?: number | null
          last_triggered_at?: string | null
          name?: string
          retry_count?: number
          secret?: string
          secret_next?: string | null
          secret_next_expires_at?: string | null
          timeout_seconds?: number
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_subscriptions_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "external_api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_challenges: {
        Row: {
          challenger_id: string
          challenger_xp_gained: number
          challenger_xp_start: number
          coin_reward: number
          created_at: string
          id: string
          opponent_id: string
          opponent_xp_gained: number
          opponent_xp_start: number
          status: string
          updated_at: string
          week_end: string
          week_start: string
          winner_id: string | null
          xp_reward: number
        }
        Insert: {
          challenger_id: string
          challenger_xp_gained?: number
          challenger_xp_start?: number
          coin_reward?: number
          created_at?: string
          id?: string
          opponent_id: string
          opponent_xp_gained?: number
          opponent_xp_start?: number
          status?: string
          updated_at?: string
          week_end?: string
          week_start?: string
          winner_id?: string | null
          xp_reward?: number
        }
        Update: {
          challenger_id?: string
          challenger_xp_gained?: number
          challenger_xp_start?: number
          coin_reward?: number
          created_at?: string
          id?: string
          opponent_id?: string
          opponent_xp_gained?: number
          opponent_xp_start?: number
          status?: string
          updated_at?: string
          week_end?: string
          week_start?: string
          winner_id?: string | null
          xp_reward?: number
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          best_streak: number | null
          coins: number | null
          created_at: string | null
          display_name: string | null
          id: string | null
          last_access_at: string | null
          level: number | null
          quests_completed: number | null
          status: string | null
          streak: number | null
          updated_at: string | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          best_streak?: number | null
          coins?: number | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          last_access_at?: string | null
          level?: number | null
          quests_completed?: number | null
          status?: string | null
          streak?: number | null
          updated_at?: string | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          best_streak?: number | null
          coins?: number | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          last_access_at?: string | null
          level?: number | null
          quests_completed?: number | null
          status?: string | null
          streak?: number | null
          updated_at?: string | null
          xp?: number | null
        }
        Relationships: []
      }
      webhook_delivery_stats_24h: {
        Row: {
          avg_attempts: number | null
          avg_duration_ms: number | null
          failed_deliveries: number | null
          last_delivery_at: string | null
          max_duration_ms: number | null
          p50_duration_ms: number | null
          p95_duration_ms: number | null
          p99_duration_ms: number | null
          subscription_id: string | null
          subscription_name: string | null
          subscription_url: string | null
          success_rate_pct: number | null
          successful_deliveries: number | null
          total_deliveries: number | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_delivery_logs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "webhook_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _require_admin: { Args: never; Returns: undefined }
      _require_manager_or_admin: { Args: never; Returns: undefined }
      acknowledge_security_alert: {
        Args: { _alert_id: string; _notes: string; _runbook_slug: string }
        Returns: undefined
      }
      apply_task_penalty: {
        Args: {
          p_applied_by?: string
          p_coins_deducted?: number
          p_penalty_type: string
          p_reason?: string
          p_task_score_id: string
          p_user_id: string
          p_xp_deducted: number
        }
        Returns: string
      }
      approve_password_reset: {
        Args: { p_notes?: string; p_request_id: string }
        Returns: Json
      }
      auto_block_ip: {
        Args: {
          p_block_type?: string
          p_duration_minutes?: number
          p_ip_address: unknown
          p_reason: string
        }
        Returns: string
      }
      auto_promote_expired_webhook_secrets: { Args: never; Returns: Json }
      bulk_rotate_webhook_secrets: {
        Args: { p_grace_hours?: number; p_rotations: Json }
        Returns: Json
      }
      calculate_enps_score: { Args: { p_survey_id: string }; Returns: number }
      cancel_webhook_secret_rotation: {
        Args: { p_subscription_id: string }
        Returns: Json
      }
      check_login_lockout: { Args: { p_email: string }; Returns: Json }
      check_overdue_postmortem_actions: { Args: never; Returns: Json }
      check_sla_breaches_and_alert: { Args: never; Returns: Json }
      check_webhook_sla_and_alert: {
        Args: { p_threshold_pct?: number; p_window_hours?: number }
        Returns: Json
      }
      cleanup_expired_challenges: { Args: never; Returns: undefined }
      cleanup_expired_idempotency_keys: { Args: never; Returns: undefined }
      cleanup_old_security_logs:
        | { Args: never; Returns: undefined }
        | { Args: { p_days_to_keep?: number }; Returns: Json }
      complete_external_task: {
        Args: {
          p_external_id: string
          p_external_system: string
          p_metadata?: Json
          p_status?: string
        }
        Returns: Json
      }
      complete_task_score: {
        Args: {
          p_status?: Database["public"]["Enums"]["task_completion_status"]
          p_task_score_id: string
        }
        Returns: Json
      }
      generate_engagement_snapshot: {
        Args: { p_department_id?: string; p_period_type?: string }
        Returns: string
      }
      get_2fa_status: {
        Args: { p_user_id: string }
        Returns: {
          is_enabled: boolean
          verified_at: string
        }[]
      }
      get_alert_heatmap_30d: {
        Args: never
        Returns: {
          critical_count: number
          dow: number
          high_count: number
          hour: number
          total: number
        }[]
      }
      get_alert_mttr_by_type_7d: {
        Args: never
        Returns: {
          alert_type: string
          avg_mttr_minutes: number
          max_mttr_minutes: number
          median_mttr_minutes: number
          resolved_count: number
          total_count: number
          unresolved_count: number
        }[]
      }
      get_burn_rate: {
        Args: { _minutes: number; _slo?: number }
        Returns: Json
      }
      get_department_metrics: { Args: never; Returns: Json }
      get_error_budget_30d: {
        Args: { p_api_slo?: number; p_webhook_slo?: number }
        Returns: Json
      }
      get_executive_metrics: { Args: never; Returns: Json }
      get_incident_metrics: {
        Args: { p_days?: number }
        Returns: {
          acknowledged: number
          alert_type: string
          incidents: number
          mtta_breached: boolean
          mtta_seconds: number
          mtta_target_seconds: number
          mttr_breached: boolean
          mttr_seconds: number
          mttr_target_seconds: number
          p95_mttr_seconds: number
          resolved: number
          week_start: string
        }[]
      }
      get_leaderboard_api: {
        Args: { p_department_id?: string; p_limit?: number }
        Returns: Json
      }
      get_monthly_trends: { Args: never; Returns: Json }
      get_nine_box_distribution: {
        Args: { p_department_id?: string; p_period?: string }
        Returns: Json
      }
      get_passkeys_by_email: {
        Args: { p_email: string }
        Returns: {
          credential_id: string
          user_id: string
        }[]
      }
      get_quiz_category_stats: {
        Args: never
        Returns: {
          accuracy_rate: number
          avg_time_ms: number
          category: string
          correct_answers: number
          question_count: number
          total_answers: number
        }[]
      }
      get_reliability_slo: { Args: { p_hours?: number }; Returns: Json }
      get_reliability_timeline: {
        Args: { p_hours?: number }
        Returns: {
          api_errors: number
          api_p95_ms: number
          api_total: number
          bucket: string
          webhook_p95_ms: number
          webhook_success: number
          webhook_total: number
        }[]
      }
      get_security_digest_history: {
        Args: { p_weeks?: number }
        Returns: {
          ack_count: number
          acknowledged_by_me: boolean
          acknowledgments: Json
          avg_mttr_min: number
          created_at: string
          critical: number
          high: number
          pending: number
          sla_pct: number
          top: Json
          total: number
          week_key: string
        }[]
      }
      get_security_stats: { Args: { p_hours?: number }; Returns: Json }
      get_user_stats_api: { Args: { p_user_email: string }; Returns: Json }
      get_webhook_delivery_hourly_24h: {
        Args: never
        Returns: {
          avg_duration_ms: number
          bucket: string
          failed: number
          p95_duration_ms: number
          successful: number
          total: number
        }[]
      }
      get_webhook_delivery_logs: {
        Args: { p_limit?: number; p_subscription_id: string }
        Returns: {
          attempt_count: number
          created_at: string
          duration_ms: number
          error_message: string
          event_type: string
          id: string
          payload: Json
          response_body: string
          response_status: number
          success: boolean
        }[]
      }
      get_webhook_delivery_stats_1h: {
        Args: never
        Returns: {
          failed_deliveries: number
          subscription_id: string
          subscription_name: string
          subscription_url: string
          success_rate_pct: number
          successful_deliveries: number
          total_deliveries: number
        }[]
      }
      get_webhook_delivery_stats_24h: {
        Args: never
        Returns: {
          avg_attempts: number
          avg_duration_ms: number
          failed_deliveries: number
          last_delivery_at: string
          max_duration_ms: number
          p50_duration_ms: number
          p95_duration_ms: number
          p99_duration_ms: number
          subscription_id: string
          subscription_name: string
          subscription_url: string
          success_rate_pct: number
          successful_deliveries: number
          total_deliveries: number
        }[]
      }
      get_webhook_executive_metrics_7d: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_announcement_views: {
        Args: { announcement_id: string }
        Returns: undefined
      }
      is_country_allowed: { Args: { p_country_code: string }; Returns: boolean }
      is_department_manager: {
        Args: { _department_id: string; _user_id: string }
        Returns: boolean
      }
      is_ip_blocked: { Args: { p_ip_address: unknown }; Returns: boolean }
      is_ip_whitelisted: { Args: { p_ip_address: unknown }; Returns: boolean }
      log_geo_access: {
        Args: {
          p_country_code: string
          p_country_name: string
          p_endpoint?: string
          p_ip_address: unknown
          p_reason: string
          p_user_agent: string
          p_user_id: string
          p_was_allowed: boolean
        }
        Returns: string
      }
      log_ip_access: {
        Args: {
          p_endpoint: string
          p_ip_address: unknown
          p_reason: string
          p_user_agent: string
          p_user_id: string
          p_was_allowed: boolean
        }
        Returns: string
      }
      log_login_attempt: {
        Args: {
          p_attempt_type?: string
          p_email: string
          p_error_message?: string
          p_ip_address: unknown
          p_user_agent: string
        }
        Returns: Json
      }
      log_runbook_step: {
        Args: {
          p_alert_id: string
          p_notes: string
          p_phase: string
          p_runbook_slug: string
          p_step_index: number
          p_step_title: string
        }
        Returns: string
      }
      process_external_task: {
        Args: { p_external_task_id: string }
        Returns: Json
      }
      promote_webhook_secret: {
        Args: { p_subscription_id: string }
        Returns: Json
      }
      register_device: {
        Args: {
          p_browser?: string
          p_device_type?: string
          p_fingerprint: string
          p_ip_address: unknown
          p_os?: string
          p_user_agent: string
          p_user_id: string
        }
        Returns: Json
      }
      reject_password_reset: {
        Args: { p_notes?: string; p_request_id: string }
        Returns: Json
      }
      request_password_reset: { Args: { p_user_id: string }; Returns: string }
      reset_login_attempts: { Args: { p_email: string }; Returns: undefined }
      rotate_webhook_secret: {
        Args: {
          p_grace_hours?: number
          p_new_secret: string
          p_subscription_id: string
        }
        Returns: Json
      }
      update_certification_statuses: { Args: never; Returns: undefined }
      user_has_passkeys: { Args: { p_user_id: string }; Returns: boolean }
      validate_api_key: {
        Args: { p_api_key: string; p_api_secret: string }
        Returns: {
          id: string
          name: string
          permissions: Json
          rate_limit_per_minute: number
          system_type: string
        }[]
      }
      validate_reset_token: { Args: { p_token: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "employee"
      audit_action:
        | "user_signup"
        | "user_login"
        | "profile_update"
        | "xp_gained"
        | "level_up"
        | "coins_earned"
        | "coins_spent"
        | "quest_created"
        | "quest_updated"
        | "quest_deleted"
        | "quest_assigned"
        | "quest_completed"
        | "kudos_given"
        | "kudos_received"
        | "achievement_unlocked"
        | "streak_updated"
        | "department_created"
        | "department_updated"
        | "team_member_added"
        | "team_member_removed"
        | "role_assigned"
        | "role_removed"
      climate_pillar:
        | "recognition"
        | "autonomy"
        | "growth"
        | "leadership"
        | "peers"
        | "purpose"
        | "environment"
        | "communication"
        | "benefits"
        | "balance"
      evaluator_type: "self" | "manager" | "peer" | "direct_report" | "external"
      feedback_cycle_status:
        | "draft"
        | "active"
        | "collecting"
        | "processing"
        | "completed"
        | "cancelled"
      mission_frequency: "daily" | "weekly" | "monthly"
      module_content_type:
        | "video"
        | "text"
        | "quiz"
        | "flashcard"
        | "infographic"
        | "simulation"
        | "checklist"
      opinion_category:
        | "suggestion"
        | "complaint"
        | "compliment"
        | "question"
        | "other"
      opinion_status: "new" | "read" | "in_progress" | "resolved" | "archived"
      opinion_urgency: "low" | "normal" | "high" | "critical"
      purchase_status: "pending" | "approved" | "delivered" | "cancelled"
      quest_difficulty: "easy" | "medium" | "hard" | "expert"
      quest_status: "draft" | "active" | "archived"
      reward_category: "product" | "benefit" | "experience"
      reward_rarity: "common" | "rare" | "epic" | "legendary"
      task_completion_status:
        | "pending"
        | "on_time"
        | "late"
        | "rejected"
        | "rework"
      trail_status: "draft" | "published" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "employee"],
      audit_action: [
        "user_signup",
        "user_login",
        "profile_update",
        "xp_gained",
        "level_up",
        "coins_earned",
        "coins_spent",
        "quest_created",
        "quest_updated",
        "quest_deleted",
        "quest_assigned",
        "quest_completed",
        "kudos_given",
        "kudos_received",
        "achievement_unlocked",
        "streak_updated",
        "department_created",
        "department_updated",
        "team_member_added",
        "team_member_removed",
        "role_assigned",
        "role_removed",
      ],
      climate_pillar: [
        "recognition",
        "autonomy",
        "growth",
        "leadership",
        "peers",
        "purpose",
        "environment",
        "communication",
        "benefits",
        "balance",
      ],
      evaluator_type: ["self", "manager", "peer", "direct_report", "external"],
      feedback_cycle_status: [
        "draft",
        "active",
        "collecting",
        "processing",
        "completed",
        "cancelled",
      ],
      mission_frequency: ["daily", "weekly", "monthly"],
      module_content_type: [
        "video",
        "text",
        "quiz",
        "flashcard",
        "infographic",
        "simulation",
        "checklist",
      ],
      opinion_category: [
        "suggestion",
        "complaint",
        "compliment",
        "question",
        "other",
      ],
      opinion_status: ["new", "read", "in_progress", "resolved", "archived"],
      opinion_urgency: ["low", "normal", "high", "critical"],
      purchase_status: ["pending", "approved", "delivered", "cancelled"],
      quest_difficulty: ["easy", "medium", "hard", "expert"],
      quest_status: ["draft", "active", "archived"],
      reward_category: ["product", "benefit", "experience"],
      reward_rarity: ["common", "rare", "epic", "legendary"],
      task_completion_status: [
        "pending",
        "on_time",
        "late",
        "rejected",
        "rework",
      ],
      trail_status: ["draft", "published", "archived"],
    },
  },
} as const
