import { describe, it, expect, vi, beforeEach } from 'vitest';
import { kudosService } from '../../services/kudosService';
import { supabase } from '../../integrations/supabase/client';
import { comboService } from '../../services/comboService';
import { profilesService } from '../../services/profilesService';

const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockMaybeSingle = vi.fn();
const mockSingle = vi.fn();
const mockInsert = vi.fn().mockReturnThis();

vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      eq: mockEq,
      maybeSingle: mockMaybeSingle,
      insert: mockInsert,
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
    getById: vi.fn().mockResolvedValue({ display_name: 'Sender' }),
    addXp: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../services/notificationsService', () => ({
  notificationsService: {
    create: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../services/missionsService', () => ({
  missionsService: {
    incrementByMetricKey: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../services/achievementsService', () => ({
  achievementsService: {
    checkKudosGivenAchievements: vi.fn().mockResolvedValue({}),
    checkKudosReceivedAchievements: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../services/auditService', () => ({
  auditService: {
    logKudosGiven: vi.fn().mockResolvedValue({}),
    logKudosReceived: vi.fn().mockResolvedValue({}),
  },
}));

describe('kudosService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockReturnValue({ select: vi.fn().mockReturnThis(), single: mockSingle });
  });

  describe('giveKudos', () => {
    it('should award XP to recipient and register combo action', async () => {
      const fromId = 'u1';
      const toId = 'u2';
      const kudosInput = { from_user_id: fromId, to_user_id: toId, message: 'Great job!' };
      const mockSavedKudos = { id: 'k1', ...kudosInput };

      mockSingle.mockResolvedValueOnce({ data: mockSavedKudos, error: null });
      (comboService.registerAction as any).mockResolvedValue({ 
        finalXp: 30, bonusXp: 5, combo: { current_multiplier: 1.2 } 
      });

      const result = await kudosService.giveKudos(kudosInput);

      expect(comboService.registerAction).toHaveBeenCalledWith(toId, 25);
      expect(profilesService.addXp).toHaveBeenCalledWith(toId, 30, 'Kudos: Reconhecimento');
      expect(result.comboResult?.multiplier).toBe(1.2);
    });
  });
});
