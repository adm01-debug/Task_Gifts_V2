import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkinsService } from '../../services/checkinsService';
import { supabase } from '../../integrations/supabase/client';

const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockMaybeSingle = vi.fn();
const mockUpdate = vi.fn().mockReturnThis();
const mockSingle = vi.fn();

vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      eq: mockEq,
      maybeSingle: mockMaybeSingle,
      update: mockUpdate,
      single: mockSingle,
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'm1' } }, error: null }),
    },
  },
}));

describe('checkinsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('toggleActionItem', () => {
    it('should flip completed status of the correct action item', async () => {
      const checkinId = 'c1';
      const actionItemId = 'a1';
      const mockActionItems = [
        { id: 'a1', text: 'Item 1', completed: false },
        { id: 'a2', text: 'Item 2', completed: false },
      ];

      mockMaybeSingle.mockResolvedValueOnce({ data: { action_items: mockActionItems }, error: null });
      mockSingle.mockResolvedValueOnce({ 
        data: { 
          id: checkinId, 
          action_items: [
            { id: 'a1', text: 'Item 1', completed: true },
            { id: 'a2', text: 'Item 2', completed: false },
          ] 
        }, 
        error: null 
      });

      const result = await checkinsService.toggleActionItem(checkinId, actionItemId);
      
      expect(result.action_items[0].completed).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        action_items: [
          { id: 'a1', text: 'Item 1', completed: true },
          { id: 'a2', text: 'Item 2', completed: false },
        ]
      });
    });
  });
});
