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

export const DashboardLeftColumn = memo(function DashboardLeftColumn() {
  return (
    <StaggeredContainer
      className="lg:col-span-2 space-y-6 md:space-y-8"
      staggerDelay={0.15}
      initialDelay={0.2}
      data-tour="missions"
    >
      <StaggeredItemLeft>
        <LuckyDropTrigger />
      </StaggeredItemLeft>

      <StaggeredItemLeft>
        <SectionErrorBoundary sectionName="Celebrações">
          <CelebrationsBanner />
        </SectionErrorBoundary>
      </StaggeredItemLeft>

      <StaggeredItemLeft>
        <SectionErrorBoundary sectionName="Bônus Diário">
          <DailyLoginBonus />
        </SectionErrorBoundary>
      </StaggeredItemLeft>

      <StaggeredItemLeft>
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <SectionErrorBoundary sectionName="Micro Quests">
            <MicroQuestsList />
          </SectionErrorBoundary>
          <SectionErrorBoundary sectionName="Power-Ups">
            <PowerUps />
          </SectionErrorBoundary>
        </div>
      </StaggeredItemLeft>

      <StaggeredItemLeft>
        <SectionErrorBoundary sectionName="Desafios Semanais">
          <AutoChallengesWidget />
        </SectionErrorBoundary>
      </StaggeredItemLeft>

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

      <StaggeredItemLeft>
        <SectionErrorBoundary sectionName="Feed Social">
          <SocialFeed limit={10} />
        </SectionErrorBoundary>
      </StaggeredItemLeft>

      <StaggeredItemLeft>
        <SectionErrorBoundary sectionName="Anúncios">
          <AnnouncementsBoard />
        </SectionErrorBoundary>
      </StaggeredItemLeft>

      <StaggeredItemLeft>
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <SectionErrorBoundary sectionName="Metas & OKRs">
            <GoalsWidget />
          </SectionErrorBoundary>
          <SectionErrorBoundary sectionName="Pulse Survey">
            <PulseSurveyWidget />
          </SectionErrorBoundary>
        </div>
      </StaggeredItemLeft>

      <StaggeredItemLeft>
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <LazyWidget fallbackHeight="200px">
            <SectionErrorBoundary sectionName="Reconhecimento">
              <PeerRecognitionLazy />
            </SectionErrorBoundary>
          </LazyWidget>
          <LazyWidget fallbackHeight="200px">
            <SectionErrorBoundary sectionName="Duelos">
              <TeamChallengesLazy />
            </SectionErrorBoundary>
          </LazyWidget>
        </div>
      </StaggeredItemLeft>

      <StaggeredItemLeft>
        <SectionErrorBoundary sectionName="Desafios em Equipe">
          <TeamChallengesNew />
        </SectionErrorBoundary>
      </StaggeredItemLeft>
    </StaggeredContainer>
  );
});
