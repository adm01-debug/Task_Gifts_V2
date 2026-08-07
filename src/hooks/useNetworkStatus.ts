import { useState, useEffect, useCallback, useRef } from "react";

interface NetworkStatus {
  /** Whether the device is online */
  isOnline: boolean;
  /** Whether a request is currently pending */
  isPending: boolean;
  /** Current connection type (if available) */
  connectionType: string | null;
  /** Effective connection type (4g, 3g, 2g, slow-2g) */
  effectiveType: string | null;
  /** Estimated downlink speed in Mbps */
  downlink: number | null;
  /** Whether connection is considered slow */
  isSlow: boolean;
  /** Round trip time in ms */
  rtt: number | null;
  /** Whether data saver is enabled */
  saveData: boolean;
}

interface NetworkConnection {
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (event: string, callback: () => void) => void;
  removeEventListener?: (event: string, callback: () => void) => void;
}

declare global {
  interface Navigator {
    connection?: NetworkConnection;
    mozConnection?: NetworkConnection;
    webkitConnection?: NetworkConnection;
  }
}

/**
 * useNetworkStatus - Hook for monitoring network status and connection quality
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [isPending, setIsPending] = useState(false);
  const pendingRequests = useRef(0);

  const getConnection = useCallback((): NetworkConnection | null => {
    if (typeof navigator === "undefined") return null;
    return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
  }, []);

  const [connectionInfo, setConnectionInfo] = useState<{
    connectionType: string | null;
    effectiveType: string | null;
    downlink: number | null;
    rtt: number | null;
    saveData: boolean;
  }>(() => {
    const connection = getConnection();
    return {
      connectionType: connection?.type || null,
      effectiveType: connection?.effectiveType || null,
      downlink: connection?.downlink || null,
      rtt: connection?.rtt || null,
      saveData: connection?.saveData || false,
    };
  });

  // Update connection info
  const updateConnectionInfo = useCallback(() => {
    const connection = getConnection();
    if (connection) {
      setConnectionInfo({
        connectionType: connection.type || null,
        effectiveType: connection.effectiveType || null,
        downlink: connection.downlink || null,
        rtt: connection.rtt || null,
        saveData: connection.saveData || false,
      });
    }
  }, [getConnection]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Monitor connection changes
  useEffect(() => {
    const connection = getConnection();
    if (!connection?.addEventListener) return;

    connection.addEventListener("change", updateConnectionInfo);

    return () => {
      connection.removeEventListener?.("change", updateConnectionInfo);
    };
  }, [getConnection, updateConnectionInfo]);

  // Monitor pending requests via fetch interception
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      pendingRequests.current++;
      setIsPending(true);

      try {
        const response = await originalFetch(...args);
        return response;
      } finally {
        pendingRequests.current--;
        if (pendingRequests.current === 0) {
          setIsPending(false);
        }
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Calculate if connection is slow
  const isSlow = 
    connectionInfo.effectiveType === "slow-2g" ||
    connectionInfo.effectiveType === "2g" ||
    (connectionInfo.rtt !== null && connectionInfo.rtt > 500) ||
    (connectionInfo.downlink !== null && connectionInfo.downlink < 0.5);

  return {
    isOnline,
    isPending,
    connectionType: connectionInfo.connectionType,
    effectiveType: connectionInfo.effectiveType,
    downlink: connectionInfo.downlink,
    rtt: connectionInfo.rtt,
    saveData: connectionInfo.saveData,
    isSlow,
  };
}

/**
 * NetworkStatusIndicator - Small indicator showing pending requests
 */
export function useNetworkPendingIndicator() {
  const { isPending, isSlow, isOnline } = useNetworkStatus();
  
  return {
    isPending,
    isSlow,
    isOnline,
    shouldShow: isPending || !isOnline || isSlow,
  };
}
