import { memo } from "react";
import { SocialFeed } from "@/components/SocialFeed";
 import { DepartmentMissionsLazy } from "@/components/DepartmentMissions";
 import { DailyQuestsLazy } from "@/components/DailyQuests";
 import { PeerRecognitionLazy } from "@/components/PeerRecognition";
 import { TeamChallengesLazy } from "@/components/TeamChallenges";
import { GoalsWidget } from "@/components/GoalsWidget";
import { CelebrationsBanner } from "@/components/CelebrationsBanner";
import { PulseSurveyWidget } from "@/components/PulseSurveyWidget";
import { AnnouncementsBoard } from "@/components/AnnouncementsBoard";
import { AutoChallengesWidget } from "@/components/AutoChallengesWidget";
import { StaggeredContainer, StaggeredItemLeft } from "@/components/StaggeredContainer";
import { LazyWidget } from "./LazyWidget";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { MicroQuestsList } from "@/components/ui/micro-quest-card";
import { LuckyDropTrigger } from "@/components/ui/lucky-drop";
import { DailyLoginBonus } from "@/components/ui/daily-login-bonus";
import { PowerUps } from "@/components/ui/power-ups";
import { TeamChallenges as TeamChallengesNew } from "@/components/ui/team-challenges";

/**
 * DashboardLeftColumn - Contains primary content widgets
 * Missions, Quests, Team & Recognition + Goals, Mood, Celebrations, Surveys, Announcements
 * Each widget is wrapped with SectionErrorBoundary for fault isolation
 */
export const DashboardLeftColumn = memo(function DashboardLeftColumn() {
  return (
    <StaggeredContainer 
      className="lg:col-span-2 space-y-4 md:space-y-6"
      staggerDelay={0.12}
      initialDelay={0.1}
      data-tour="missions"
    >
      {/* Lucky Drop Trigger - Gamification surprise */}
      <StaggeredItemLeft>
        <LuckyDropTrigger />
      </StaggeredItemLeft>

      {/* Celebrations Banner - Priority */}
      <StaggeredItemLeft>
        <SectionErrorBoundary sectionName="Celebrações">
          <CelebrationsBanner />
        </SectionErrorBoundary>
      </StaggeredItemLeft>

      {/* Micro Quests - Quick 2-5 min tasks */}
      <StaggeredItemLeft>
        <SectionErrorBoundary sectionName="Micro Quests">
          <MicroQuestsList />
        </SectionErrorBoundary>
      </StaggeredItemLeft>

      {/* Daily Login Bonus */}
      <StaggeredItemLeft>
        <SectionErrorBoundary sectionName="Bônus Diário">
          <DailyLoginBonus />
        </SectionErrorBoundary>
      </StaggeredItemLeft>

      {/* Power-Ups */}
      <StaggeredItemLeft>
        <SectionErrorBoundary sectionName="Power-Ups">
          <PowerUps />
        </SectionErrorBoundary>
      </StaggeredItemLeft>

      {/* Team Challenges - New */}
      <StaggeredItemLeft>
        <SectionErrorBoundary sectionName="Desafios em Equipe">
          <TeamChallengesNew />
        </SectionErrorBoundary>
      </StaggeredItemLeft>

      {/* Auto Challenges Widget - Gamified weekly challenges */}
      <StaggeredItemLeft>
        <SectionErrorBoundary sectionName="Desafios Semanais">
          <AutoChallengesWidget />
        </SectionErrorBoundary>
      </StaggeredItemLeft>

      {/* Social Feed - Above the fold, render immediately */}
      <StaggeredItemLeft>
        <SectionErrorBoundary sectionName="Feed Social">
          <SocialFeed limit={20} />
        </SectionErrorBoundary>
      </StaggeredItemLeft>

      {/* Goals Widget - OKRs overview */}
      <StaggeredItemLeft>
        <SectionErrorBoundary sectionName="Metas & OKRs">
          <GoalsWidget />
        </SectionErrorBoundary>
      </StaggeredItemLeft>

      {/* Pulse Survey Widget */}
      <StaggeredItemLeft>
        <LazyWidget fallbackHeight="200px">
          <SectionErrorBoundary sectionName="Pulse Survey">
            <PulseSurveyWidget />
          </SectionErrorBoundary>
        </LazyWidget>
      </StaggeredItemLeft>

       {/* Main Quests and Missions Group */}
       <StaggeredItemLeft>
         <div className="grid md:grid-cols-2 gap-4 md:gap-6">
           <SectionErrorBoundary sectionName="Quests Diárias">
             <DailyQuestsLazy />
           </SectionErrorBoundary>
           <SectionErrorBoundary sectionName="Missões do Departamento">
             <DepartmentMissionsLazy />
           </SectionErrorBoundary>
         </div>
       </StaggeredItemLeft>
 
       {/* Announcements Board - Reduced prominence if many read */}
       <StaggeredItemLeft>
         <SectionErrorBoundary sectionName="Anúncios">
           <AnnouncementsBoard />
         </SectionErrorBoundary>
       </StaggeredItemLeft>
 
       {/* Peer Recognition and Team Challenges Group */}
       <StaggeredItemLeft>
         <div className="grid md:grid-cols-2 gap-4 md:gap-6">
           <LazyWidget fallbackHeight="280px">
             <SectionErrorBoundary sectionName="Reconhecimento">
               <PeerRecognitionLazy />
             </SectionErrorBoundary>
           </LazyWidget>
           <LazyWidget fallbackHeight="240px">
             <SectionErrorBoundary sectionName="Desafios em Equipe">
               <TeamChallengesLazy />
             </SectionErrorBoundary>
           </LazyWidget>
         </div>
       </StaggeredItemLeft>
    </StaggeredContainer>
  );
});
