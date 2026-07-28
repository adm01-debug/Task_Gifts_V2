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
          analysis_days: number | null
          coin_reward: number
          completed_at: string | null
          created_at: string
          current_score: number | null
          department_id: string | null
          description: string | null
          engagement_factor_id: string | null
          id: string
          initial_score: number | null
          nr1_category_id: string | null
          opinion_id: string | null
          owner_id: string
          pillar: Database["public"]["Enums"]["climate_pillar"] | null
          progress_percent: number
          related_survey_id: string | null
          reviewer_id: string | null
          root_cause_summary: string | null
          root_causes: Json
          source: string
          status: string
          target_date: string
          target_score: number | null
          title: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          analysis_days?: number | null
          coin_reward?: number
          completed_at?: string | null
          created_at?: string
          current_score?: number | null
          department_id?: string | null
          description?: string | null
          engagement_factor_id?: string | null
          id?: string
          initial_score?: number | null
          nr1_category_id?: string | null
          opinion_id?: string | null
          owner_id: string
          pillar?: Database["public"]["Enums"]["climate_pillar"] | null
          progress_percent?: number
          related_survey_id?: string | null
          reviewer_id?: string | null
          root_cause_summary?: string | null
          root_causes?: Json
          source?: string
          status?: string
          target_date: string
          target_score?: number | null
          title: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          analysis_days?: number | null
          coin_reward?: number
          completed_at?: string | null
          created_at?: string
          current_score?: number | null
          department_id?: string | null
          description?: string | null
          engagement_factor_id?: string | null
          id?: string
          initial_score?: number | null
          nr1_category_id?: string | null
          opinion_id?: string | null
          owner_id?: string
          pillar?: Database["public"]["Enums"]["climate_pillar"] | null
          progress_percent?: number
          related_survey_id?: string | null
          reviewer_id?: string | null
          root_cause_summary?: string | null
          root_causes?: Json
          source?: string
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
            foreignKeyName: "action_plans_engagement_factor_id_fkey"
            columns: ["engagement_factor_id"]
            isOneToOne: false
            referencedRelation: "engagement_factors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_plans_nr1_category_id_fkey"
            columns: ["nr1_category_id"]
            isOneToOne: false
            referencedRelation: "nr1_risk_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_plans_opinion_id_fkey"
            columns: ["opinion_id"]
            isOneToOne: false
            referencedRelation: "opinions"
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
      ai_course_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          generated_trail_id: string | null
          id: string
          modules_created: number
          prompt_hint: string | null
          questions_created: number
          source_file_name: string
          source_file_path: string
          source_file_size: number | null
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          generated_trail_id?: string | null
          id?: string
          modules_created?: number
          prompt_hint?: string | null
          questions_created?: number
          source_file_name: string
          source_file_path: string
          source_file_size?: number | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          generated_trail_id?: string | null
          id?: string
          modules_created?: number
          prompt_hint?: string | null
          questions_created?: number
          source_file_name?: string
          source_file_path?: string
          source_file_size?: number | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_course_jobs_generated_trail_id_fkey"
            columns: ["generated_trail_id"]
            isOneToOne: false
            referencedRelation: "learning_trails"
            referencedColumns: ["id"]
          },
        ]
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
      auction_admin_events: {
        Row: {
          action: string
          actor_id: string | null
          auction_id: string | null
          created_at: string
          details: Json
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          auction_id?: string | null
          created_at?: string
          details?: Json
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          auction_id?: string | null
          created_at?: string
          details?: Json
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_admin_events_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      auction_bids: {
        Row: {
          amount: number
          auction_id: string
          created_at: string
          dedupe_key: string | null
          escrow_coins: number
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          auction_id: string
          created_at?: string
          dedupe_key?: string | null
          escrow_coins?: number
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          auction_id?: string
          created_at?: string
          dedupe_key?: string | null
          escrow_coins?: number
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      auctions: {
        Row: {
          closed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string
          id: string
          image_url: string | null
          min_increment: number
          reward_id: string | null
          starting_bid: number
          starts_at: string
          status: string
          title: string
          total_bids: number
          updated_at: string
          winner_id: string | null
          winning_bid: number | null
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at: string
          id?: string
          image_url?: string | null
          min_increment?: number
          reward_id?: string | null
          starting_bid?: number
          starts_at?: string
          status?: string
          title: string
          total_bids?: number
          updated_at?: string
          winner_id?: string | null
          winning_bid?: number | null
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          image_url?: string | null
          min_increment?: number
          reward_id?: string | null
          starting_bid?: number
          starts_at?: string
          status?: string
          title?: string
          total_bids?: number
          updated_at?: string
          winner_id?: string | null
          winning_bid?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "auctions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "shop_rewards"
            referencedColumns: ["id"]
          },
        ]
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
      bingo_board_tasks: {
        Row: {
          board_id: string
          created_at: string
          id: string
          label: string
          metric_key: string
          order_index: number
          target_value: number
        }
        Insert: {
          board_id: string
          created_at?: string
          id?: string
          label: string
          metric_key: string
          order_index?: number
          target_value?: number
        }
        Update: {
          board_id?: string
          created_at?: string
          id?: string
          label?: string
          metric_key?: string
          order_index?: number
          target_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "bingo_board_tasks_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "bingo_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      bingo_boards: {
        Row: {
          coins_full_house: number
          coins_per_line: number
          created_at: string
          description: string | null
          ends_at: string
          id: string
          is_active: boolean
          starts_at: string
          title: string
          updated_at: string
          xp_full_house: number
          xp_per_line: number
        }
        Insert: {
          coins_full_house?: number
          coins_per_line?: number
          created_at?: string
          description?: string | null
          ends_at: string
          id?: string
          is_active?: boolean
          starts_at?: string
          title: string
          updated_at?: string
          xp_full_house?: number
          xp_per_line?: number
        }
        Update: {
          coins_full_house?: number
          coins_per_line?: number
          created_at?: string
          description?: string | null
          ends_at?: string
          id?: string
          is_active?: boolean
          starts_at?: string
          title?: string
          updated_at?: string
          xp_full_house?: number
          xp_per_line?: number
        }
        Relationships: []
      }
      bingo_cards: {
        Row: {
          board_id: string
          cells: Json
          coins_awarded: number
          created_at: string
          full_house_awarded: boolean
          id: string
          last_synced_at: string | null
          lines_awarded: number
          updated_at: string
          user_id: string
          xp_awarded: number
        }
        Insert: {
          board_id: string
          cells: Json
          coins_awarded?: number
          created_at?: string
          full_house_awarded?: boolean
          id?: string
          last_synced_at?: string | null
          lines_awarded?: number
          updated_at?: string
          user_id: string
          xp_awarded?: number
        }
        Update: {
          board_id?: string
          cells?: Json
          coins_awarded?: number
          created_at?: string
          full_house_awarded?: boolean
          id?: string
          last_synced_at?: string | null
          lines_awarded?: number
          updated_at?: string
          user_id?: string
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "bingo_cards_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "bingo_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      bingo_marks: {
        Row: {
          card_id: string
          id: string
          marked_at: string
          metric_key: string
          observed_value: number
          position: number
          user_id: string
        }
        Insert: {
          card_id: string
          id?: string
          marked_at?: string
          metric_key: string
          observed_value?: number
          position: number
          user_id: string
        }
        Update: {
          card_id?: string
          id?: string
          marked_at?: string
          metric_key?: string
          observed_value?: number
          position?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bingo_marks_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "bingo_cards"
            referencedColumns: ["id"]
          },
        ]
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
      campaign_participants: {
        Row: {
          accepted_at: string | null
          campaign_id: string
          coins_earned: number
          completed_at: string | null
          created_at: string
          declined_at: string | null
          id: string
          progress: number
          progress_percent: number
          rank_position: number | null
          target_adjusted: number
          updated_at: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          accepted_at?: string | null
          campaign_id: string
          coins_earned?: number
          completed_at?: string | null
          created_at?: string
          declined_at?: string | null
          id?: string
          progress?: number
          progress_percent?: number
          rank_position?: number | null
          target_adjusted?: number
          updated_at?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          accepted_at?: string | null
          campaign_id?: string
          coins_earned?: number
          completed_at?: string | null
          created_at?: string
          declined_at?: string | null
          id?: string
          progress?: number
          progress_percent?: number
          rank_position?: number | null
          target_adjusted?: number
          updated_at?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sales_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_progress_events: {
        Row: {
          campaign_id: string
          created_at: string
          delta: number
          id: string
          new_value: number
          note: string | null
          previous_value: number
          reference_id: string | null
          source: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          delta: number
          id?: string
          new_value?: number
          note?: string | null
          previous_value?: number
          reference_id?: string | null
          source?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          delta?: number
          id?: string
          new_value?: number
          note?: string | null
          previous_value?: number
          reference_id?: string | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_progress_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sales_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_result_imports: {
        Row: {
          applied_at: string | null
          applied_rows: number
          campaign_id: string
          created_at: string
          created_by: string | null
          error_message: string | null
          error_rows: number
          file_name: string
          id: string
          reverted_at: string | null
          skipped_rows: number
          source: string
          status: string
          summary: Json
          total_amount: number
          total_rows: number
          updated_at: string
          valid_rows: number
        }
        Insert: {
          applied_at?: string | null
          applied_rows?: number
          campaign_id: string
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          error_rows?: number
          file_name: string
          id?: string
          reverted_at?: string | null
          skipped_rows?: number
          source?: string
          status?: string
          summary?: Json
          total_amount?: number
          total_rows?: number
          updated_at?: string
          valid_rows?: number
        }
        Update: {
          applied_at?: string | null
          applied_rows?: number
          campaign_id?: string
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          error_rows?: number
          file_name?: string
          id?: string
          reverted_at?: string | null
          skipped_rows?: number
          source?: string
          status?: string
          summary?: Json
          total_amount?: number
          total_rows?: number
          updated_at?: string
          valid_rows?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_result_imports_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sales_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_result_rows: {
        Row: {
          amount: number
          applied_at: string | null
          campaign_id: string
          created_at: string
          dedupe_key: string
          error_reason: string | null
          external_reference: string | null
          id: string
          import_id: string
          reference_date: string | null
          row_number: number
          seller_identifier: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          applied_at?: string | null
          campaign_id: string
          created_at?: string
          dedupe_key: string
          error_reason?: string | null
          external_reference?: string | null
          id?: string
          import_id: string
          reference_date?: string | null
          row_number?: number
          seller_identifier: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          applied_at?: string | null
          campaign_id?: string
          created_at?: string
          dedupe_key?: string
          error_reason?: string | null
          external_reference?: string | null
          id?: string
          import_id?: string
          reference_date?: string | null
          row_number?: number
          seller_identifier?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_result_rows_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sales_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_result_rows_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "campaign_result_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_team_members: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          team_id: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          team_id: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_team_members_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sales_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "campaign_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_team_split_batches: {
        Row: {
          campaign_id: string
          created_at: string
          executed_by: string | null
          id: string
          members_awarded: number
          members_skipped: number
          pool_coins: number
          pool_xp: number
          reason: string | null
          reverted_at: string | null
          reverted_by: string | null
          share_mode: string
          status: string
          teams_awarded: number
          total_coins_paid: number
          total_xp_paid: number
        }
        Insert: {
          campaign_id: string
          created_at?: string
          executed_by?: string | null
          id?: string
          members_awarded?: number
          members_skipped?: number
          pool_coins?: number
          pool_xp?: number
          reason?: string | null
          reverted_at?: string | null
          reverted_by?: string | null
          share_mode?: string
          status?: string
          teams_awarded?: number
          total_coins_paid?: number
          total_xp_paid?: number
        }
        Update: {
          campaign_id?: string
          created_at?: string
          executed_by?: string | null
          id?: string
          members_awarded?: number
          members_skipped?: number
          pool_coins?: number
          pool_xp?: number
          reason?: string | null
          reverted_at?: string | null
          reverted_by?: string | null
          share_mode?: string
          status?: string
          teams_awarded?: number
          total_coins_paid?: number
          total_xp_paid?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_team_split_batches_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sales_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_team_split_entries: {
        Row: {
          batch_id: string
          campaign_id: string
          coins_allocated: number
          created_at: string
          failure_reason: string | null
          id: string
          member_progress: number
          outcome: string
          share_percent: number
          team_id: string | null
          team_name: string | null
          team_progress: number
          team_target: number
          user_id: string | null
          user_identifier: string | null
          xp_allocated: number
        }
        Insert: {
          batch_id: string
          campaign_id: string
          coins_allocated?: number
          created_at?: string
          failure_reason?: string | null
          id?: string
          member_progress?: number
          outcome?: string
          share_percent?: number
          team_id?: string | null
          team_name?: string | null
          team_progress?: number
          team_target?: number
          user_id?: string | null
          user_identifier?: string | null
          xp_allocated?: number
        }
        Update: {
          batch_id?: string
          campaign_id?: string
          coins_allocated?: number
          created_at?: string
          failure_reason?: string | null
          id?: string
          member_progress?: number
          outcome?: string
          share_percent?: number
          team_id?: string | null
          team_name?: string | null
          team_progress?: number
          team_target?: number
          user_id?: string | null
          user_identifier?: string | null
          xp_allocated?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_team_split_entries_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "campaign_team_split_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_teams: {
        Row: {
          awarded_at: string | null
          campaign_id: string
          coins_awarded: number
          color: string | null
          created_at: string
          created_by: string | null
          department_id: string | null
          id: string
          members_count: number
          name: string
          progress: number
          progress_percent: number
          rank_position: number | null
          target_team: number
          updated_at: string
          xp_awarded: number
        }
        Insert: {
          awarded_at?: string | null
          campaign_id: string
          coins_awarded?: number
          color?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          id?: string
          members_count?: number
          name: string
          progress?: number
          progress_percent?: number
          rank_position?: number | null
          target_team?: number
          updated_at?: string
          xp_awarded?: number
        }
        Update: {
          awarded_at?: string | null
          campaign_id?: string
          coins_awarded?: number
          color?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          id?: string
          members_count?: number
          name?: string
          progress?: number
          progress_percent?: number
          rank_position?: number | null
          target_team?: number
          updated_at?: string
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_teams_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sales_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_teams_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
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
      department_war_contributions: {
        Row: {
          amount: number
          created_at: string
          dedupe_key: string
          department_id: string
          id: string
          metric_key: string
          user_id: string
          war_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          dedupe_key: string
          department_id: string
          id?: string
          metric_key: string
          user_id: string
          war_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          dedupe_key?: string
          department_id?: string
          id?: string
          metric_key?: string
          user_id?: string
          war_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_war_contributions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_war_contributions_war_id_fkey"
            columns: ["war_id"]
            isOneToOne: false
            referencedRelation: "department_wars"
            referencedColumns: ["id"]
          },
        ]
      }
      department_war_departments: {
        Row: {
          created_at: string
          department_id: string
          headcount: number
          id: string
          updated_at: string
          war_id: string
        }
        Insert: {
          created_at?: string
          department_id: string
          headcount?: number
          id?: string
          updated_at?: string
          war_id: string
        }
        Update: {
          created_at?: string
          department_id?: string
          headcount?: number
          id?: string
          updated_at?: string
          war_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_war_departments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_war_departments_war_id_fkey"
            columns: ["war_id"]
            isOneToOne: false
            referencedRelation: "department_wars"
            referencedColumns: ["id"]
          },
        ]
      }
      department_war_metrics: {
        Row: {
          created_at: string
          id: string
          label: string
          metric_key: string
          updated_at: string
          war_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          metric_key: string
          updated_at?: string
          war_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          metric_key?: string
          updated_at?: string
          war_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "department_war_metrics_war_id_fkey"
            columns: ["war_id"]
            isOneToOne: false
            referencedRelation: "department_wars"
            referencedColumns: ["id"]
          },
        ]
      }
      department_war_results: {
        Row: {
          coins_per_member: number
          coins_total: number
          contributors: number
          created_at: string
          department_id: string
          id: string
          participation_rate: number
          position: number
          raw_score: number
          score: number
          war_id: string
          xp_per_member: number
          xp_total: number
        }
        Insert: {
          coins_per_member?: number
          coins_total?: number
          contributors?: number
          created_at?: string
          department_id: string
          id?: string
          participation_rate?: number
          position: number
          raw_score?: number
          score?: number
          war_id: string
          xp_per_member?: number
          xp_total?: number
        }
        Update: {
          coins_per_member?: number
          coins_total?: number
          contributors?: number
          created_at?: string
          department_id?: string
          id?: string
          participation_rate?: number
          position?: number
          raw_score?: number
          score?: number
          war_id?: string
          xp_per_member?: number
          xp_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "department_war_results_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_war_results_war_id_fkey"
            columns: ["war_id"]
            isOneToOne: false
            referencedRelation: "department_wars"
            referencedColumns: ["id"]
          },
        ]
      }
      department_wars: {
        Row: {
          coins_pool: number
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string
          fairness_alpha: number
          id: string
          participation_bonus: number
          per_member_coins_cap: number
          per_user_cap: number
          placement_shares: Json
          settled_at: string | null
          starts_at: string
          status: string
          title: string
          updated_at: string
          xp_pool: number
        }
        Insert: {
          coins_pool?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at: string
          fairness_alpha?: number
          id?: string
          participation_bonus?: number
          per_member_coins_cap?: number
          per_user_cap?: number
          placement_shares?: Json
          settled_at?: string | null
          starts_at?: string
          status?: string
          title: string
          updated_at?: string
          xp_pool?: number
        }
        Update: {
          coins_pool?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string
          fairness_alpha?: number
          id?: string
          participation_bonus?: number
          per_member_coins_cap?: number
          per_user_cap?: number
          placement_shares?: Json
          settled_at?: string | null
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
          xp_pool?: number
        }
        Relationships: []
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
      engagement_action_playbooks: {
        Row: {
          created_at: string
          duration_days: number
          how_method: string
          id: string
          is_active: boolean
          order_index: number
          pillar: Database["public"]["Enums"]["climate_pillar"]
          priority: string
          title: string
          updated_at: string
          why_reason: string
        }
        Insert: {
          created_at?: string
          duration_days?: number
          how_method: string
          id?: string
          is_active?: boolean
          order_index?: number
          pillar: Database["public"]["Enums"]["climate_pillar"]
          priority?: string
          title: string
          updated_at?: string
          why_reason: string
        }
        Update: {
          created_at?: string
          duration_days?: number
          how_method?: string
          id?: string
          is_active?: boolean
          order_index?: number
          pillar?: Database["public"]["Enums"]["climate_pillar"]
          priority?: string
          title?: string
          updated_at?: string
          why_reason?: string
        }
        Relationships: []
      }
      engagement_answers: {
        Row: {
          answered_at: string
          created_at: string
          cycle_id: string
          department_id: string | null
          id: string
          is_anonymous: boolean
          normalized_score: number | null
          question_id: string
          raw_value: Json | null
          text_answer: string | null
          user_id: string
        }
        Insert: {
          answered_at?: string
          created_at?: string
          cycle_id: string
          department_id?: string | null
          id?: string
          is_anonymous?: boolean
          normalized_score?: number | null
          question_id: string
          raw_value?: Json | null
          text_answer?: string | null
          user_id: string
        }
        Update: {
          answered_at?: string
          created_at?: string
          cycle_id?: string
          department_id?: string | null
          id?: string
          is_anonymous?: boolean
          normalized_score?: number | null
          question_id?: string
          raw_value?: Json | null
          text_answer?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "engagement_answers_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "engagement_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_answers_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "engagement_question_pool"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_cycles: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string | null
          ends_at: string
          id: string
          questions_per_user: number
          starts_at: string
          status: Database["public"]["Enums"]["engagement_cycle_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          ends_at: string
          id?: string
          questions_per_user?: number
          starts_at?: string
          status?: Database["public"]["Enums"]["engagement_cycle_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          ends_at?: string
          id?: string
          questions_per_user?: number
          starts_at?: string
          status?: Database["public"]["Enums"]["engagement_cycle_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "engagement_cycles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_factors: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          key: string
          name: string
          order_index: number
          pillar: Database["public"]["Enums"]["climate_pillar"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          key: string
          name: string
          order_index?: number
          pillar: Database["public"]["Enums"]["climate_pillar"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          key?: string
          name?: string
          order_index?: number
          pillar?: Database["public"]["Enums"]["climate_pillar"]
          updated_at?: string
        }
        Relationships: []
      }
      engagement_question_assignments: {
        Row: {
          answered_at: string | null
          created_at: string
          cycle_id: string
          id: string
          order_index: number
          question_id: string
          user_id: string
        }
        Insert: {
          answered_at?: string | null
          created_at?: string
          cycle_id: string
          id?: string
          order_index?: number
          question_id: string
          user_id: string
        }
        Update: {
          answered_at?: string | null
          created_at?: string
          cycle_id?: string
          id?: string
          order_index?: number
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "engagement_question_assignments_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "engagement_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_question_assignments_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "engagement_question_pool"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_question_pool: {
        Row: {
          answer_format: Database["public"]["Enums"]["engagement_answer_format"]
          code: string
          copsoq_dimension: string | null
          created_at: string
          factor_id: string | null
          helper_text: string | null
          id: string
          is_active: boolean
          is_nr1: boolean
          is_reverse: boolean
          options: Json
          pillar: Database["public"]["Enums"]["climate_pillar"]
          question_text: string
          updated_at: string
          weight: number
        }
        Insert: {
          answer_format?: Database["public"]["Enums"]["engagement_answer_format"]
          code: string
          copsoq_dimension?: string | null
          created_at?: string
          factor_id?: string | null
          helper_text?: string | null
          id?: string
          is_active?: boolean
          is_nr1?: boolean
          is_reverse?: boolean
          options?: Json
          pillar: Database["public"]["Enums"]["climate_pillar"]
          question_text: string
          updated_at?: string
          weight?: number
        }
        Update: {
          answer_format?: Database["public"]["Enums"]["engagement_answer_format"]
          code?: string
          copsoq_dimension?: string | null
          created_at?: string
          factor_id?: string | null
          helper_text?: string | null
          id?: string
          is_active?: boolean
          is_nr1?: boolean
          is_reverse?: boolean
          options?: Json
          pillar?: Database["public"]["Enums"]["climate_pillar"]
          question_text?: string
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "engagement_question_pool_factor_id_fkey"
            columns: ["factor_id"]
            isOneToOne: false
            referencedRelation: "engagement_factors"
            referencedColumns: ["id"]
          },
        ]
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
      executive_monthly_reports: {
        Row: {
          action_items_done: number
          action_items_overdue: number
          action_items_total: number
          breakdown_by_type: Json
          commentary: string | null
          commentary_updated_at: string | null
          commentary_updated_by: string | null
          created_at: string
          generated_at: string
          id: string
          incidents_critical: number
          incidents_high: number
          incidents_resolved: number
          incidents_total: number
          mtta_minutes_avg: number | null
          mttr_minutes_avg: number | null
          mttr_minutes_p95: number | null
          period_month: number
          period_year: number
          postmortems_created: number
          postmortems_published: number
          sla_breaches: number
        }
        Insert: {
          action_items_done?: number
          action_items_overdue?: number
          action_items_total?: number
          breakdown_by_type?: Json
          commentary?: string | null
          commentary_updated_at?: string | null
          commentary_updated_by?: string | null
          created_at?: string
          generated_at?: string
          id?: string
          incidents_critical?: number
          incidents_high?: number
          incidents_resolved?: number
          incidents_total?: number
          mtta_minutes_avg?: number | null
          mttr_minutes_avg?: number | null
          mttr_minutes_p95?: number | null
          period_month: number
          period_year: number
          postmortems_created?: number
          postmortems_published?: number
          sla_breaches?: number
        }
        Update: {
          action_items_done?: number
          action_items_overdue?: number
          action_items_total?: number
          breakdown_by_type?: Json
          commentary?: string | null
          commentary_updated_at?: string | null
          commentary_updated_by?: string | null
          created_at?: string
          generated_at?: string
          id?: string
          incidents_critical?: number
          incidents_high?: number
          incidents_resolved?: number
          incidents_total?: number
          mtta_minutes_avg?: number | null
          mttr_minutes_avg?: number | null
          mttr_minutes_p95?: number | null
          period_month?: number
          period_year?: number
          postmortems_created?: number
          postmortems_published?: number
          sla_breaches?: number
        }
        Relationships: []
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
      lightning_quiz_answers: {
        Row: {
          answered_true: boolean
          created_at: string
          elapsed_ms: number
          id: string
          idx: number
          is_correct: boolean
          question_id: string
          session_id: string
          user_id: string
        }
        Insert: {
          answered_true: boolean
          created_at?: string
          elapsed_ms?: number
          id?: string
          idx: number
          is_correct: boolean
          question_id: string
          session_id: string
          user_id: string
        }
        Update: {
          answered_true?: boolean
          created_at?: string
          elapsed_ms?: number
          id?: string
          idx?: number
          is_correct?: boolean
          question_id?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lightning_quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "lightning_quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lightning_quiz_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "lightning_quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      lightning_quiz_questions: {
        Row: {
          category: string
          created_at: string
          difficulty: string
          explanation: string | null
          id: string
          is_active: boolean
          is_true: boolean
          statement: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          is_active?: boolean
          is_true: boolean
          statement: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          is_active?: boolean
          is_true?: boolean
          statement?: string
          updated_at?: string
        }
        Relationships: []
      }
      lightning_quiz_sessions: {
        Row: {
          best_streak: number
          coins_awarded: number
          correct_count: number
          created_at: string
          current_index: number
          current_streak: number
          deadline_at: string
          dedupe_key: string
          finished_at: string | null
          id: string
          question_ids: string[]
          started_at: string
          status: string
          updated_at: string
          user_id: string
          wrong_count: number
          xp_awarded: number
        }
        Insert: {
          best_streak?: number
          coins_awarded?: number
          correct_count?: number
          created_at?: string
          current_index?: number
          current_streak?: number
          deadline_at: string
          dedupe_key: string
          finished_at?: string | null
          id?: string
          question_ids?: string[]
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
          wrong_count?: number
          xp_awarded?: number
        }
        Update: {
          best_streak?: number
          coins_awarded?: number
          correct_count?: number
          created_at?: string
          current_index?: number
          current_streak?: number
          deadline_at?: string
          dedupe_key?: string
          finished_at?: string | null
          id?: string
          question_ids?: string[]
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
          wrong_count?: number
          xp_awarded?: number
        }
        Relationships: []
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
      lucky_wheel_payout_snapshots: {
        Row: {
          chi_square: number
          coins_paid: number
          created_at: string
          degrees_of_freedom: number
          duplicate_spins: number
          id: string
          projected_coins: number
          projected_xp: number
          snapshot_date: string
          spins: number
          unconfigured_spins: number
          unique_users: number
          updated_at: string
          xp_paid: number
        }
        Insert: {
          chi_square?: number
          coins_paid?: number
          created_at?: string
          degrees_of_freedom?: number
          duplicate_spins?: number
          id?: string
          projected_coins?: number
          projected_xp?: number
          snapshot_date: string
          spins?: number
          unconfigured_spins?: number
          unique_users?: number
          updated_at?: string
          xp_paid?: number
        }
        Update: {
          chi_square?: number
          coins_paid?: number
          created_at?: string
          degrees_of_freedom?: number
          duplicate_spins?: number
          id?: string
          projected_coins?: number
          projected_xp?: number
          snapshot_date?: string
          spins?: number
          unconfigured_spins?: number
          unique_users?: number
          updated_at?: string
          xp_paid?: number
        }
        Relationships: []
      }
      lucky_wheel_prize_audit: {
        Row: {
          after_data: Json | null
          before_data: Json | null
          changed_at: string
          changed_by: string | null
          id: string
          operation: string
          prize_id: string | null
        }
        Insert: {
          after_data?: Json | null
          before_data?: Json | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          operation: string
          prize_id?: string | null
        }
        Update: {
          after_data?: Json | null
          before_data?: Json | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          operation?: string
          prize_id?: string | null
        }
        Relationships: []
      }
      lucky_wheel_prizes: {
        Row: {
          achievement_id: string | null
          amount: number
          color: string
          created_at: string
          icon: string
          id: string
          is_active: boolean
          label: string
          prize_type: string
          rarity: string
          updated_at: string
          weight: number
        }
        Insert: {
          achievement_id?: string | null
          amount?: number
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          label: string
          prize_type: string
          rarity?: string
          updated_at?: string
          weight?: number
        }
        Update: {
          achievement_id?: string | null
          amount?: number
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          label?: string
          prize_type?: string
          rarity?: string
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "lucky_wheel_prizes_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      lucky_wheel_settings: {
        Row: {
          coins_per_spin_budget: number
          created_at: string
          id: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          coins_per_spin_budget?: number
          created_at?: string
          id?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          coins_per_spin_budget?: number
          created_at?: string
          id?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      lucky_wheel_settings_audit: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_budget: number
          old_budget: number | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_budget: number
          old_budget?: number | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_budget?: number
          old_budget?: number | null
        }
        Relationships: []
      }
      lucky_wheel_spins: {
        Row: {
          amount: number
          created_at: string
          dedupe_key: string
          id: string
          prize_id: string | null
          prize_label: string
          prize_type: string
          spin_date: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          dedupe_key: string
          id?: string
          prize_id?: string | null
          prize_label: string
          prize_type: string
          spin_date?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          dedupe_key?: string
          id?: string
          prize_id?: string | null
          prize_label?: string
          prize_type?: string
          spin_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lucky_wheel_spins_prize_id_fkey"
            columns: ["prize_id"]
            isOneToOne: false
            referencedRelation: "lucky_wheel_prizes"
            referencedColumns: ["id"]
          },
        ]
      }
      lucky_wheel_whatif_snapshots: {
        Row: {
          active_budget: number
          baseline_alert_count: number
          break_even_budget: number | null
          created_at: string
          created_by: string | null
          current_coins_per_spin: number
          current_window_end: string
          current_window_start: string
          id: string
          previous_window_end: string
          previous_window_start: string
          scenarios: Json
          signature: string
          updated_at: string
        }
        Insert: {
          active_budget?: number
          baseline_alert_count?: number
          break_even_budget?: number | null
          created_at?: string
          created_by?: string | null
          current_coins_per_spin?: number
          current_window_end: string
          current_window_start: string
          id?: string
          previous_window_end: string
          previous_window_start: string
          scenarios?: Json
          signature: string
          updated_at?: string
        }
        Update: {
          active_budget?: number
          baseline_alert_count?: number
          break_even_budget?: number | null
          created_at?: string
          created_by?: string | null
          current_coins_per_spin?: number
          current_window_end?: string
          current_window_start?: string
          id?: string
          previous_window_end?: string
          previous_window_start?: string
          scenarios?: Json
          signature?: string
          updated_at?: string
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
      nr1_factor_mappings: {
        Row: {
          category_id: string
          created_at: string
          factor_id: string
          id: string
          weight: number
        }
        Insert: {
          category_id: string
          created_at?: string
          factor_id: string
          id?: string
          weight?: number
        }
        Update: {
          category_id?: string
          created_at?: string
          factor_id?: string
          id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "nr1_factor_mappings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "nr1_risk_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nr1_factor_mappings_factor_id_fkey"
            columns: ["factor_id"]
            isOneToOne: false
            referencedRelation: "engagement_factors"
            referencedColumns: ["id"]
          },
        ]
      }
      nr1_risk_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          key: string
          legal_reference: string | null
          name: string
          order_index: number
          severity_weight: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          key: string
          legal_reference?: string | null
          name: string
          order_index?: number
          severity_weight?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          key?: string
          legal_reference?: string | null
          name?: string
          order_index?: number
          severity_weight?: number
          updated_at?: string
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
      opinion_supports: {
        Row: {
          created_at: string
          id: string
          opinion_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          opinion_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          opinion_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opinion_supports_opinion_id_fkey"
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
      org_members: {
        Row: {
          created_at: string
          id: string
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_theme_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          org_id: string
          snapshot: Json
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          org_id: string
          snapshot: Json
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          org_id?: string
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "org_theme_history_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          accent_color: string | null
          created_at: string
          custom_domain: string | null
          favicon_url: string | null
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          slug: string
          tagline: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          custom_domain?: string | null
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          slug: string
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          custom_domain?: string | null
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string
          tagline?: string | null
          updated_at?: string
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
      prediction_admin_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          market_id: string
          payload: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          market_id: string
          payload?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          market_id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "prediction_admin_events_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "prediction_markets"
            referencedColumns: ["id"]
          },
        ]
      }
      prediction_markets: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          locks_at: string
          max_stake_per_user: number
          min_stake: number
          rake_bps: number
          rake_collected: number
          resolves_at: string | null
          settled_at: string | null
          settled_by: string | null
          status: string
          title: string
          total_pool: number
          updated_at: string
          winning_option_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          locks_at: string
          max_stake_per_user?: number
          min_stake?: number
          rake_bps?: number
          rake_collected?: number
          resolves_at?: string | null
          settled_at?: string | null
          settled_by?: string | null
          status?: string
          title: string
          total_pool?: number
          updated_at?: string
          winning_option_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          locks_at?: string
          max_stake_per_user?: number
          min_stake?: number
          rake_bps?: number
          rake_collected?: number
          resolves_at?: string | null
          settled_at?: string | null
          settled_by?: string | null
          status?: string
          title?: string
          total_pool?: number
          updated_at?: string
          winning_option_id?: string | null
        }
        Relationships: []
      }
      prediction_options: {
        Row: {
          created_at: string
          id: string
          label: string
          market_id: string
          pool: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          market_id: string
          pool?: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          market_id?: string
          pool?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "prediction_options_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "prediction_markets"
            referencedColumns: ["id"]
          },
        ]
      }
      prediction_stakes: {
        Row: {
          amount: number
          created_at: string
          dedupe_key: string | null
          id: string
          market_id: string
          option_id: string
          payout: number | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          dedupe_key?: string | null
          id?: string
          market_id: string
          option_id: string
          payout?: number | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          dedupe_key?: string | null
          id?: string
          market_id?: string
          option_id?: string
          payout?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prediction_stakes_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "prediction_markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prediction_stakes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "prediction_options"
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
      purchase_approvals: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["purchase_status"] | null
          id: string
          purchase_id: string
          reason: string | null
          risk_snapshot: Json
          to_status: Database["public"]["Enums"]["purchase_status"] | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["purchase_status"] | null
          id?: string
          purchase_id: string
          reason?: string | null
          risk_snapshot?: Json
          to_status?: Database["public"]["Enums"]["purchase_status"] | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["purchase_status"] | null
          id?: string
          purchase_id?: string
          reason?: string | null
          risk_snapshot?: Json
          to_status?: Database["public"]["Enums"]["purchase_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_approvals_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "shop_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      push_notification_logs: {
        Row: {
          attempts: number
          campaign_id: string | null
          created_at: string
          data: Json | null
          device_label: string | null
          endpoint: string | null
          error: string | null
          id: string
          message: string
          status: string
          status_code: number | null
          subscription_id: string | null
          title: string
          type: string
          url: string | null
          user_id: string
        }
        Insert: {
          attempts?: number
          campaign_id?: string | null
          created_at?: string
          data?: Json | null
          device_label?: string | null
          endpoint?: string | null
          error?: string | null
          id?: string
          message: string
          status: string
          status_code?: number | null
          subscription_id?: string | null
          title: string
          type: string
          url?: string | null
          user_id: string
        }
        Update: {
          attempts?: number
          campaign_id?: string | null
          created_at?: string
          data?: Json | null
          device_label?: string | null
          endpoint?: string | null
          error?: string | null
          id?: string
          message?: string
          status?: string
          status_code?: number | null
          subscription_id?: string | null
          title?: string
          type?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_notification_logs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "push_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      push_outbox: {
        Row: {
          attempts: number
          created_at: string
          data: Json
          dedupe_key: string
          id: string
          last_error: string | null
          message: string
          processed_at: string | null
          status: string
          title: string
          type: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          data?: Json
          dedupe_key: string
          id?: string
          last_error?: string | null
          message: string
          processed_at?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          data?: Json
          dedupe_key?: string
          id?: string
          last_error?: string | null
          message?: string
          processed_at?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      push_outbox_health_snapshots: {
        Row: {
          alerts: Json
          created_at: string
          failed: number
          id: string
          minutes_since_last_dispatch: number | null
          oldest_pending_minutes: number
          pending: number
          processing: number
          score: number
          sent: number
          severity: string
          skipped: number
          stuck: number
        }
        Insert: {
          alerts?: Json
          created_at?: string
          failed?: number
          id?: string
          minutes_since_last_dispatch?: number | null
          oldest_pending_minutes?: number
          pending?: number
          processing?: number
          score: number
          sent?: number
          severity: string
          skipped?: number
          stuck?: number
        }
        Update: {
          alerts?: Json
          created_at?: string
          failed?: number
          id?: string
          minutes_since_last_dispatch?: number | null
          oldest_pending_minutes?: number
          pending?: number
          processing?: number
          score?: number
          sent?: number
          severity?: string
          skipped?: number
          stuck?: number
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          device_fingerprint: string | null
          device_label: string | null
          disabled_at: string | null
          disabled_reason: string | null
          endpoint: string
          failure_count: number
          id: string
          last_used_at: string | null
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          device_fingerprint?: string | null
          device_label?: string | null
          disabled_at?: string | null
          disabled_reason?: string | null
          endpoint: string
          failure_count?: number
          id?: string
          last_used_at?: string | null
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          device_fingerprint?: string | null
          device_label?: string | null
          disabled_at?: string | null
          disabled_reason?: string | null
          endpoint?: string
          failure_count?: number
          id?: string
          last_used_at?: string | null
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      push_sync_events: {
        Row: {
          created_at: string
          detail: string | null
          device_label: string | null
          endpoint: string | null
          event: string
          id: string
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          device_label?: string | null
          endpoint?: string | null
          event: string
          id?: string
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          device_label?: string | null
          endpoint?: string | null
          event?: string
          id?: string
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_sync_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "push_subscriptions"
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
      sales_campaigns: {
        Row: {
          coin_reward: number
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          department_id: string | null
          description: string | null
          end_date: string
          id: string
          metric_key: string
          metric_unit: string
          name: string
          org_id: string | null
          product_name: string | null
          progress_global: number
          sku: string | null
          split_rule: Json
          start_date: string
          status: string
          target_global: number
          target_individual_default: number
          updated_at: string
          xp_reward: number
        }
        Insert: {
          coin_reward?: number
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          end_date: string
          id?: string
          metric_key?: string
          metric_unit?: string
          name: string
          org_id?: string | null
          product_name?: string | null
          progress_global?: number
          sku?: string | null
          split_rule?: Json
          start_date: string
          status?: string
          target_global?: number
          target_individual_default?: number
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          coin_reward?: number
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          end_date?: string
          id?: string
          metric_key?: string
          metric_unit?: string
          name?: string
          org_id?: string | null
          product_name?: string | null
          progress_global?: number
          sku?: string | null
          split_rule?: Json
          start_date?: string
          status?: string
          target_global?: number
          target_individual_default?: number
          updated_at?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_campaigns_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_campaigns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      scratch_card_prizes: {
        Row: {
          amount: number
          created_at: string
          id: string
          is_active: boolean
          label: string
          prize_type: string
          rarity: string
          updated_at: string
          weight: number
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          prize_type: string
          rarity?: string
          updated_at?: string
          weight?: number
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          prize_type?: string
          rarity?: string
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      scratch_cards: {
        Row: {
          amount: number
          created_at: string
          dedupe_key: string
          id: string
          prize_id: string | null
          prize_label: string | null
          prize_type: string | null
          rarity: string | null
          revealed_at: string | null
          source: string
          source_ref: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          dedupe_key: string
          id?: string
          prize_id?: string | null
          prize_label?: string | null
          prize_type?: string | null
          rarity?: string | null
          revealed_at?: string | null
          source: string
          source_ref?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          dedupe_key?: string
          id?: string
          prize_id?: string | null
          prize_label?: string | null
          prize_type?: string | null
          rarity?: string | null
          revealed_at?: string | null
          source?: string
          source_ref?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scratch_cards_prize_id_fkey"
            columns: ["prize_id"]
            isOneToOne: false
            referencedRelation: "scratch_card_prizes"
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
          ai_summary: string | null
          created_at: string
          first_approver_id: string | null
          id: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          quantity: number
          requires_dual_approval: boolean
          reward_id: string
          risk_analyzed_at: string | null
          risk_factors: Json
          risk_level: string | null
          risk_score: number | null
          status: Database["public"]["Enums"]["purchase_status"]
          total_coins: number
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string
          first_approver_id?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          quantity?: number
          requires_dual_approval?: boolean
          reward_id: string
          risk_analyzed_at?: string | null
          risk_factors?: Json
          risk_level?: string | null
          risk_score?: number | null
          status?: Database["public"]["Enums"]["purchase_status"]
          total_coins: number
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          created_at?: string
          first_approver_id?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          quantity?: number
          requires_dual_approval?: boolean
          reward_id?: string
          risk_analyzed_at?: string | null
          risk_factors?: Json
          risk_level?: string | null
          risk_score?: number | null
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
      tournament_matches: {
        Row: {
          away_participant_id: string | null
          away_score: number
          created_at: string
          decided_at: string | null
          home_participant_id: string | null
          home_score: number
          id: string
          round: number
          slot: number
          status: string
          tournament_id: string
          updated_at: string
          winner_participant_id: string | null
        }
        Insert: {
          away_participant_id?: string | null
          away_score?: number
          created_at?: string
          decided_at?: string | null
          home_participant_id?: string | null
          home_score?: number
          id?: string
          round: number
          slot: number
          status?: string
          tournament_id: string
          updated_at?: string
          winner_participant_id?: string | null
        }
        Update: {
          away_participant_id?: string | null
          away_score?: number
          created_at?: string
          decided_at?: string | null
          home_participant_id?: string | null
          home_score?: number
          id?: string
          round?: number
          slot?: number
          status?: string
          tournament_id?: string
          updated_at?: string
          winner_participant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_matches_away_participant_id_fkey"
            columns: ["away_participant_id"]
            isOneToOne: false
            referencedRelation: "tournament_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_home_participant_id_fkey"
            columns: ["home_participant_id"]
            isOneToOne: false
            referencedRelation: "tournament_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_winner_participant_id_fkey"
            columns: ["winner_participant_id"]
            isOneToOne: false
            referencedRelation: "tournament_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_participants: {
        Row: {
          coins_awarded: number
          created_at: string
          eliminated_round: number | null
          id: string
          placement: string | null
          rewarded_at: string | null
          seed: number | null
          tournament_id: string
          updated_at: string
          user_id: string
          wins: number
          xp_awarded: number
        }
        Insert: {
          coins_awarded?: number
          created_at?: string
          eliminated_round?: number | null
          id?: string
          placement?: string | null
          rewarded_at?: string | null
          seed?: number | null
          tournament_id: string
          updated_at?: string
          user_id: string
          wins?: number
          xp_awarded?: number
        }
        Update: {
          coins_awarded?: number
          created_at?: string
          eliminated_round?: number | null
          id?: string
          placement?: string | null
          rewarded_at?: string | null
          seed?: number | null
          tournament_id?: string
          updated_at?: string
          user_id?: string
          wins?: number
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          bracket_size: number | null
          champion_user_id: string | null
          coins_champion: number
          coins_per_win: number
          coins_runner_up: number
          created_at: string
          created_by: string | null
          description: string | null
          finished_at: string | null
          id: string
          max_participants: number
          registration_closes_at: string | null
          registration_opens_at: string
          rounds: number | null
          runner_up_user_id: string | null
          started_at: string | null
          status: string
          title: string
          updated_at: string
          xp_champion: number
          xp_per_win: number
          xp_runner_up: number
        }
        Insert: {
          bracket_size?: number | null
          champion_user_id?: string | null
          coins_champion?: number
          coins_per_win?: number
          coins_runner_up?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          finished_at?: string | null
          id?: string
          max_participants?: number
          registration_closes_at?: string | null
          registration_opens_at?: string
          rounds?: number | null
          runner_up_user_id?: string | null
          started_at?: string | null
          status?: string
          title: string
          updated_at?: string
          xp_champion?: number
          xp_per_win?: number
          xp_runner_up?: number
        }
        Update: {
          bracket_size?: number | null
          champion_user_id?: string | null
          coins_champion?: number
          coins_per_win?: number
          coins_runner_up?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          finished_at?: string | null
          id?: string
          max_participants?: number
          registration_closes_at?: string | null
          registration_opens_at?: string
          rounds?: number | null
          runner_up_user_id?: string | null
          started_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          xp_champion?: number
          xp_per_win?: number
          xp_runner_up?: number
        }
        Relationships: []
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
          certificate_code: string
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
          verification_hash: string | null
        }
        Insert: {
          certificate_code?: string
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
          verification_hash?: string | null
        }
        Update: {
          certificate_code?: string
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
          verification_hash?: string | null
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
          revoked_at: string | null
          revoked_reason: string | null
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
          revoked_at?: string | null
          revoked_reason?: string | null
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
          revoked_at?: string | null
          revoked_reason?: string | null
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
      answer_lightning_question: {
        Args: { p_answer: boolean; p_idx: number; p_session_id: string }
        Returns: Json
      }
      apply_campaign_import: { Args: { _import_id: string }; Returns: Json }
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
      assign_engagement_questions: {
        Args: { p_cycle_id?: string }
        Returns: {
          answer_format: Database["public"]["Enums"]["engagement_answer_format"]
          answered_at: string
          assignment_id: string
          code: string
          factor_id: string
          helper_text: string
          options: Json
          order_index: number
          pillar: Database["public"]["Enums"]["climate_pillar"]
          question_id: string
          question_text: string
        }[]
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
      auto_lock_prediction_markets: { Args: never; Returns: number }
      auto_promote_expired_webhook_secrets: { Args: never; Returns: Json }
      award_campaign_team_split: {
        Args: { _campaign_id: string }
        Returns: Json
      }
      bingo_metric_value: {
        Args: { p_from: string; p_key: string; p_to: string; p_user: string }
        Returns: number
      }
      bulk_rotate_webhook_secrets: {
        Args: { p_grace_hours?: number; p_rotations: Json }
        Returns: Json
      }
      calculate_enps_score: { Args: { p_survey_id: string }; Returns: number }
      can_handle_opinion: {
        Args: { _opinion_id: string; _user_id: string }
        Returns: boolean
      }
      cancel_auction: { Args: { p_auction_id: string }; Returns: Json }
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
      chi_square_critical: {
        Args: { p_alpha: number; p_df: number }
        Returns: number
      }
      claim_push_outbox: {
        Args: { p_limit?: number }
        Returns: {
          attempts: number
          data: Json
          id: string
          message: string
          title: string
          type: string
          url: string
          user_id: string
        }[]
      }
      cleanup_expired_challenges: { Args: never; Returns: undefined }
      cleanup_expired_idempotency_keys: { Args: never; Returns: undefined }
      cleanup_old_security_logs:
        | { Args: never; Returns: undefined }
        | { Args: { p_days_to_keep?: number }; Returns: Json }
      close_auction: { Args: { p_auction_id: string }; Returns: Json }
      close_expired_auctions: { Args: never; Returns: number }
      close_expired_sales_campaigns: {
        Args: never
        Returns: {
          campaign_id: string
          participants_notified: number
        }[]
      }
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
      create_auction_draft: {
        Args: {
          p_description: string
          p_ends_at: string
          p_min_increment: number
          p_reward_id?: string
          p_starting_bid: number
          p_starts_at: string
          p_title: string
        }
        Returns: Json
      }
      create_prediction_market: {
        Args: {
          p_description: string
          p_locks_at: string
          p_max_stake_per_user: number
          p_min_stake: number
          p_options: string[]
          p_rake_bps: number
          p_resolves_at?: string
          p_title: string
        }
        Returns: Json
      }
      engagement_min_respondents: { Args: never; Returns: number }
      enqueue_push: {
        Args: {
          p_data?: Json
          p_dedupe_key: string
          p_message: string
          p_title: string
          p_type: string
          p_url?: string
          p_user_id: string
        }
        Returns: boolean
      }
      erf_inverse: { Args: { x: number }; Returns: number }
      finish_lightning_round: { Args: { p_session_id: string }; Returns: Json }
      generate_action_plan_from_factor: {
        Args: {
          p_days?: number
          p_department_id?: string
          p_factor_key: string
        }
        Returns: string
      }
      generate_action_plan_from_nr1_category: {
        Args: {
          p_category_key: string
          p_days?: number
          p_department_id?: string
        }
        Returns: string
      }
      generate_action_plan_from_opinion: {
        Args: { p_opinion_id: string }
        Returns: string
      }
      generate_certificate_code: { Args: never; Returns: string }
      generate_engagement_snapshot: {
        Args: { p_department_id?: string; p_period_type?: string }
        Returns: string
      }
      generate_executive_monthly_report: {
        Args: { p_month?: number; p_year?: number }
        Returns: Json
      }
      get_2fa_status: {
        Args: { p_user_id: string }
        Returns: {
          is_enabled: boolean
          verified_at: string
        }[]
      }
      get_account_devices: {
        Args: never
        Returns: {
          browser: string
          created_at: string
          device_key: string
          device_label: string
          device_type: string
          disabled_at: string
          disabled_reason: string
          endpoint: string
          failure_count: number
          fingerprint: string
          is_trusted: boolean
          last_seen_at: string
          last_used_at: string
          os: string
          push_active: boolean
          subscription_id: string
          user_agent: string
        }[]
      }
      get_active_engagement_cycle: {
        Args: never
        Returns: {
          created_at: string
          created_by: string | null
          department_id: string | null
          ends_at: string
          id: string
          questions_per_user: number
          starts_at: string
          status: Database["public"]["Enums"]["engagement_cycle_status"]
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "engagement_cycles"
          isOneToOne: true
          isSetofReturn: false
        }
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
      get_auction_summary: { Args: { p_auction_id: string }; Returns: Json }
      get_burn_rate: {
        Args: { _minutes: number; _slo?: number }
        Returns: Json
      }
      get_department_metrics: { Args: never; Returns: Json }
      get_department_war_feed: {
        Args: { p_limit?: number; p_war_id: string }
        Returns: Json
      }
      get_department_war_standings: {
        Args: { p_war_id: string }
        Returns: Json
      }
      get_engagement_cycle_progress: {
        Args: { p_cycle_id: string }
        Returns: {
          answered: number
          pending: number
          total: number
        }[]
      }
      get_engagement_factor_scores: {
        Args: { p_days?: number; p_department_id?: string }
        Returns: {
          factor_id: string
          factor_key: string
          factor_name: string
          favorability: number
          pillar: Database["public"]["Enums"]["climate_pillar"]
          respondents: number
          score: number
        }[]
      }
      get_engagement_nps: {
        Args: { p_days?: number; p_department_id?: string }
        Returns: {
          detractors: number
          metric: string
          passives: number
          promoters: number
          respondents: number
          score: number
        }[]
      }
      get_engagement_nps_history: {
        Args: { p_bucket?: string; p_department_id?: string; p_months?: number }
        Returns: {
          detractors: number
          metric: string
          passives: number
          period_start: string
          promoters: number
          respondents: number
          score: number
        }[]
      }
      get_engagement_overview: {
        Args: { p_days?: number; p_department_id?: string }
        Returns: {
          answer_count: number
          eligible_users: number
          overall_favorability: number
          overall_score: number
          participation_rate: number
          respondents: number
        }[]
      }
      get_engagement_pillar_benchmark: {
        Args: {
          p_company_size?: string
          p_days?: number
          p_department_id?: string
          p_industry?: string
          p_region?: string
        }
        Returns: {
          benchmark_average: number
          benchmark_company_size: string
          benchmark_industry: string
          benchmark_sample_size: number
          benchmark_top_10: number
          benchmark_top_quartile: number
          favorability: number
          pillar: Database["public"]["Enums"]["climate_pillar"]
          respondents: number
          score: number
        }[]
      }
      get_engagement_pillar_correlations: {
        Args: { p_days?: number }
        Returns: {
          correlation: number
          pillar_a: Database["public"]["Enums"]["climate_pillar"]
          pillar_b: Database["public"]["Enums"]["climate_pillar"]
          sample_size: number
        }[]
      }
      get_engagement_pillar_scores: {
        Args: { p_days?: number; p_department_id?: string }
        Returns: {
          answer_count: number
          favorability: number
          pillar: Database["public"]["Enums"]["climate_pillar"]
          respondents: number
          score: number
        }[]
      }
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
      get_lucky_wheel_status: { Args: never; Returns: Json }
      get_monthly_trends: { Args: never; Returns: Json }
      get_nine_box_distribution: {
        Args: { p_department_id?: string; p_period?: string }
        Returns: Json
      }
      get_nr1_risk_matrix: {
        Args: { p_days?: number; p_department_id?: string }
        Returns: {
          category_id: string
          category_key: string
          category_name: string
          description: string
          factors_evaluated: number
          legal_reference: string
          probability: number
          respondents: number
          risk_grade: number
          risk_level: string
          score: number
          severity_weight: number
        }[]
      }
      get_nr1_summary: {
        Args: { p_days?: number; p_department_id?: string }
        Returns: {
          avg_risk_grade: number
          categories_evaluated: number
          critical_count: number
          high_count: number
          low_count: number
          max_risk_grade: number
          moderate_count: number
        }[]
      }
      get_opinion_feed: {
        Args: { p_limit?: number; p_scope?: string; p_status?: string }
        Returns: {
          can_handle: boolean
          category: string
          content: string
          created_at: string
          department_name: string
          id: string
          is_anonymous: boolean
          recipient_type: string
          response_count: number
          sender_id: string
          sender_name: string
          status: string
          subject: string
          support_count: number
          updated_at: string
          urgency: string
          viewer_supported: boolean
        }[]
      }
      get_or_create_bingo_card: { Args: { p_board_id?: string }; Returns: Json }
      get_passkeys_by_email: {
        Args: { p_email: string }
        Returns: {
          credential_id: string
          user_id: string
        }[]
      }
      get_push_outbox_health: { Args: { p_hours?: number }; Returns: Json }
      get_push_outbox_health_trend: {
        Args: { p_hours?: number }
        Returns: {
          avg_score: number
          bucket: string
          critical_count: number
          max_failed: number
          max_pending: number
          min_score: number
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
      get_tournament_bracket: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      get_user_department_id: { Args: { p_user_id: string }; Returns: string }
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
      grant_scratch_card: {
        Args: { p_source: string; p_source_ref?: string }
        Returns: Json
      }
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
      increment_push_failures: { Args: { _ids: string[] }; Returns: undefined }
      ingest_war_event: {
        Args: {
          p_amount: number
          p_dedupe_key: string
          p_metric_key: string
          p_user_id: string
        }
        Returns: number
      }
      is_country_allowed: { Args: { p_country_code: string }; Returns: boolean }
      is_department_manager: {
        Args: { _department_id: string; _user_id: string }
        Returns: boolean
      }
      is_ip_blocked: { Args: { p_ip_address: unknown }; Returns: boolean }
      is_ip_whitelisted: { Args: { p_ip_address: unknown }; Returns: boolean }
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      join_tournament: { Args: { p_tournament_id: string }; Returns: Json }
      list_tournaments: { Args: never; Returns: Json }
      log_auction_admin_event: {
        Args: { p_action: string; p_auction_id: string; p_details?: Json }
        Returns: undefined
      }
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
      place_auction_bid: {
        Args: { p_amount: number; p_auction_id: string; p_dedupe_key?: string }
        Returns: Json
      }
      place_prediction_stake: {
        Args: {
          p_amount: number
          p_dedupe_key?: string
          p_market_id: string
          p_option_id: string
        }
        Returns: Json
      }
      process_external_task: {
        Args: { p_external_task_id: string }
        Returns: Json
      }
      promote_webhook_secret: {
        Args: { p_subscription_id: string }
        Returns: Json
      }
      publish_auction: { Args: { p_auction_id: string }; Returns: Json }
      raise_lucky_wheel_window_alerts: {
        Args: {
          p_coins_per_spin_budget?: number
          p_end_date?: string
          p_max_volume_drop?: number
          p_min_cost_increase?: number
          p_min_days?: number
          p_min_spins?: number
          p_window_days?: number
        }
        Returns: number
      }
      recalc_campaign_progress: {
        Args: { _campaign_id: string }
        Returns: undefined
      }
      recalc_campaign_teams: {
        Args: { _campaign_id: string }
        Returns: undefined
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
      register_war_contribution: {
        Args: {
          p_amount: number
          p_dedupe_key: string
          p_metric_key: string
          p_war_id: string
        }
        Returns: Json
      }
      reject_password_reset: {
        Args: { p_notes?: string; p_request_id: string }
        Returns: Json
      }
      report_tournament_match: {
        Args: { p_away_score: number; p_home_score: number; p_match_id: string }
        Returns: Json
      }
      request_password_reset: { Args: { p_user_id: string }; Returns: string }
      requeue_push_outbox: {
        Args: { p_ids?: string[]; p_include_stuck?: boolean }
        Returns: number
      }
      reset_login_attempts: { Args: { p_email: string }; Returns: undefined }
      reset_push_failures: { Args: { _ids: string[] }; Returns: undefined }
      respond_to_opinion: {
        Args: {
          p_content: string
          p_is_internal?: boolean
          p_opinion_id: string
          p_status?: string
        }
        Returns: string
      }
      reveal_scratch_card: { Args: { p_card_id: string }; Returns: Json }
      revert_campaign_import: { Args: { _import_id: string }; Returns: Json }
      revert_campaign_team_split: {
        Args: { _batch_id: string; _reason?: string }
        Returns: Json
      }
      review_purchase: {
        Args: { p_action: string; p_purchase_id: string; p_reason?: string }
        Returns: Json
      }
      revoke_device_by_fingerprint: {
        Args: { p_fingerprint: string; p_reason?: string }
        Returns: {
          revoked: boolean
          subscriptions_revoked: number
        }[]
      }
      revoke_push_device: {
        Args: { p_reason?: string; p_subscription_id: string }
        Returns: {
          device_label: string
          revoked: boolean
        }[]
      }
      rotate_webhook_secret: {
        Args: {
          p_grace_hours?: number
          p_new_secret: string
          p_subscription_id: string
        }
        Returns: Json
      }
      set_opinion_status: {
        Args: { p_opinion_id: string; p_status: string }
        Returns: undefined
      }
      settle_auction: { Args: { p_auction_id: string }; Returns: Json }
      settle_department_war: { Args: { p_war_id: string }; Returns: Json }
      settle_prediction_market: {
        Args: { p_market_id: string; p_winning_option_id?: string }
        Returns: Json
      }
      settle_tournament_rewards: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      snapshot_lucky_wheel_payout: { Args: { p_date?: string }; Returns: Json }
      snapshot_push_outbox_health: { Args: never; Returns: string }
      spin_lucky_wheel: { Args: { p_dedupe_key?: string }; Returns: Json }
      start_lightning_round: { Args: never; Returns: Json }
      start_tournament: { Args: { p_tournament_id: string }; Returns: Json }
      submit_engagement_answer: {
        Args: {
          p_cycle_id: string
          p_normalized_score?: number
          p_question_id: string
          p_raw_value: Json
          p_text_answer?: string
        }
        Returns: string
      }
      sync_bingo_card: { Args: { p_card_id: string }; Returns: Json }
      sync_department_war_headcount: {
        Args: { p_war_id: string }
        Returns: Json
      }
      toggle_opinion_support: {
        Args: { p_opinion_id: string }
        Returns: {
          support_count: number
          supported: boolean
        }[]
      }
      tournament_place_winner: {
        Args: {
          p_round: number
          p_slot: number
          p_tournament_id: string
          p_winner: string
        }
        Returns: undefined
      }
      tournament_propagate_byes: {
        Args: { p_tournament_id: string }
        Returns: undefined
      }
      tournament_seed_order: { Args: { p_size: number }; Returns: number[] }
      transition_prediction_market: {
        Args: { p_action: string; p_market_id: string }
        Returns: Json
      }
      update_certification_statuses: { Args: never; Returns: undefined }
      user_has_passkeys: { Args: { p_user_id: string }; Returns: boolean }
      user_wants_email_notification: {
        Args: { _type: string; _user_id: string }
        Returns: boolean
      }
      user_wants_in_app_notification: {
        Args: { _type: string; _user_id: string }
        Returns: boolean
      }
      user_wants_push_notification: {
        Args: { _type: string; _user_id: string }
        Returns: boolean
      }
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
      verify_certificate: {
        Args: { _code: string }
        Returns: {
          certificate_code: string
          certification_category: string
          certification_name: string
          expires_at: string
          holder_name: string
          is_valid: boolean
          issued_at: string
          status: string
          verification_hash: string
        }[]
      }
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
      engagement_answer_format:
        | "slider"
        | "stars"
        | "emoji"
        | "cards"
        | "checkbox"
        | "percentage"
        | "text"
      engagement_cycle_status: "scheduled" | "active" | "closed"
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
      engagement_answer_format: [
        "slider",
        "stars",
        "emoji",
        "cards",
        "checkbox",
        "percentage",
        "text",
      ],
      engagement_cycle_status: ["scheduled", "active", "closed"],
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
