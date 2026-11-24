import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shopService } from '../../services/shopService';
import { supabase } from '../../integrations/supabase/client';

const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockMaybeSingle = vi.fn();
const mockUpdate = vi.fn().mockReturnThis();
const mockInsert = vi.fn().mockReturnThis();
const mockRpc = vi.hoisted(() => vi.fn());

vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      eq: mockEq,
      maybeSingle: mockMaybeSingle,
      update: mockUpdate,
      insert: mockInsert,
    })),
    rpc: mockRpc,
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
    it('should throw error if item is out of stock', async () => {
      const mockReward = { id: 'r1', name: 'Cool Item', price_coins: 100, stock: 0 };
      mockMaybeSingle.mockResolvedValueOnce({ data: mockReward, error: null });

      await expect(shopService.purchaseReward('u1', 'r1')).rejects.toThrow('Estoque insuficiente');
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('should throw error if spend_coins fails (insufficient coins)', async () => {
      const mockReward = { id: 'r1', name: 'Cool Item', price_coins: 100, stock: 10 };
      mockMaybeSingle.mockResolvedValueOnce({ data: mockReward, error: null });
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'coins insuficientes' },
      });

      await expect(shopService.purchaseReward('u1', 'r1')).rejects.toThrow('Moedas insuficientes');
      expect(mockRpc).toHaveBeenCalledWith('spend_coins', {
        p_user_id: 'u1',
        p_amount: 100,
      });
    });

    it('should complete purchase successfully if coins and stock are available', async () => {
      const mockReward = { id: 'r1', name: 'Cool Item', price_coins: 100, stock: 10 };
      const mockPurchase = { id: 'p1', user_id: 'u1', reward_id: 'r1', total_coins: 100 };

      mockMaybeSingle.mockResolvedValueOnce({ data: mockReward, error: null }); // Reward
      mockRpc.mockResolvedValue({ data: [{ id: 'u1', coins: 100 }], error: null }); // spend_coins
      mockMaybeSingle.mockResolvedValueOnce({ data: mockPurchase, error: null }); // Insert Purchase Result

      const result = await shopService.purchaseReward('u1', 'r1');

      expect(result).toEqual(mockPurchase);
      expect(mockRpc).toHaveBeenCalledWith('spend_coins', {
        p_user_id: 'u1',
        p_amount: 100,
      });
    });

    it('identifica cada compra no payload da notificação (duas compras do mesmo prêmio não colidem)', async () => {
      const { notificationsService } = await import('../../services/notificationsService');
      const create = vi.mocked(notificationsService.create);

      const mockReward = { id: 'r1', name: 'Cool Item', price_coins: 100, stock: 10 };
      mockMaybeSingle
        .mockResolvedValueOnce({ data: mockReward, error: null })
        .mockResolvedValueOnce({ data: { id: 'p1', user_id: 'u1', reward_id: 'r1', total_coins: 100 }, error: null })
        .mockResolvedValueOnce({ data: mockReward, error: null })
        .mockResolvedValueOnce({ data: { id: 'p2', user_id: 'u1', reward_id: 'r1', total_coins: 100 }, error: null });
      mockRpc.mockResolvedValue({ data: [{ id: 'u1', coins: 100 }], error: null });

      await shopService.purchaseReward('u1', 'r1');
      await shopService.purchaseReward('u1', 'r1');

      expect(create).toHaveBeenCalledTimes(2);
      const payloads = create.mock.calls.map(([arg]) => (arg as { data: Record<string, unknown> }).data);
      expect(payloads[0].purchase_id).toBe('p1');
      expect(payloads[1].purchase_id).toBe('p2');
      expect(JSON.stringify(payloads[0])).not.toBe(JSON.stringify(payloads[1]));
    });
  });
});