 export interface BehaviorMetrics {
   userId: string;
   feedbacksGiven: number;
   feedbacksReceived: number;
   checkinsCompleted: number;
   consecutiveCheckinsWeeks: number;
   pulsesResponded: number;
   consecutivePulsesWeeks: number;
   oneOnOnesAttended: number;
   goalsCompleted: number;
   goalsOnTrack: number;
   totalGoals: number;
   coursesCompleted: number;
   pdiActionsCompleted: number;
   socialPostsCreated: number;
   socialReactionsGiven: number;
   earlyCheckins: number;
   lateNightActivity: number;
   weekendActivity: number;
   helpfulComments: number;
   mentorSessions: number;
   checkinsInCurrentMonth?: number;
   oneOnOnesInCurrentMonth?: number;
   aiCoachInteractions?: number;
 }
 
 export interface BehavioralBadge {
   key: string;
   name: string;
   description: string;
   icon: string;
   category: string;
   rarity: 'common' | 'rare' | 'epic' | 'legendary';
   xpReward: number;
   coinReward: number;
   condition: (metrics: BehaviorMetrics) => boolean;
 }