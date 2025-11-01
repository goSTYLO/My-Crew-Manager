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
      if (!token) {
        console.log('🔔 Chat notification: No token found');
        return;
      }

      console.log('🔔 Chat notification: Fetching unread count from API...');
      const response = await fetch(`${API_BASE_URL}/chat/rooms/unread-count/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const newCount = typeof data.unread_count === 'number' ? Math.max(0, data.unread_count) : 0;
        console.log('🔔 Chat notification: API response - unread_count:', newCount);
        
        // Update the count - this will automatically hide the badge when count is 0
        // Use functional update to ensure consistency
        setUnreadCount(prevCount => {
          console.log(`🔄 API badge update: ${prevCount} → ${newCount}`);
          
          if (newCount === 0) {
            console.log('✅ Chat notification: All messages read - badge will be hidden');
          } else {
            console.log(`🔔 Badge count updated via API to: ${newCount}`);
          }
          
          return newCount;
        });
      } else {
        const errorText = await response.text();
        console.warn('⚠️ Failed to fetch chat unread count:', response.status, response.statusText, errorText);
        // Don't reset to 0 on error - keep current count to avoid flickering
      }
    } catch (error) {
      console.error('❌ Error fetching chat unread count:', error);
      // Don't reset to 0 on error - keep current count to avoid flickering
    }
  }, []);

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      console.log('🔔 Chat notification: No token, skipping WebSocket connection');
      return;
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const baseUrl = API_BASE_URL.replace(/^https?:/, wsProtocol).replace('/api', '');
    const wsUrl = `${baseUrl}/ws/chat/notifications/?token=${token}`;

    console.log('🔔 Chat notification: Connecting to WebSocket:', wsUrl);
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('✅ Chat notification WebSocket connected');
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('🔔 Chat notification WebSocket message received:', data);
        
        // Handle unread count updates from WebSocket (real-time badge update)
        if (data.type === 'unread_count_updated') {
          const newCount = typeof data.unread_count === 'number' ? Math.max(0, data.unread_count) : 0;
          console.log('🔔 Chat notification: Unread count updated via WebSocket:', newCount, 'room_id:', data.room_id);
          
          // WebSocket is authoritative for real-time updates across tabs
          // Use functional update to ensure consistency
          setUnreadCount(prevCount => {
            console.log(`🔄 WebSocket badge update: ${prevCount} → ${newCount}`);
            
            if (newCount === 0) {
              console.log('✅ All messages read - badge will be hidden');
            } else {
              console.log(`🔔 Badge count updated via WebSocket to: ${newCount}`);
            }
            
            return newCount;
          });
        } else if (data.type === 'new_message' || data.type === 'new_message_notification') {
          console.log('🔔 Chat notification: New message received, WebSocket will send unread_count_updated shortly');
          // Don't fetch immediately - wait for unread_count_updated from backend
          // The backend will send unread_count_updated after sending new_message_notification
        } else {
          console.log('🔔 Chat notification: Ignoring message type:', data.type);
        }
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('❌ Chat notification WebSocket error:', error);
    };

    wsRef.current.onclose = (event) => {
      console.log('🔌 Chat notification WebSocket disconnected:', event.code, event.reason);
      
      // Attempt to reconnect if connection was lost (not a normal close)
      // Code 1000 = normal closure, others are abnormal
      if (event.code !== 1000 && event.code !== 1001) {
        console.log('🔄 WebSocket closed abnormally, attempting to reconnect in 3 seconds...');
        setTimeout(() => {
          // Check if token still exists before reconnecting
          const token = sessionStorage.getItem('token');
          if (token && (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED)) {
            console.log('🔄 Reconnecting WebSocket...');
            // Re-trigger the connection setup (this will be handled by useEffect dependency)
            // For now, just fetch from API to ensure badge count is accurate
            fetchUnreadCount();
          }
        }, 3000);
      }
    };

    // Fetch initial count on mount
    fetchUnreadCount();

    return () => {
      if (wsRef.current) {
        console.log('🔔 Chat notification: Closing WebSocket connection');
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
      const handleChatOpened = () => {
        console.log('🔔 Chat opened, refreshing initial unread count from API...');
        // Refresh initial count when chat page opens
        fetchUnreadCount();
      };

      // Listen for immediate badge updates from mark_read API response
      // This ensures instant update even if WebSocket is slow
      const handleChatBadgeUpdate = (event: Event) => {
        const customEvent = event as CustomEvent;
        const unreadCount = customEvent.detail?.unread_count;
        if (unreadCount !== undefined && typeof unreadCount === 'number') {
          console.log('🔔 Chat badge updated via event (from API response):', unreadCount);
          // Immediately update badge from API response (synchronous update)
          // Use functional update to ensure we're using the latest value
          setUnreadCount(prevCount => {
            console.log(`🔄 Badge update: ${prevCount} → ${unreadCount}`);
            
            // Ensure count is never negative
            const newCount = Math.max(0, unreadCount);
            
            if (newCount === 0) {
              console.log('✅ All messages read - badge will be hidden');
            } else {
              console.log(`🔔 Badge count updated to: ${newCount}`);
            }
            
            return newCount;
          });
        } else {
          console.warn('⚠️ Invalid unread_count in chatBadgeUpdate event:', unreadCount);
        }
      };

      // Listen for badge refresh requests (fallback if direct update doesn't work)
      const handleChatBadgeRefresh = () => {
        console.log('🔔 Chat badge refresh requested - fetching from API...');
        // Use a small delay to ensure backend has updated the database
        setTimeout(() => {
          fetchUnreadCount();
        }, 200);
      };

      // Listen for chat room selection to immediately refresh badge
      // When user selects a chat, we should refresh the badge count
      const handleChatRoomSelected = () => {
        console.log('🔔 Chat room selected - refreshing badge count from API...');
        // Immediate refresh to ensure badge is accurate when chat is opened
        setTimeout(() => {
          fetchUnreadCount();
        }, 300);
      };

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
  const resetUnreadCount = () => {
    console.log('🔔 Resetting unread count to 0 (optimistic UI)');
    setUnreadCount(0);
  };

  return { unreadCount, resetUnreadCount, refreshCount: fetchUnreadCount };
};
