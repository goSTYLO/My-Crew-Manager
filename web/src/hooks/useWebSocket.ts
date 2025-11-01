/**
 * @deprecated This hook is deprecated. Use `useWebSocket` from `contexts/WebSocketContext` instead.
 * 
 * This file is kept for backward compatibility but should not be used in new code.
 * All WebSocket connections should use the centralized WebSocketContext to avoid duplicate connections.
 * 
 * Migration:
 * - Old: import { useWebSocket } from '../hooks/useWebSocket';
 * - New: import { useWebSocket } from '../contexts/WebSocketContext';
 */
import { useWebSocket as useWebSocketFromContext } from '../contexts/WebSocketContext';

/**
 * @deprecated Use useWebSocket from contexts/WebSocketContext instead
 */
export const useWebSocket = () => {
  console.warn('⚠️ Using deprecated useWebSocket hook. Please migrate to useWebSocket from contexts/WebSocketContext');
  return useWebSocketFromContext();
};
