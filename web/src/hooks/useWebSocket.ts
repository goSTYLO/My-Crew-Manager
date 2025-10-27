import { useEffect, useRef, useCallback, useState } from 'react';
import { API_BASE_URL } from '../config/api';

interface WebSocketEvent {
  type: string;
  action: string;
  project_id: number;
  data: any;
  actor: {
    id: number;
    name: string;
  };
}

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, Set<(event: WebSocketEvent) => void>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    const token = sessionStorage.getItem('access') || sessionStorage.getItem('token');
    
    if (!token) {
      console.log('No token, skipping WebSocket');
      return;
    }

    const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/ws/project-updates/?token=${token}`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'connected') {
            console.log('WebSocket authenticated');
            return;
          }

          // Call all handlers for this event type
          const handlers = handlersRef.current.get(message.type);
          if (handlers) {
            handlers.forEach(handler => handler(message));
          }
          
          // Also call wildcard handlers
          const wildcardHandlers = handlersRef.current.get('*');
          if (wildcardHandlers) {
            wildcardHandlers.forEach(handler => handler(message));
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const subscribe = useCallback((eventType: string, handler: (event: WebSocketEvent) => void) => {
    if (!handlersRef.current.has(eventType)) {
      handlersRef.current.set(eventType, new Set());
    }
    handlersRef.current.get(eventType)!.add(handler);
    
    return () => {
      const handlers = handlersRef.current.get(eventType);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { isConnected, subscribe };
};