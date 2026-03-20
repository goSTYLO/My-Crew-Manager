import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';
import { TokenManager } from '../services/TokenManager';

interface WebSocketMessage {
  type: string;
  action: string;
  project_id?: number;
  data?: any;
  actor?: {
    id: number;
    name: string;
  };
  notification?: {
    id: number;
    type: string;
    title: string;
    message: string;
    action_url?: string;
    actor?: string;
    created_at: string;
    is_read: boolean;
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
  const reconnectDelay = 3000;

  const getAuthToken = useCallback(() => {
    return TokenManager.getToken();
  }, []);

  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    let token = getAuthToken();
    if (!token) {
      token = await TokenManager.refreshTokenIfNeeded();
      if (!token) {
        setConnectionStatus('disconnected');
        return;
      }
    }

    setConnectionStatus('connecting');

    const wsUrl = `${API_BASE_URL.replace('/api', '').replace('http', 'ws')}/ws/project-updates/?token=${token}`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handlersRef.current.forEach(handler => handler(message));
        } catch {
          // ignore malformed payloads
        }
      };

      wsRef.current.onclose = (event) => {
        setConnectionStatus('disconnected');

        if (event.code === 1008) {
          TokenManager.refreshTokenIfNeeded().then(() => {
            if (reconnectAttemptsRef.current < maxReconnectAttempts) {
              reconnectAttemptsRef.current++;
              reconnectTimeoutRef.current = setTimeout(() => {
                connect();
              }, reconnectDelay);
            }
          });
        } else if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1), 30000);
          setConnectionStatus('reconnecting');
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      wsRef.current.onerror = () => {
        setConnectionStatus('disconnected');
      };

    } catch {
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
