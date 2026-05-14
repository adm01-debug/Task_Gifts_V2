 import { supabase } from "@/integrations/supabase/client";
 import { logger } from "@/services/loggingService";

export interface AICoachMessage {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export const aiCoachService = {
   async getMessages(userId: string, limit = 50): Promise<AICoachMessage[]> {
     try {
       const { data, error } = await supabase
         .from("ai_coach_messages")
         .select("*")
         .eq("user_id", userId)
         .order("created_at", { ascending: true })
         .limit(limit);
 
       if (error) throw error;
       return (data || []) as AICoachMessage[];
     } catch (error) {
       logger.apiError("getMessages", error, "AICoachService");
       return [];
     }
   },

   async saveMessage(userId: string, role: "user" | "assistant", content: string): Promise<AICoachMessage | null> {
     try {
       const { data, error } = await supabase
         .from("ai_coach_messages")
         .insert({ user_id: userId, role, content })
         .select()
         .single();
 
       if (error) throw error;
       return data as AICoachMessage;
     } catch (error) {
       logger.apiError("saveMessage", error, "AICoachService");
       return null;
     }
   },

  async clearHistory(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from("ai_coach_messages")
      .delete()
      .eq("user_id", userId);

    if (error) {
      return false;
    }

    return true;
  },
};
