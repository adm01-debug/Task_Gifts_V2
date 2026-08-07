import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shopService } from '../../services/shopService';
import { supabase } from '../../integrations/supabase/client';
import { profilesService } from '../../services/profilesService';

const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockMaybeSingle = vi.fn();
const mockUpdate = vi.fn().mockReturnThis();
const mockInsert = vi.fn().mockReturnThis();

vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      eq: mockEq,
      maybeSingle: mockMaybeSingle,
      update: mockUpdate,
      insert: mockInsert,
    })),
  },
}));

vi.mock('../../services/profilesService', () => ({
  profilesService: {
    getById: vi.fn(),
  },
}));

vi.mock('../../services/notificationsService', () => ({
  notificationsService: {
    create: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../services/auditService', () => ({
  auditService: {
    log: vi.fn().mockResolvedValue({}),
  },
}));

describe('shopService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('purchaseReward', () => {
    it('should throw error if user has insufficient coins', async () => {
      const mockReward = { id: 'r1', name: 'Cool Item', price_coins: 100, stock: 10 };
      const mockProfile = { id: 'u1', coins: 50 };

      mockMaybeSingle.mockResolvedValueOnce({ data: mockReward, error: null });
      (profilesService.getById as any).mockResolvedValue(mockProfile);

      await expect(shopService.purchaseReward('u1', 'r1'))
        .rejects.toThrow('Moedas insuficientes');
    });

    it('should throw error if item is out of stock', async () => {
      const mockReward = { id: 'r1', name: 'Cool Item', price_coins: 100, stock: 0 };
      mockMaybeSingle.mockResolvedValueOnce({ data: mockReward, error: null });

      await expect(shopService.purchaseReward('u1', 'r1'))
        .rejects.toThrow('Estoque insuficiente');
    });

    it('should complete purchase successfully if coins and stock are available', async () => {
      const mockReward = { id: 'r1', name: 'Cool Item', price_coins: 100, stock: 10 };
      const mockProfile = { id: 'u1', coins: 200 };
      const mockPurchase = { id: 'p1', user_id: 'u1', reward_id: 'r1', total_coins: 100 };

      mockMaybeSingle.mockResolvedValueOnce({ data: mockReward, error: null }); // Reward
      (profilesService.getById as any).mockResolvedValue(mockProfile);
      mockMaybeSingle.mockResolvedValueOnce({ data: mockPurchase, error: null }); // Insert Purchase Result

      const result = await shopService.purchaseReward('u1', 'r1');

      expect(result).toEqual(mockPurchase);
      expect(mockUpdate).toHaveBeenCalled();
    });
  });
});
