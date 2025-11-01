import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../config/api';
import { TokenManager } from '../services/TokenManager';

interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
  actor?: number;
  actor_name?: string;
}

interface UseNotificationPollingOptions {
  enabled?: boolean;
  websocketConnected?: boolean; // Disable polling when WebSocket is connected
  onNewNotifications?: (notifications: Notification[]) => void;
  onError?: (error: any) => void;
}

export const useNotificationPolling = ({
  enabled = true,
  websocketConnected = false,
  onNewNotifications,
  onError
}: UseNotificationPollingOptions = {}) => {
  const [isPolling, setIsPolling] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use refs to avoid infinite loops
  const intervalRef = useRef<number | null>(null);
  const lastFetchRef = useRef<Date>(new Date());
  const isActiveRef = useRef(true);
  const lastActivityRef = useRef<Date>(new Date());
  const isVisibleRef = useRef(true);

  // Get auth token via TokenManager
  const getAuthToken = useCallback(() => {
    return TokenManager.getToken();
  }, []);

  // Track user activity
  const trackActivity = useCallback(() => {
    lastActivityRef.current = new Date();
    isActiveRef.current = true;
  }, []);

  // Check if user is active (interacted in last 30 seconds)
  const isUserActive = useCallback(() => {
    const now = new Date();
    const timeSinceActivity = now.getTime() - lastActivityRef.current.getTime();
    return timeSinceActivity < 30000;
  }, []);

  // Get current polling interval
  const getCurrentInterval = useCallback(() => {
    // Simplified for debugging - always use 5 seconds
    return 5000; // 5 seconds for debugging
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      console.log('🔔 No auth token, skipping notification poll');
      return;
    }

    try {
      const since = lastFetchRef.current.toISOString();
      const response = await fetch(`${API_BASE_URL}/ai/notifications/?since=${since}`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const notifications = data.results || data.notifications || data || [];

      console.log('🔔 Polling response:', { data, notifications });

      if (notifications.length > 0) {
        console.log(`🔔 Polling: Found ${notifications.length} new notifications:`, notifications);
        onNewNotifications?.(notifications);
        setLastUpdate(new Date());
      } else {
        console.log('🔔 Polling: No new notifications');
      }

      // Update last fetch time
      lastFetchRef.current = new Date();
      setError(null);
    } catch (err: any) {
      console.error('🔔 Notification polling error:', err);
      setError(err.message || 'Failed to fetch notifications');
      onError?.(err);
    }
  }, [getAuthToken, onNewNotifications, onError]);

  // Poll function - stable callback with no dependencies
  const poll = useCallback(() => {
    // Disable polling if WebSocket is connected (avoid duplicates)
    if (!enabled || !isVisibleRef.current || websocketConnected) {
      if (websocketConnected) {
        console.log('🔔 Polling disabled: WebSocket is connected');
      }
      return;
    }

    fetchNotifications();
  }, [enabled, websocketConnected, fetchNotifications]);

  // Start polling
  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // console.log('🔔 Starting notification polling');
    setIsPolling(true);

    // Initial fetch
    poll();

    // Set up interval
    const currentInterval = getCurrentInterval();
    intervalRef.current = setInterval(poll, currentInterval);
  }, [poll, getCurrentInterval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // console.log('🔔 Stopped notification polling');
    setIsPolling(false);
  }, []);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      if (enabled) {
        if (isVisibleRef.current) {
          // console.log('🔔 Tab visible, resuming notification polling');
          startPolling();
        } else {
          // console.log('🔔 Tab hidden, pausing notification polling');
          stopPolling();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, startPolling, stopPolling]);

  // Track user activity
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const trackActivity = () => {
      lastActivityRef.current = new Date();
      isActiveRef.current = true;
    };

    events.forEach(event => {
      document.addEventListener(event, trackActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackActivity, true);
      });
    };
  }, []);

  // Start/stop polling based on enabled state and WebSocket connection
  useEffect(() => {
    // Don't poll if WebSocket is connected
    if (enabled && !websocketConnected) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, websocketConnected, startPolling, stopPolling]);

  // Manual refresh function
  const refresh = useCallback(() => {
    if (enabled) {
      console.log('🔔 Manual notification refresh');
      fetchNotifications();
    }
  }, [enabled, fetchNotifications]);

  return {
    isPolling,
    lastUpdate,
    error,
    refresh,
    startPolling,
    stopPolling
  };
};
