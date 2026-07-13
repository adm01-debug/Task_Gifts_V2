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

  describe('getComboTier — tier logic (pure)', () => {
    it('returns Normal tier when actionsCount = 0', () => {
      expect(comboService.getComboTier(0).multiplier).toBe(1.0);
    });

    it('returns correct tier at each threshold boundary', () => {
      expect(comboService.getComboTier(2).multiplier).toBe(1.0);
      expect(comboService.getComboTier(3).multiplier).toBe(1.5);
      expect(comboService.getComboTier(4).multiplier).toBe(1.5);
      expect(comboService.getComboTier(5).multiplier).toBe(2.0);
      expect(comboService.getComboTier(7).multiplier).toBe(2.0);
      expect(comboService.getComboTier(8).multiplier).toBe(2.5);
      expect(comboService.getComboTier(11).multiplier).toBe(2.5);
      expect(comboService.getComboTier(12).multiplier).toBe(3.0);
      expect(comboService.getComboTier(9999).multiplier).toBe(3.0);
    });

    it('handles negative inputs defensively (falls back to lowest tier)', () => {
      expect(comboService.getComboTier(-1).multiplier).toBe(1.0);
    });

    it('has monotonically increasing thresholds and multipliers', () => {
      for (let i = 1; i < COMBO_TIERS.length; i++) {
        expect(COMBO_TIERS[i].minActions).toBeGreaterThan(COMBO_TIERS[i - 1].minActions);
        expect(COMBO_TIERS[i].multiplier).toBeGreaterThan(COMBO_TIERS[i - 1].multiplier);
      }
    });
  });

  describe('getNextTier', () => {
    it('caps at the highest tier with no next tier', () => {
      expect(comboService.getNextTier(12)).toBeNull();
      expect(comboService.getNextTier(50)).toBeNull();
    });

    it('returns the immediate next tier when below max', () => {
      expect(comboService.getNextTier(0)?.multiplier).toBe(1.5);
      expect(comboService.getNextTier(3)?.multiplier).toBe(2.0);
      expect(comboService.getNextTier(5)?.multiplier).toBe(2.5);
      expect(comboService.getNextTier(8)?.multiplier).toBe(3.0);
    });
  });

  describe('bonus XP formula', () => {
    it('bonus = round(baseXp * (multiplier - 1))', () => {
      const baseXp = 100;
      const tier = comboService.getComboTier(5); // 2.0x
      const bonus = Math.round(baseXp * (tier.multiplier - 1));
      expect(bonus).toBe(100);
      expect(baseXp + bonus).toBe(200);
    });

    it('bonus XP is zero at Normal tier', () => {
      const tier = comboService.getComboTier(0);
      expect(Math.round(50 * (tier.multiplier - 1))).toBe(0);
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
