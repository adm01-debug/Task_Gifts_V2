import { describe, it, expect, vi, beforeEach } from 'vitest';
import { leaguesService } from '../../services/leaguesService';
import { supabase } from '../../integrations/supabase/client';

const mockMaybeSingle = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn().mockReturnThis();
const mockSelect = vi.fn().mockReturnThis();
const mockInsert = vi.fn().mockReturnThis();
const mockUpdate = vi.fn().mockReturnThis();

vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: (...args: any[]) => {
        mockSelect(...args);
        return {
          eq: (...args2: any[]) => {
            mockEq(...args2);
            return {
              maybeSingle: mockMaybeSingle,
              single: mockSingle,
              update: mockUpdate,
              order: () => ({ limit: () => ({ maybeSingle: mockMaybeSingle }) })
            }
          },
          maybeSingle: mockMaybeSingle
        }
      },
      insert: (...args: any[]) => {
        mockInsert(...args);
        return {
          select: () => ({ single: mockSingle })
        }
      },
      update: (...args: any[]) => {
        mockUpdate(...args);
        return {
          eq: mockEq
        }
      }
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
    },
  },
}));

describe('leaguesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addWeeklyXP', () => {
    it('should update weekly XP if user league exists', async () => {
      mockMaybeSingle.mockResolvedValueOnce({ data: { weekly_xp: 100 }, error: null });
      mockUpdate.mockResolvedValueOnce({ error: null });

      await leaguesService.addWeeklyXP('u1', 50);
      
      expect(mockUpdate).toHaveBeenCalledWith({ weekly_xp: 150 });
    });
  });
});
