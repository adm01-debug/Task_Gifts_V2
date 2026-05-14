import { describe, it, expect, vi, beforeEach } from 'vitest';
import { feedbackService } from '../../services/feedbackService';
import { supabase } from '../../integrations/supabase/client';

const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockUpdate = vi.fn().mockReturnThis();
const mockInsert = vi.fn().mockReturnThis();
const mockSingle = vi.fn();

vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      eq: mockEq,
      update: mockUpdate,
      insert: mockInsert,
      single: mockSingle,
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
    },
  },
}));

describe('feedbackService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitFeedback', () => {
    it('should update request status and insert response', async () => {
      const requestId = 'r1';
      const answers = { 'q1': 'Good' };
      
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValueOnce({ error: null }); // update status
      
      mockInsert.mockReturnValue({ select: vi.fn().mockReturnThis(), single: mockSingle });
      mockSingle.mockResolvedValueOnce({ data: { id: 'resp1', request_id: requestId, answers }, error: null });

      const result = await feedbackService.submitFeedback(requestId, answers);
      
      expect(result.id).toBe('resp1');
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'submitted' });
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ request_id: requestId, answers }));
    });
  });
});
