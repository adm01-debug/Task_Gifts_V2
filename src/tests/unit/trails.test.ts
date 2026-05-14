import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trailsService } from '../../services/trailsService';
import { supabase } from '../../integrations/supabase/client';
import { comboService } from '../../services/comboService';
import { profilesService } from '../../services/profilesService';

const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockSingle = vi.fn();
const mockUpdate = vi.fn().mockReturnThis();

vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      eq: mockEq,
      update: mockUpdate,
      single: mockSingle,
    })),
  },
}));

vi.mock('../../services/comboService', () => ({
  comboService: {
    registerAction: vi.fn(),
  },
}));

vi.mock('../../services/profilesService', () => ({
  profilesService: {
    addXp: vi.fn(),
  },
}));

vi.mock('../../services/missionsService', () => ({
  missionsService: {
    incrementByMetricKey: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../services/achievementsService', () => ({
  achievementsService: {
    checkTrailAchievements: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../services/auditService', () => ({
  auditService: {
    log: vi.fn().mockResolvedValue({}),
  },
}));

describe('trailsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('completeModule', () => {
    it('should register action in comboService and add XP to profile', async () => {
      const userId = 'u1';
      const moduleId = 'm1';
      const xpReward = 100;

      mockSingle.mockResolvedValueOnce({ data: { id: 'p1', completed_at: new Date().toISOString() }, error: null });
      (comboService.registerAction as any).mockResolvedValue({ finalXp: 150, bonusXp: 50, combo: { current_multiplier: 1.5 } });

      const result = await trailsService.completeModule(userId, moduleId, undefined, xpReward);

      expect(comboService.registerAction).toHaveBeenCalledWith(userId, xpReward);
      expect(profilesService.addXp).toHaveBeenCalledWith(userId, 150, 'module_completed');
      expect(result.comboResult.multiplier).toBe(1.5);
    });
  });
});
