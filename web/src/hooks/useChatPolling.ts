import { useCallback, useEffect, useRef, useState } from 'react';

interface Message {
  message_id: number;
  room_id: number;
  sender_id: number;
  sender_username: string;
  content: string;
  message_type: string;
  reply_to_id: number | null;
  created_at: string;
  edited_at: string | null;
  is_deleted: boolean;
}

interface Room {
  room_id: number;
  name: string | null;
  is_private: boolean;
  created_by_id: number;
  created_at: string;
  members_count: number;
}

interface UseChatPollingOptions {
  roomId?: string;
  enabled?: boolean;
  onNewMessages?: (messages: Message[]) => void;
  onRoomUpdate?: (rooms: Room[]) => void;
  onError?: (error: any) => void;
}

export const useChatPolling = ({
  roomId,
  enabled = true,
  onNewMessages,
  onRoomUpdate,
  onError
}: UseChatPollingOptions = {}) => {
  const [isPolling, setIsPolling] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [totalMessages, setTotalMessages] = useState(0);

  // Use refs to avoid infinite loops
  const intervalRef = useRef<number | null>(null);
  const lastMessageIdRef = useRef<number | null>(null);
  const isActiveRef = useRef(true);
  const lastActivityRef = useRef<Date>(new Date());
  const isVisibleRef = useRef(true);
  const offsetRef = useRef(0);

  // Get auth token
  const getAuthToken = useCallback(() => {
    return sessionStorage.getItem('token') || sessionStorage.getItem('access');
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
    const isVisible = isVisibleRef.current;
    const isActive = isUserActive();
    
    let interval;
    if (!isVisible) {
      interval = 30000; // 30 seconds when tab hidden
    } else if (isActive) {
      interval = 2000; // 2 seconds when active
    } else {
      interval = 15000; // 15 seconds when idle
    }
    
    const timestamp = new Date().toLocaleTimeString();
    console.log(`⏱️ [${timestamp}] 💬 INTERVAL: ${interval}ms (${interval/1000}s) - visible=${isVisible}, active=${isActive}`);
    
    return interval;
  }, []);

  // Fetch messages for a specific room
  const fetchMessages = useCallback(async (roomId: string, afterId?: number) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`📡 [${timestamp}] 💬 FETCHING MESSAGES: room ${roomId}, afterId: ${afterId}`);
    
    const token = getAuthToken();
    if (!token) {
      console.log(`📡 [${timestamp}] 💬 FETCH SKIPPED: no auth token`);
      return;
    }

    try {
      let url = `/api/chat/rooms/${roomId}/messages/?limit=50`;
      
      if (afterId) {
        url += `&after_id=${afterId}`;
      } else {
        url += `&offset=${offsetRef.current}`;
      }
      
      console.log(`📡 [${timestamp}] 💬 API REQUEST: ${url}`);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const messages = data.results || data.messages || [];
      const responseTimestamp = new Date().toLocaleTimeString();

      if (messages.length > 0) {
        console.log(`📡 [${responseTimestamp}] 💬 API RESPONSE: Found ${messages.length} messages for room ${roomId}`);
        
        // Update last message ID
        const latestMessage = messages[messages.length - 1];
        if (latestMessage && latestMessage.message_id > (lastMessageIdRef.current || 0)) {
          lastMessageIdRef.current = latestMessage.message_id;
        }

        // Always call onNewMessages when messages are found
        // The chat components handle duplicate prevention
        if (messages.length > 0) {
          console.log(`📡 [${responseTimestamp}] 💬 CALLING onNewMessages: ${messages.length} messages`);
          onNewMessages?.(messages);
        }
        setLastUpdate(new Date());
      } else {
        console.log(`📡 [${responseTimestamp}] 💬 API RESPONSE: No new messages for room ${roomId}`);
      }

      // Update pagination info
      setHasMoreMessages(data.has_more || false);
      setTotalMessages(data.total_count || 0);
      setError(null);
    } catch (err: any) {
      console.error('💬 Message polling error:', err);
      setError(err.message || 'Failed to fetch messages');
      onError?.(err);
    }
  }, [getAuthToken, onNewMessages, onError]);

  // Fetch user's rooms
  const fetchRooms = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      console.log('💬 No auth token, skipping room poll');
      return;
    }

    try {
      const response = await fetch('/api/chat/rooms/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const rooms = data.results || data.rooms || [];

      if (rooms.length > 0) {
        // console.log(`💬 Polling: Found ${rooms.length} rooms`);
        onRoomUpdate?.(rooms);
      }

      setError(null);
    } catch (err: any) {
      console.error('💬 Room polling error:', err);
      setError(err.message || 'Failed to fetch rooms');
      onError?.(err);
    }
  }, [getAuthToken, onRoomUpdate, onError]);

  // Poll function - stable callback with no dependencies
  const poll = useCallback(() => {
    const timestamp = new Date().toLocaleTimeString();
    // console.log(`🔄 [${timestamp}] 💬 POLLING CYCLE: enabled=${enabled}, isVisible=${isVisibleRef.current}, roomId=${roomId}`);
    
    if (!enabled || !isVisibleRef.current) {
      // console.log(`🔄 [${timestamp}] 💬 POLLING SKIPPED: not enabled or not visible`);
      return;
    }

    // Fetch messages for current room only
    if (roomId) {
      const afterId = lastMessageIdRef.current || undefined;
      // console.log(`🔄 [${timestamp}] 💬 POLLING MESSAGES: room ${roomId}, afterId: ${afterId}`);
      fetchMessages(roomId, afterId);
    } else {
      // console.log(`🔄 [${timestamp}] 💬 POLLING SKIPPED: no roomId selected`);
    }
  }, [enabled, roomId, fetchMessages]);

  // Start polling
  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const currentInterval = getCurrentInterval();
    const timestamp = new Date().toLocaleTimeString();
    // console.log(`🚀 [${timestamp}] 💬 STARTING POLLING: interval=${currentInterval}ms (${currentInterval/1000}s)`);
    setIsPolling(true);

    // Initial fetch
    poll();

    // Set up interval
    intervalRef.current = setInterval(poll, currentInterval);
    // console.log(`🚀 [${timestamp}] 💬 POLLING INTERVAL SET: ${currentInterval}ms (${currentInterval/1000}s)`);
  }, [poll, getCurrentInterval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const timestamp = new Date().toLocaleTimeString();
    // console.log(`🛑 [${timestamp}] 💬 STOPPED POLLING`);
    setIsPolling(false);
  }, []);

  // Load more messages (for pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!roomId || !hasMoreMessages) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      return;
    }

    try {
      offsetRef.current += 50;
      const url = `/api/chat/rooms/${roomId}/messages/?limit=50&offset=${offsetRef.current}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const messages = data.results || data.messages || [];

      if (messages.length > 0) {
        console.log(`💬 Loaded ${messages.length} more messages`);
        onNewMessages?.(messages);
      }

      setHasMoreMessages(data.has_more || false);
      setError(null);
    } catch (err: any) {
      console.error('💬 Load more messages error:', err);
      setError(err.message || 'Failed to load more messages');
      onError?.(err);
    }
  }, [roomId, hasMoreMessages, getAuthToken, onNewMessages, onError]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      if (enabled) {
        if (isVisibleRef.current) {
          // console.log('💬 Tab visible, resuming chat polling');
          startPolling();
        } else {
          // console.log('💬 Tab hidden, pausing chat polling');
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

  // Start/stop polling based on enabled state
  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString();
    // console.log(`🚀 [${timestamp}] 💬 useChatPolling: enabled=${enabled}, roomId=${roomId}`);
    
    if (enabled) {
      // console.log(`🚀 [${timestamp}] 💬 useChatPolling: Starting polling for room ${roomId}`);
      startPolling();
    } else {
      // console.log(`🚀 [${timestamp}] 💬 useChatPolling: Stopping polling (enabled=${enabled})`);
      if (!roomId) {
        // console.log(`🚀 [${timestamp}] 💬 useChatPolling: No room selected - polling disabled until room is selected`);
      }
      stopPolling();
    }

    return () => {
      const cleanupTimestamp = new Date().toLocaleTimeString();
      // console.log(`🚀 [${cleanupTimestamp}] 💬 useChatPolling: Cleanup - stopping polling`);
      stopPolling();
    };
  }, [enabled, startPolling, stopPolling]); // Include all dependencies

  // Reset when room changes
  useEffect(() => {
    if (roomId) {
      lastMessageIdRef.current = null;
      offsetRef.current = 0;
      setHasMoreMessages(false);
      setTotalMessages(0);
    }
  }, [roomId]);

  // Manual refresh function
  const refresh = useCallback(() => {
    if (enabled) {
      console.log('💬 Manual chat refresh');
      if (roomId) {
        fetchMessages(roomId);
      }
    }
  }, [enabled, roomId, fetchMessages]);

  return {
    isPolling,
    lastUpdate,
    error,
    hasMoreMessages,
    totalMessages,
    refresh,
    loadMoreMessages,
    startPolling,
    stopPolling
  };
};
