import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '../../services/loggingService';

describe('LoggingService', () => {
  beforeEach(() => {
    logger.clearLogs();
    vi.restoreAllMocks();
  });

  it('should store logs and keep them under max limit', () => {
    for (let i = 0; i < 110; i++) {
      logger.info(`Log ${i}`);
    }
    const logs = logger.getRecentLogs(200);
    expect(logs.length).toBe(100); // maxLogs is 100
    expect(logs[logs.length - 1].message).toBe('Log 109');
  });

  it('should format message with context correctly', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Note: info is only logged in Dev mode, but warn/error always log to console
    logger.warn('Careful!', 'Auth');
    expect(consoleSpy).toHaveBeenCalledWith('[Auth] Careful!', '');
  });
});
