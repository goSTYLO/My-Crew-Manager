import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  payload?: any;
  notification?: any;
}

interface WebSocketContextType {
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  subscribe: (eventType: string, handler: (data: any) => void) => void;
  unsubscribe: (eventType: string, handler: (data: any) => void) => void;
  getConnectionStatus: () => 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const eventHandlersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  const getAuthToken = useCallback(() => {
    // Try to get token from localStorage
    const token = localStorage.getItem('token');
    const access = localStorage.getItem('access');
    
    // Prefer 'access' token if available, otherwise use 'token'
    return access || token;
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    const token = getAuthToken();
    if (!token) {
      console.log('No auth token found, skipping WebSocket connection');
      setConnectionStatus('disconnected');
      return;
    }

    setConnectionStatus('connecting');
    
    try {
      // Use the existing notifications WebSocket endpoint
      const wsUrl = `ws://localhost:8000/ws/notifications/`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        
        // Send authentication token as first message
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'auth',
            token: token
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          // Handle authentication success
          if (message.type === 'auth_success') {
            console.log('WebSocket authentication successful:', message.message);
            return;
          }
          
          // Handle error messages
          if (message.type === 'error') {
            console.error('WebSocket error:', message.message);
            return;
          }
          
          // Handle different message types
          if (message.type === 'notification') {
            // Handle notification messages
            const handlers = eventHandlersRef.current.get('notification');
            if (handlers) {
              handlers.forEach(handler => handler(message.notification));
            }
          } else if (message.payload) {
            // Handle real-time update messages
            const handlers = eventHandlersRef.current.get(message.type);
            if (handlers) {
              handlers.forEach(handler => handler(message.payload));
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus('disconnected');
        
        // Attempt to reconnect if not a manual close
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          setConnectionStatus('reconnecting');
          reconnectAttemptsRef.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
            connect();
          }, reconnectDelay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionStatus('disconnected');
    }
  }, [getAuthToken]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setConnectionStatus('disconnected');
    reconnectAttemptsRef.current = 0;
  }, []);

  const subscribe = useCallback((eventType: string, handler: (data: any) => void) => {
    if (!eventHandlersRef.current.has(eventType)) {
      eventHandlersRef.current.set(eventType, new Set());
    }
    eventHandlersRef.current.get(eventType)!.add(handler);
  }, []);

  const unsubscribe = useCallback((eventType: string, handler: (data: any) => void) => {
    const handlers = eventHandlersRef.current.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        eventHandlersRef.current.delete(eventType);
      }
    }
  }, []);

  const getConnectionStatus = useCallback(() => {
    return connectionStatus;
  }, [connectionStatus]);

  // Connect on mount and when auth token changes
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, getAuthToken]);

  // Listen for auth token changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'access') {
        const newToken = getAuthToken();
        if (newToken && connectionStatus === 'disconnected') {
          connect();
        } else if (!newToken && connectionStatus === 'connected') {
          disconnect();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [connect, disconnect, getAuthToken, connectionStatus]);

  const contextValue: WebSocketContextType = {
    connectionStatus,
    subscribe,
    unsubscribe,
    getConnectionStatus,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
