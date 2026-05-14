import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onboardingService } from '../../services/onboardingService';
import { supabase } from '../../integrations/supabase/client';

const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockMaybeSingle = vi.fn();
const mockUpdate = vi.fn().mockReturnThis();

vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      eq: mockEq,
      maybeSingle: mockMaybeSingle,
      update: mockUpdate,
    })),
  },
}));

describe('onboardingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ error: null });
  });

  describe('completeStep', () => {
    it('should add step to completed_steps and update database', async () => {
      const userId = 'u1';
      const stepId = 'welcome';
      const mockProgress = { user_id: userId, completed_steps: [], current_step: 0 };
      
      mockMaybeSingle.mockResolvedValueOnce({ data: mockProgress, error: null });

      const result = await onboardingService.completeStep(userId, stepId);
      
      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        completed_steps: [stepId]
      }));
    });
  });

  describe('isOnboardingComplete', () => {
    it('should return true if completed_at is set', () => {
      expect(onboardingService.isOnboardingComplete({ completed_at: '2023-01-01' } as any)).toBe(true);
      expect(onboardingService.isOnboardingComplete({ completed_at: null } as any)).toBe(false);
    });
  });
});
