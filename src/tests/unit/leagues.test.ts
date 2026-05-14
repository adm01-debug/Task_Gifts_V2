import { describe, it, expect, vi, beforeEach } from 'vitest';
import { leaguesService } from '../../services/leaguesService';
import { supabase } from '../../integrations/supabase/client';

const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockOrder = vi.fn().mockReturnThis();
const mockLimit = vi.fn().mockReturnThis();
const mockUpdate = vi.fn().mockReturnThis();
const mockInsert = vi.fn().mockReturnThis();
const mockMaybeSingle = vi.fn();
const mockSingle = vi.fn();

vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
      update: mockUpdate,
      insert: mockInsert,
      maybeSingle: mockMaybeSingle,
      single: mockSingle,
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
    },
  },
}));

describe('leaguesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockReturnValue({ select: vi.fn().mockReturnThis(), single: mockSingle });
    mockUpdate.mockReturnValue({ eq: mockEq });
  });

  describe('addWeeklyXP', () => {
    it('should update weekly XP if user league exists', async () => {
      mockMaybeSingle.mockResolvedValueOnce({ data: { weekly_xp: 100 }, error: null });
      mockEq.mockResolvedValueOnce({ error: null });

      await leaguesService.addWeeklyXP('u1', 50);
      
      expect(mockUpdate).toHaveBeenCalledWith({ weekly_xp: 150 });
    });

    it('should initialize league if user league does not exist', async () => {
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null }); // get weekly_xp
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'l1', tier: 1 }, error: null }); // initialize -> get bronze league
      mockSingle.mockResolvedValueOnce({ data: { id: 'ul1', weekly_xp: 0 }, error: null }); // initialize -> insert user_league

      // Mock recursive call success
      mockMaybeSingle.mockResolvedValueOnce({ data: { weekly_xp: 0 }, error: null });

      await leaguesService.addWeeklyXP('u1', 50);
      
      expect(mockInsert).toHaveBeenCalled();
    });
  });
});
