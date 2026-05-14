import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditService } from '../../services/auditService';
import { supabase } from '../../integrations/supabase/client';

const mockInsert = vi.fn().mockReturnThis();

vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: mockInsert,
    })),
  },
}));

describe('auditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('log', () => {
    it('should insert an audit log into the database', async () => {
      const auditData = {
        user_id: 'u1',
        action: 'user_login' as const,
        entity_type: 'auth',
      };

      await auditService.log(auditData);
      
      expect(mockInsert).toHaveBeenCalled();
      const firstCallArg = mockInsert.mock.calls[0][0];
      expect(firstCallArg.user_id).toBe('u1');
      expect(firstCallArg.action).toBe('user_login');
    });

    it('should silently handle errors', async () => {
      mockInsert.mockImplementation(() => { throw new Error('DB Error'); });
      
      // Should not throw
      await expect(auditService.log({ user_id: 'u1', action: 'user_login' as const, entity_type: 'auth' }))
        .resolves.not.toThrow();
    });
  });
});
