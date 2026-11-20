import { describe, it, expect, vi, beforeEach } from 'vitest';
import { profilesService } from '../../services/profilesService';
import { supabase } from '../../integrations/supabase/client';

const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockOrder = vi.fn().mockReturnThis();
const mockLimit = vi.fn().mockReturnThis();
const mockUpdate = vi.fn().mockReturnThis();
const mockMaybeSingle = vi.fn();
const mockSingle = vi.fn();
const mockRpc = vi.hoisted(() => vi.fn());

vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
      update: mockUpdate,
      maybeSingle: mockMaybeSingle,
      single: mockSingle,
    })),
    rpc: mockRpc,
  },
}));

vi.mock('../../services/notificationsService', () => ({
  notificationsService: {
    notifyXpGain: vi.fn().mockResolvedValue({}),
    notifyLevelUp: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../services/auditService', () => ({
  auditService: {
    logXpGain: vi.fn().mockResolvedValue({}),
    logLevelUp: vi.fn().mockResolvedValue({}),
    logStreakUpdate: vi.fn().mockResolvedValue({}),
  },
}));

describe('profilesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getById', () => {
    it('should return profile data on success', async () => {
      const mockProfile = { id: '123', display_name: 'Test User' };
      mockMaybeSingle.mockResolvedValue({ data: mockProfile, error: null });

      const result = await profilesService.getById('123');
      expect(result).toEqual(mockProfile);
    });
  });

  describe('addXp', () => {
    it('should call add_xp RPC and report level up', async () => {
      const oldProfile = { id: '123', xp: 800, level: 1 };
      mockMaybeSingle.mockResolvedValue({ data: oldProfile, error: null });
      mockRpc.mockResolvedValue({ data: [{ id: '123', xp: 1100, level: 2 }], error: null });

      const result = await profilesService.addXp('123', 300, 'teste');

      expect(mockRpc).toHaveBeenCalledWith('add_xp', {
        p_user_id: '123',
        p_amount: 300,
        p_source: 'teste',
      });
      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBe(2);
      expect(result.profile.id).toBe('123');
      expect(result.profile.xp).toBe(1100);
      expect(result.profile.level).toBe(2);
    });

    it('should not level up if threshold not reached', async () => {
      const oldProfile = { id: '123', xp: 100, level: 1 };
      mockMaybeSingle.mockResolvedValue({ data: oldProfile, error: null });
      mockRpc.mockResolvedValue({ data: [{ id: '123', xp: 200, level: 1 }], error: null });

      const result = await profilesService.addXp('123', 100);

      expect(result.leveledUp).toBe(false);
      expect(result.newLevel).toBeUndefined();
    });
  });

  describe('addCoins', () => {
    it('should call add_coins RPC', async () => {
      mockRpc.mockResolvedValue({ data: [{ id: '123', coins: 15 }], error: null });

      const result = await profilesService.addCoins('123', 5);

      expect(mockRpc).toHaveBeenCalledWith('add_coins', {
        p_user_id: '123',
        p_amount: 5,
      });
      expect(result.id).toBe('123');
      expect(result.coins).toBe(15);
    });
  });

  describe('incrementStreak', () => {
    it('should call increment_streak RPC', async () => {
      mockRpc.mockResolvedValue({ data: [{ id: '123', streak: 3, best_streak: 5 }], error: null });

      const result = await profilesService.incrementStreak('123');

      expect(mockRpc).toHaveBeenCalledWith('increment_streak', { p_user_id: '123' });
      expect(result.id).toBe('123');
      expect(result.streak).toBe(3);
    });
  });
});
