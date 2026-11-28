import { describe, it, expect, vi, beforeEach } from 'vitest';
import { achievementsService } from '../../services/achievementsService';
import { supabase } from '../../integrations/supabase/client';

const { mockRpc, mockSelect, mockEq, mockMaybeSingle, mockInsert } = vi.hoisted(() => ({
  mockRpc: vi.fn().mockResolvedValue({ error: null }),
  mockSelect: vi.fn().mockReturnThis(),
  mockEq: vi.fn().mockReturnThis(),
  mockMaybeSingle: vi.fn(),
  mockInsert: vi.fn().mockReturnThis(),
}));

vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      eq: mockEq,
      maybeSingle: mockMaybeSingle,
      insert: mockInsert,
      update: vi.fn(),
    })),
    rpc: mockRpc,
  },
}));

describe('achievementsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnThis();
    mockEq.mockReturnThis();
  });

  describe('unlockAchievement', () => {
    it('should award rewards and create notification if not already unlocked', async () => {
      const userId = 'u1';
      const achievementKey = 'test_ach';
      const mockAchievement = { id: 'a1', key: achievementKey, name: 'Test', xp_reward: 100, coin_reward: 50 };
      const mockProfile = { id: userId, xp: 0, coins: 0 };

      // hasAchievement check -> no data
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
      // get achievement details
      mockMaybeSingle.mockResolvedValueOnce({ data: mockAchievement, error: null });
      // get profile details
      mockMaybeSingle.mockResolvedValueOnce({ data: mockProfile, error: null });
      
      const result = await achievementsService.unlockAchievement(userId, achievementKey);
      
      expect(result.success).toBe(true);
      expect(mockInsert).toHaveBeenCalledTimes(2); // 1 for user_achievement, 1 for notification
            expect(mockRpc).toHaveBeenCalledWith("add_xp", {
              p_user_id: userId,
              p_kind: "achiev",
              p_source_id: achievementKey,
            });
            expect(mockRpc).toHaveBeenCalledWith("add_coins", {
              p_user_id: userId,
              p_kind: "achiev",
              p_source_id: achievementKey,
            });
    });

    it('should return alreadyUnlocked if already has it', async () => {
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'ua1' }, error: null });
      
      const result = await achievementsService.unlockAchievement('u1', 'test_ach');
      expect(result.alreadyUnlocked).toBe(true);
    });
  });
});
