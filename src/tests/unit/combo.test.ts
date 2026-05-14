import { describe, it, expect, vi, beforeEach } from 'vitest';
import { comboService, COMBO_TIERS } from '../../services/comboService';
import { supabase } from '../../integrations/supabase/client';

const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockMaybeSingle = vi.fn();
const mockUpdate = vi.fn().mockReturnThis();
const mockInsert = vi.fn().mockReturnThis();
const mockSingle = vi.fn();

vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      eq: mockEq,
      maybeSingle: mockMaybeSingle,
      update: mockUpdate,
      insert: mockInsert,
      single: mockSingle,
    })),
  },
}));

describe('comboService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnThis();
    mockEq.mockReturnThis();
    mockInsert.mockReturnValue({ select: vi.fn().mockReturnThis(), single: mockSingle });
    mockUpdate.mockReturnValue({ eq: mockEq, select: vi.fn().mockReturnThis(), single: mockSingle });
  });

  describe('getComboTier', () => {
    it('should return the correct tier based on actions count', () => {
      expect(comboService.getComboTier(0).multiplier).toBe(1.0);
      expect(comboService.getComboTier(3).multiplier).toBe(1.5);
      expect(comboService.getComboTier(5).multiplier).toBe(2.0);
      expect(comboService.getComboTier(15).multiplier).toBe(3.0);
    });
  });

  describe('registerAction', () => {
    it('should correctly apply multiplier and detect tier up', async () => {
      const userId = 'u1';
      const baseXp = 100;
      // Current combo: 2 actions (tier 1.0)
      const mockCombo = { id: 'c1', actions_count: 2, current_multiplier: 1.0, total_bonus_xp: 0, max_multiplier_reached: 1.0 };
      
      mockMaybeSingle.mockResolvedValueOnce({ data: mockCombo, error: null });
      // Next state: 3 actions (tier 1.5)
      mockSingle.mockResolvedValueOnce({ 
        data: { ...mockCombo, actions_count: 3, current_multiplier: 1.5, total_bonus_xp: 50, max_multiplier_reached: 1.5 }, 
        error: null 
      });

      const result = await comboService.registerAction(userId, baseXp);

      expect(result.finalXp).toBe(150);
      expect(result.bonusXp).toBe(50);
      expect(result.tierUp).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
    });
  });
});
