import { useState, useCallback, useEffect } from "react";
import { useAuth } from "./useAuth";
import { useCurrentProfile } from "./useProfiles";
import { useCompetencies } from "./useCompetencies";
import { usePublishedTrails, useUserEnrollments } from "./useTrails";
import { aiCoachService } from "@/services/aiCoachService";
import { logger } from "@/services/loggingService";
import { newRequestId } from "@/lib/requestId";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`;

export function useAICoach() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { data: profile } = useCurrentProfile();
  const { data: competencies } = useCompetencies(user?.id);
  const { data: trails } = usePublishedTrails();
  const { data: enrollments } = useUserEnrollments();

  // Load chat history on mount
  useEffect(() => {
    if (!user?.id) {
      setIsLoadingHistory(false);
      return;
    }

    const loadHistory = async () => {
      setIsLoadingHistory(true);
      const history = await aiCoachService.getMessages(user.id);
      if (history.length > 0) {
        setMessages(history.map(m => ({ role: m.role, content: m.content })));
      }
      setIsLoadingHistory(false);
    };

    loadHistory();
  }, [user?.id]);

  // Generate follow-up suggestions after assistant response
  const generateSuggestions = useCallback(async (conversationMessages: Message[]) => {
    if (conversationMessages.length < 2) return;
    
    try {
      const requestId = newRequestId();
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          "x-request-id": requestId,
        },
        body: JSON.stringify({ 
          messages: conversationMessages,
          generateSuggestions: true,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (e) {
      logger.warn("Failed to generate suggestions", e instanceof Error ? e.message : String(e));
    }
  }, []);

  const sendMessage = useCallback(async (input: string) => {
    if (!input.trim() || isLoading || !user?.id) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);
    setSuggestions([]); // Clear suggestions when sending new message

    // Save user message to database
    aiCoachService.saveMessage(user.id, "user", input);

    let assistantSoFar = "";

    const upsertAssistant = (nextChunk: string) => {
      assistantSoFar += nextChunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      // Build enriched trails data with enrollment status
      const availableTrails = trails?.map(trail => {
        const enrollment = enrollments?.find(e => e.trail_id === trail.id);
        return {
          id: trail.id,
          title: trail.title,
          description: trail.description,
          icon: trail.icon,
          estimated_hours: trail.estimated_hours,
          xp_reward: trail.xp_reward,
          enrolled: !!enrollment,
          completed: !!enrollment?.completed_at,
          progress: enrollment?.progress_percent || 0,
        };
      }) || [];

      const completedTrailsCount = enrollments?.filter(e => e.completed_at).length || 0;

      const userContext = profile ? {
        displayName: profile.display_name,
        level: profile.level,
        xp: profile.xp,
        coins: profile.coins,
        questsCompleted: profile.quests_completed,
        streak: profile.streak,
        competencies: competencies || [],
        availableTrails,
        completedTrailsCount,
      } : undefined;

      const requestId = newRequestId();
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          "x-request-id": requestId,
        },
        body: JSON.stringify({ 
          messages: [...messages, userMsg],
          userContext,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Erro ${resp.status} (req ${requestId})`);
      }

      if (!resp.body) throw new Error("Sem resposta do servidor");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }

      // Save assistant response to database after streaming completes
      if (assistantSoFar && user?.id) {
        aiCoachService.saveMessage(user.id, "assistant", assistantSoFar);
        
        // Generate follow-up suggestions
        const finalMessages: Message[] = [...messages, userMsg, { role: "assistant", content: assistantSoFar }];
        generateSuggestions(finalMessages);
      }
    } catch (e) {
      logger.apiError("sendMessage", e, "AI Coach");
      setError(e instanceof Error ? e.message : "Erro ao enviar mensagem");
      // Remove the user message if there was an error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, profile, competencies, trails, enrollments, user?.id, generateSuggestions]);

  const clearMessages = useCallback(async () => {
    if (user?.id) {
      await aiCoachService.clearHistory(user.id);
    }
    setMessages([]);
    setSuggestions([]);
    setError(null);
  }, [user?.id]);

  return {
    messages,
    suggestions,
    isLoading,
    isLoadingHistory,
    error,
    sendMessage,
    clearMessages,
  };
}
