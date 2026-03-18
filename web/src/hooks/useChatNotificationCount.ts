import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';

export const useChatNotificationCount = () => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);
  const refreshTimeoutRef = useRef<number | null>(null);
  const secondRefreshTimeoutRef = useRef<number | null>(null);
  const thirdRefreshTimeoutRef = useRef<number | null>(null);
  
  // Helper to clear any pending refresh timeouts
  const clearRefreshTimeout = () => {
    if (refreshTimeoutRef.current !== null) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    if (secondRefreshTimeoutRef.current !== null) {
      clearTimeout(secondRefreshTimeoutRef.current);
      secondRefreshTimeoutRef.current = null;
    }
    if (thirdRefreshTimeoutRef.current !== null) {
      clearTimeout(thirdRefreshTimeoutRef.current);
      thirdRefreshTimeoutRef.current = null;
    }
  };

  // Fetch initial count (memoized with useCallback)
  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/chat/rooms/unread-count/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const newCount = typeof data.unread_count === 'number' ? Math.max(0, data.unread_count) : 0;
        setUnreadCount(newCount);
      }
    } catch {
      // Keep current count on error to avoid flickering
    }
  }, []);

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const baseUrl = API_BASE_URL.replace(/^https?:/, wsProtocol).replace('/api', '');
    const wsUrl = `${baseUrl}/ws/chat/notifications/?token=${token}`;

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'unread_count_updated') {
          const newCount = typeof data.unread_count === 'number' ? Math.max(0, data.unread_count) : 0;
          setUnreadCount(newCount);
        }
      } catch {
        // Ignore parse errors
      }
    };

    wsRef.current.onclose = (event) => {
      if (event.code !== 1000 && event.code !== 1001) {
        setTimeout(() => {
          const token = sessionStorage.getItem('token');
          if (token && (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED)) {
            fetchUnreadCount();
          }
        }, 3000);
      }
    };

    fetchUnreadCount();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [fetchUnreadCount]);

    // Listen for chat opened event to refresh initial count
    // WebSocket handles all real-time updates (unread_count_updated)
    useEffect(() => {
      // When chat page is opened, refresh count from API once
      // WebSocket will handle all subsequent updates
      const handleChatOpened = () => fetchUnreadCount();

      const handleChatBadgeUpdate = (event: Event) => {
        const customEvent = event as CustomEvent;
        const count = customEvent.detail?.unread_count;
        if (typeof count === 'number') {
          setUnreadCount(Math.max(0, count));
        }
      };

      const handleChatBadgeRefresh = () => setTimeout(() => fetchUnreadCount(), 200);
      const handleChatRoomSelected = () => setTimeout(() => fetchUnreadCount(), 300);

      window.addEventListener('chatOpened', handleChatOpened);
      window.addEventListener('chatBadgeUpdate', handleChatBadgeUpdate);
      window.addEventListener('chatBadgeRefresh', handleChatBadgeRefresh);
      window.addEventListener('chatRoomSelected', handleChatRoomSelected);
      
      return () => {
        window.removeEventListener('chatOpened', handleChatOpened);
        window.removeEventListener('chatBadgeUpdate', handleChatBadgeUpdate);
        window.removeEventListener('chatBadgeRefresh', handleChatBadgeRefresh);
        window.removeEventListener('chatRoomSelected', handleChatRoomSelected);
        clearRefreshTimeout();
      };
    }, [fetchUnreadCount]);

  // Function to reset count when user opens chat (optimistic UI update)
  const resetUnreadCount = () => setUnreadCount(0);

  return { unreadCount, resetUnreadCount, refreshCount: fetchUnreadCount };
};
