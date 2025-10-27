import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';

interface WebSocketMessage {
  type: string;
  action: string;
  project_id: number;
  data: any;
  actor: {
    id: number;
    name: string;
  };
}

interface WebSocketContextType {
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  subscribe: (handler: (data: WebSocketMessage) => void) => () => void;
  getConnectionStatus: () => 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Set<(data: WebSocketMessage) => void>>(new Set());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  const getAuthToken = useCallback(() => {
    return sessionStorage.getItem('access') || sessionStorage.getItem('token');
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket already connecting or connected, skipping');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      console.log('No auth token found, skipping WebSocket connection');
      setConnectionStatus('disconnected');
      return;
    }

    setConnectionStatus('connecting');

    try {
      const wsUrl = `${API_BASE_URL.replace('/api', '').replace('http', 'ws')}/ws/project-updates/?token=${token}`;
      console.log('Creating WebSocket connection to:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Project Updates WebSocket connected');
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handlersRef.current.forEach(handler => handler(message));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('Project Updates WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus('disconnected');

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
        console.error('Project Updates WebSocket error:', error);
        console.log('WebSocket readyState:', wsRef.current?.readyState);
        setConnectionStatus('disconnected');
      };

    } catch (error) {
      console.error('Error creating Project Updates WebSocket connection:', error);
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

  const subscribe = useCallback((handler: (data: WebSocketMessage) => void) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  const getConnectionStatus = useCallback(() => {
    return connectionStatus;
  }, [connectionStatus]);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const contextValue: WebSocketContextType = {
    connectionStatus,
    subscribe,
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
