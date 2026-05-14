import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onboardingService } from '../../services/onboardingService';
import { supabase } from '../../integrations/supabase/client';

const mockMaybeSingle = vi.fn();
const mockEq = vi.fn().mockReturnThis();

vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: mockMaybeSingle
        })
      }),
      update: () => ({
        eq: mockEq
      })
    })),
  },
}));

describe('onboardingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('completeStep', () => {
    it('should return true on success', async () => {
      const userId = 'u1';
      const stepId = 'welcome';
      const mockProgress = { user_id: userId, completed_steps: [], current_step: 0 };
      
      mockMaybeSingle.mockResolvedValueOnce({ data: mockProgress, error: null });
      mockEq.mockResolvedValueOnce({ error: null });

      const result = await onboardingService.completeStep(userId, stepId);
      expect(result).toBe(true);
    });
  });

  describe('isOnboardingComplete', () => {
    it('should return true if completed_at is set', () => {
      expect(onboardingService.isOnboardingComplete({ completed_at: '2023-01-01' } as any)).toBe(true);
      expect(onboardingService.isOnboardingComplete({ completed_at: null } as any)).toBe(false);
    });
  });
});
