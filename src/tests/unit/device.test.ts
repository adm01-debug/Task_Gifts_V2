import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import { renderHook } from '@testing-library/react';

describe('useDeviceDetection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateFingerprint', () => {
    it('should generate a consistent fingerprint string', () => {
      const { result } = renderHook(() => useDeviceDetection());
      const info1 = result.current.generateFingerprint();
      const info2 = result.current.generateFingerprint();
      
      expect(info1.fingerprint).toBe(info2.fingerprint);
      expect(typeof info1.fingerprint).toBe('string');
      expect(info1.fingerprint.length).toBeGreaterThan(0);
    });

    it('should correctly identify browser and OS from user agent', () => {
      // Mock navigator.userAgent
      const originalUA = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        configurable: true
      });

      const { result } = renderHook(() => useDeviceDetection());
      const info = result.current.generateFingerprint();
      
      expect(info.browser).toBe('Chrome');
      expect(info.os).toBe('Windows');
      expect(info.deviceType).toBe('desktop');

      // Cleanup
      Object.defineProperty(navigator, 'userAgent', { value: originalUA });
    });
  });
});
