import { describe, it, expect } from 'vitest';
import { BEHAVIORAL_BADGES } from '../../services/behavioralBadges/badges';
import { BehaviorMetrics } from '../../services/behavioralBadges/types';

const defaultMetrics: BehaviorMetrics = {
  userId: 'u1',
  feedbacksGiven: 0,
  feedbacksReceived: 0,
  checkinsCompleted: 0,
  consecutiveCheckinsWeeks: 0,
  pulsesResponded: 0,
  consecutivePulsesWeeks: 0,
  oneOnOnesAttended: 0,
  goalsCompleted: 0,
  goalsOnTrack: 0,
  totalGoals: 0,
  coursesCompleted: 0,
  pdiActionsCompleted: 0,
  socialPostsCreated: 0,
  socialReactionsGiven: 0,
  earlyCheckins: 0,
  lateNightActivity: 0,
  weekendActivity: 0,
  helpfulComments: 0,
  mentorSessions: 0,
};

describe('Behavioral Badges Conditions', () => {
  it('Feedback Champion Bronze condition should pass with 10 feedbacks', () => {
    const badge = BEHAVIORAL_BADGES.find(b => b.key === 'feedback_champion_bronze');
    expect(badge?.condition({ ...defaultMetrics, feedbacksGiven: 10 })).toBe(true);
    expect(badge?.condition({ ...defaultMetrics, feedbacksGiven: 9 })).toBe(false);
  });

  it('Check-in Regular condition should pass with 4 consecutive weeks', () => {
    const badge = BEHAVIORAL_BADGES.find(b => b.key === 'checkin_regular');
    expect(badge?.condition({ ...defaultMetrics, consecutiveCheckinsWeeks: 4 })).toBe(true);
    expect(badge?.condition({ ...defaultMetrics, consecutiveCheckinsWeeks: 3 })).toBe(false);
  });

  it('Goal Perfectionist should only pass if totalGoals > 0 and all are on track', () => {
    const badge = BEHAVIORAL_BADGES.find(b => b.key === 'goal_perfectionist');
    expect(badge?.condition({ ...defaultMetrics, totalGoals: 0, goalsOnTrack: 0 })).toBe(false);
    expect(badge?.condition({ ...defaultMetrics, totalGoals: 2, goalsOnTrack: 2 })).toBe(true);
    expect(badge?.condition({ ...defaultMetrics, totalGoals: 2, goalsOnTrack: 1 })).toBe(false);
  });
});
