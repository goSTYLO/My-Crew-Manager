import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config/api';

export const useChatNotificationCount = () => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch initial count
  const fetchUnreadCount = async () => {
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
        console.log('🔔 Chat notification: API response:', data);
        setUnreadCount(data.unread_count);
      } else {
        console.warn('Failed to fetch chat unread count:', response.status, response.statusText);
        // Set to 0 if API fails to avoid showing stale data
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error fetching chat unread count:', error);
      // Set to 0 if API fails to avoid showing stale data
      setUnreadCount(0);
    }
  };

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const baseUrl = API_BASE_URL.replace(/^https?:/, wsProtocol).replace('/api', '');
    const wsUrl = `${baseUrl}/ws/chat/notifications/?token=${token}`;

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('✅ Chat notification WebSocket connected');
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('🔔 Chat notification WebSocket message received:', data);
      
      if (data.type === 'new_message_notification') {
        console.log('🔔 Chat notification: Incrementing unread count');
        // Increment unread count
        setUnreadCount(prev => prev + 1);
      } else {
        console.log('🔔 Chat notification: Ignoring message type:', data.type);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('❌ Chat notification WebSocket error:', error);
    };

    wsRef.current.onclose = (event) => {
      console.log('🔌 Chat notification WebSocket disconnected:', event.code, event.reason);
    };

    // Fetch initial count
    fetchUnreadCount();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Listen for chat opened event to reset count
  useEffect(() => {
    const handleChatOpened = () => {
      setUnreadCount(0);
    };

    window.addEventListener('chatOpened', handleChatOpened);
    return () => window.removeEventListener('chatOpened', handleChatOpened);
  }, []);

  // Function to reset count when user opens chat
  const resetUnreadCount = () => {
    setUnreadCount(0);
  };

  return { unreadCount, resetUnreadCount, refreshCount: fetchUnreadCount };
};
