import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { weeklyChallengesService, WeeklyChallenge } from "@/services/weeklyChallengesService";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { profilesService } from "@/services/profilesService";
import { notificationsService } from "@/services/notificationsService";

interface ChallengeWithProfiles extends WeeklyChallenge {
  challengerProfile: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    xp: number;
    level: number;
  } | null;
  opponentProfile: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    xp: number;
    level: number;
  } | null;
}

export interface VictoryData {
  opponentName: string;
  xpGained: number;
  opponentXpGained: number;
  xpReward: number;
  coinReward: number;
}

export function useWeeklyChallenge() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showVictory, setShowVictory] = useState(false);
  const [victoryData, setVictoryData] = useState<VictoryData | null>(null);

  const { data: challenge, isLoading, refetch } = useQuery({
    queryKey: ["weekly-challenge", user?.id],
    queryFn: async (): Promise<ChallengeWithProfiles | null> => {
      if (!user?.id) return null;

      let currentChallenge = await weeklyChallengesService.getCurrentChallenge(user.id);

      // If no challenge exists, create one automatically
      if (!currentChallenge) {
        const userProfile = await profilesService.getById(user.id);
        if (!userProfile) return null;

        // Find opponent
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, xp")
          .order("xp", { ascending: false });

        if (!profiles || profiles.length < 2) return null;

        const userRank = profiles.findIndex((p) => p.id === user.id) + 1;
        const opponent = await weeklyChallengesService.findOpponent(user.id, userRank);

        if (!opponent) return null;

        currentChallenge = await weeklyChallengesService.createChallenge(
          user.id,
          opponent.id,
          userProfile.xp,
          opponent.xp
        );

        // Notify both users
        await notificationsService.create({
          user_id: user.id,
          type: "challenge",
          title: "🎯 Novo Desafio Semanal!",
          message: "Um novo desafio semanal começou! Ganhe mais XP que seu oponente para vencer.",
        });

        await notificationsService.create({
          user_id: opponent.id,
          type: "challenge",
          title: "🎯 Novo Desafio Semanal!",
          message: "Você foi desafiado! Ganhe mais XP que seu oponente para vencer.",
        });
      }

      // Fetch profiles for both users
      const [challengerProfile, opponentProfile] = await Promise.all([
        profilesService.getById(currentChallenge.challenger_id),
        profilesService.getById(currentChallenge.opponent_id),
      ]);

      // Calculate current XP gained
      if (challengerProfile && opponentProfile) {
        const challengerXpGained = Math.max(0, challengerProfile.xp - currentChallenge.challenger_xp_start);
        const opponentXpGained = Math.max(0, opponentProfile.xp - currentChallenge.opponent_xp_start);

        // Update XP gained in database if changed
        if (challengerXpGained !== currentChallenge.challenger_xp_gained) {
          await weeklyChallengesService.updateXpGained(
            currentChallenge.id,
            currentChallenge.challenger_id,
            true,
            challengerXpGained
          );
          currentChallenge.challenger_xp_gained = challengerXpGained;
        }

        if (opponentXpGained !== currentChallenge.opponent_xp_gained) {
          await weeklyChallengesService.updateXpGained(
            currentChallenge.id,
            currentChallenge.opponent_id,
            false,
            opponentXpGained
          );
          currentChallenge.opponent_xp_gained = opponentXpGained;
        }
      }

      return {
        ...currentChallenge,
        challengerProfile,
        opponentProfile,
      };
    },
    enabled: !!user?.id,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("weekly-challenges-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "weekly_challenges",
          filter: `challenger_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["weekly-challenge"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "weekly_challenges",
          filter: `opponent_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["weekly-challenge"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Check for challenge completion and victory
  useEffect(() => {
    if (!challenge || !user?.id) return;

    const weekEnd = new Date(challenge.week_end);
    const now = new Date();
    
    // Check if challenge week has ended and hasn't been processed
    if (now > weekEnd && challenge.status === "active") {
      const isChallenger = user.id === challenge.challenger_id;
      const myXpGained = isChallenger ? challenge.challenger_xp_gained : challenge.opponent_xp_gained;
      const opponentXpGained = isChallenger ? challenge.opponent_xp_gained : challenge.challenger_xp_gained;
      const opponentProfile = isChallenger ? challenge.opponentProfile : challenge.challengerProfile;

      // Determine winner
      const iWon = myXpGained > opponentXpGained;
      const winnerId = myXpGained > opponentXpGained 
        ? (isChallenger ? challenge.challenger_id : challenge.opponent_id)
        : myXpGained < opponentXpGained
        ? (isChallenger ? challenge.opponent_id : challenge.challenger_id)
        : null; // Tie

      // Complete the challenge
      weeklyChallengesService.completeChallenge(challenge.id, winnerId);

      // Show victory celebration if user won
      if (iWon) {
        const victoryKey = `victory-shown-${challenge.id}`;
        if (!localStorage.getItem(victoryKey)) {
          setVictoryData({
            opponentName: opponentProfile?.display_name || "Oponente",
            xpGained: myXpGained,
            opponentXpGained: opponentXpGained,
            xpReward: challenge.xp_reward,
            coinReward: challenge.coin_reward,
          });
          setShowVictory(true);
          localStorage.setItem(victoryKey, "true");

          // Award rewards
          profilesService.addXp(user.id, challenge.xp_reward, "weekly_challenge_victory");
          profilesService.addCoins(user.id, challenge.coin_reward);

          // Send notification
          notificationsService.create({
            user_id: user.id,
            type: "victory",
            title: "🏆 Desafio Semanal Vencido!",
            message: `Você venceu ${opponentProfile?.display_name || "seu oponente"} e ganhou ${challenge.xp_reward} XP e ${challenge.coin_reward} moedas!`,
          });
        }
      }
    }
  }, [challenge, user?.id]);

  const closeVictory = useCallback(() => {
    setShowVictory(false);
    setVictoryData(null);
  }, []);

  const pastChallenges = useQuery({
    queryKey: ["past-challenges", user?.id],
    queryFn: () => weeklyChallengesService.getPastChallenges(user!.id),
    enabled: !!user?.id,
  });

  return {
    challenge,
    isLoading,
    refetch,
    pastChallenges: pastChallenges.data || [],
    isLoadingPast: pastChallenges.isLoading,
    showVictory,
    victoryData,
    closeVictory,
  };
}
