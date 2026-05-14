import { describe, it, expect, vi, beforeEach } from 'vitest';
import { profilesService } from '../../services/profilesService';
import { supabase } from '../../integrations/supabase/client';

vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
      single: vi.fn(),
    })),
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
      (supabase.from('profiles').maybeSingle as any).mockResolvedValue({ data: mockProfile, error: null });

      const result = await profilesService.getById('123');
      expect(result).toEqual(mockProfile);
    });
  });

  describe('addXp', () => {
    it('should correctly calculate level and level up', async () => {
      const mockProfile = { id: '123', xp: 800, level: 1 };
      (supabase.from('profiles').maybeSingle as any).mockResolvedValue({ data: mockProfile, error: null });
      (supabase.from('profiles').single as any).mockResolvedValue({ data: { ...mockProfile, xp: 1100, level: 2 }, error: null });

      const result = await profilesService.addXp('123', 300);
      
      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBe(2);
    });

    it('should not level up if threshold not reached', async () => {
      const mockProfile = { id: '123', xp: 100, level: 1 };
      (supabase.from('profiles').maybeSingle as any).mockResolvedValue({ data: mockProfile, error: null });
      (supabase.from('profiles').single as any).mockResolvedValue({ data: { ...mockProfile, xp: 200, level: 1 }, error: null });

      const result = await profilesService.addXp('123', 100);
      
      expect(result.leveledUp).toBe(false);
    });
  });
});
