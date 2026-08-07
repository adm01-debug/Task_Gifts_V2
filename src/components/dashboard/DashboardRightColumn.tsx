import { memo } from "react";
import { WeeklyChallengeCard } from "@/components/WeeklyChallengeCard";
import { ComboIndicator } from "@/components/ComboIndicator";
import { ComboHistory } from "@/components/ComboHistory";
import { WeeklyPerformanceComparison } from "@/components/WeeklyPerformanceComparison";
import { AttendanceModule } from "@/components/AttendanceModule";
import DepartmentRankings from "@/components/DepartmentRankings";
import { LiveLeaderboard } from "@/components/LiveLeaderboard";
import { KudosRanking } from "@/components/KudosRanking";
import { AnalyticsWidget } from "@/components/AnalyticsWidget";
import { RewardsShop } from "@/components/RewardsShop";
import { LeagueCard } from "@/components/LeagueCard";
import { ActivityHeatmap, useActivityHeatmapData } from "@/components/ActivityHeatmap";
import { MoodTrackerWidget } from "@/components/MoodTrackerWidget";
import { ENPSSurveyWidget } from "@/components/ENPSSurveyWidget";
import { StaggeredContainer, StaggeredItemRight } from "@/components/StaggeredContainer";
import { LazyWidget } from "./LazyWidget";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { StreakTracker } from "@/components/ui/streak-tracker";
import { DailyChallengesWidget } from "@/components/ui/daily-challenges";
import { WeeklyGoalsTracker } from "@/components/ui/weekly-goals-tracker";

/**
 * DashboardRightColumn - Contains secondary content widgets
 * Combo, Attendance, Rankings, Leaderboard, Kudos, Analytics & Rewards
 * + League Card, Activity Heatmap, Mood Tracker
 * Uses LazyWidget for below-the-fold content to improve performance
 * Each widget is wrapped with SectionErrorBoundary for fault isolation
 */
export const DashboardRightColumn = memo(function DashboardRightColumn() {
  const activityData = useActivityHeatmapData();
  
  return (
    <StaggeredContainer
      className="space-y-6 md:space-y-8"
      staggerDelay={0.12}
      initialDelay={0.3}
      data-tour="leaderboard"
    >
      {/* Streak Tracker - High priority gamification */}
      <StaggeredItemRight>
        <SectionErrorBoundary sectionName="Streak Tracker">
          <div data-tour="streak-tracker">
            <StreakTracker />
          </div>
        </SectionErrorBoundary>
      </StaggeredItemRight>

      {/* Daily Challenges - Gamification priority */}
      <StaggeredItemRight>
        <SectionErrorBoundary sectionName="Desafios Diários">
          <div data-tour="daily-challenges">
            <DailyChallengesWidget />
          </div>
        </SectionErrorBoundary>
      </StaggeredItemRight>

      {/* Weekly Goals Tracker - New gamification widget */}
      <StaggeredItemRight>
        <SectionErrorBoundary sectionName="Metas Semanais">
          <WeeklyGoalsTracker />
        </SectionErrorBoundary>
      </StaggeredItemRight>

      {/* League Card - Gamification priority */}
      <StaggeredItemRight>
        <SectionErrorBoundary sectionName="Liga">
          <LeagueCard />
        </SectionErrorBoundary>
      </StaggeredItemRight>

      {/* Weekly Challenge - Above the fold priority */}
      <StaggeredItemRight>
        <SectionErrorBoundary sectionName="Desafio Semanal">
          <WeeklyChallengeCard />
        </SectionErrorBoundary>
      </StaggeredItemRight>

      {/* Mood Tracker Widget */}
      <StaggeredItemRight>
        <SectionErrorBoundary sectionName="Humor do Dia">
          <MoodTrackerWidget />
        </SectionErrorBoundary>
      </StaggeredItemRight>

      {/* eNPS Survey Widget - High visibility for active surveys */}
      <StaggeredItemRight>
        <SectionErrorBoundary sectionName="Pesquisa eNPS">
          <ENPSSurveyWidget />
        </SectionErrorBoundary>
      </StaggeredItemRight>

      {/* Combo Indicator - Core gamification, render immediately */}
      <StaggeredItemRight>
        <SectionErrorBoundary sectionName="Combo">
          <ComboIndicator variant="full" />
        </SectionErrorBoundary>
      </StaggeredItemRight>

      {/* Combo History - Can be lazy */}
      <StaggeredItemRight>
        <LazyWidget fallbackHeight="160px" variant="list">
          <SectionErrorBoundary sectionName="Histórico de Combo">
            <ComboHistory />
          </SectionErrorBoundary>
        </LazyWidget>
      </StaggeredItemRight>

      {/* Activity Heatmap */}
      <StaggeredItemRight>
        <LazyWidget fallbackHeight="200px" variant="chart">
          <SectionErrorBoundary sectionName="Mapa de Atividades">
            <ActivityHeatmap data={activityData} />
          </SectionErrorBoundary>
        </LazyWidget>
      </StaggeredItemRight>

      {/* Weekly Performance - Can be lazy */}
      <StaggeredItemRight>
        <LazyWidget fallbackHeight="200px" variant="chart">
          <SectionErrorBoundary sectionName="Comparativo Semanal">
            <WeeklyPerformanceComparison />
          </SectionErrorBoundary>
        </LazyWidget>
      </StaggeredItemRight>

      {/* Attendance Module - Important, render immediately */}
      <StaggeredItemRight>
        <SectionErrorBoundary sectionName="Ponto">
          <AttendanceModule />
        </SectionErrorBoundary>
      </StaggeredItemRight>

      {/* Department Rankings - Below the fold */}
      <StaggeredItemRight>
        <LazyWidget fallbackHeight="320px" variant="list">
          <SectionErrorBoundary sectionName="Rankings por Departamento">
            <DepartmentRankings />
          </SectionErrorBoundary>
        </LazyWidget>
      </StaggeredItemRight>

      {/* Live Leaderboard - Below the fold */}
      <StaggeredItemRight>
        <LazyWidget fallbackHeight="400px" variant="list">
          <SectionErrorBoundary sectionName="Leaderboard">
            <LiveLeaderboard />
          </SectionErrorBoundary>
        </LazyWidget>
      </StaggeredItemRight>

      {/* Kudos Ranking - Below the fold */}
      <StaggeredItemRight>
        <LazyWidget fallbackHeight="280px" variant="list">
          <SectionErrorBoundary sectionName="Ranking de Kudos">
            <KudosRanking />
          </SectionErrorBoundary>
        </LazyWidget>
      </StaggeredItemRight>

      {/* Analytics Widget - Below the fold */}
      <StaggeredItemRight>
        <LazyWidget fallbackHeight="320px" variant="chart">
          <SectionErrorBoundary sectionName="Analytics">
            <AnalyticsWidget />
          </SectionErrorBoundary>
        </LazyWidget>
      </StaggeredItemRight>

      {/* Rewards Shop - Bottom of page */}
      <StaggeredItemRight>
        <LazyWidget fallbackHeight="360px" variant="card">
          <SectionErrorBoundary sectionName="Loja de Recompensas">
            <RewardsShop />
          </SectionErrorBoundary>
        </LazyWidget>
      </StaggeredItemRight>
    </StaggeredContainer>
  );
});
