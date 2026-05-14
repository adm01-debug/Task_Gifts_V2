import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationsService } from '../../services/notificationsService';
import { supabase } from '../../integrations/supabase/client';

const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockOrder = vi.fn().mockReturnThis();
const mockLimit = vi.fn().mockReturnThis();
const mockUpdate = vi.fn().mockReturnThis();
const mockInsert = vi.fn().mockReturnThis();
const mockSingle = vi.fn();

vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
      update: mockUpdate,
      insert: mockInsert,
      single: mockSingle,
    })),
  },
}));

describe('notificationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should insert a notification and return it', async () => {
      const mockNotif = { user_id: 'u1', title: 'Test', type: 'info' };
      const savedNotif = { ...mockNotif, id: 'n1', read: false, created_at: new Date().toISOString() };
      
      mockSingle.mockResolvedValue({ data: savedNotif, error: null });

      const result = await notificationsService.create(mockNotif);
      
      expect(result).toEqual(savedNotif);
      expect(mockInsert).toHaveBeenCalledWith(mockNotif);
    });
  });

  describe('markAsRead', () => {
    it('should update the notification status to read', async () => {
      mockUpdate.mockResolvedValue({ error: null });

      await notificationsService.markAsRead('n1');
      
      expect(mockUpdate).toHaveBeenCalledWith({ read: true });
      expect(mockEq).toHaveBeenCalledWith('id', 'n1');
    });
  });
});
