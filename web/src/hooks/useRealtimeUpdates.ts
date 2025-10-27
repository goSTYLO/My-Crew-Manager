import { useEffect, useCallback } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';

interface RealtimeUpdateCallbacks {
  onProjectUpdate?: (data: any) => void;
  onEpicUpdate?: (data: any) => void;
  onSubEpicUpdate?: (data: any) => void;
  onUserStoryUpdate?: (data: any) => void;
  onTaskUpdate?: (data: any) => void;
  onMemberUpdate?: (data: any) => void;
  onRepositoryUpdate?: (data: any) => void;
  onBacklogRegenerated?: (data: any) => void;
  onOverviewRegenerated?: (data: any) => void;
  onNotification?: (data: any) => void;
}

interface UseRealtimeUpdatesOptions {
  projectId?: number;
  callbacks: RealtimeUpdateCallbacks;
}

export const useRealtimeUpdates = ({ projectId, callbacks }: UseRealtimeUpdatesOptions) => {
  const { subscribe } = useWebSocket();

  // Create stable callback references
  const stableCallbacks = useCallback(() => {
    const handlers: { [key: string]: (data: any) => void } = {};

    if (callbacks.onProjectUpdate) {
      handlers.project_update = (data: any) => {
        if (!projectId || data.project_id === projectId) {
          callbacks.onProjectUpdate!(data);
        }
      };
    }

    if (callbacks.onEpicUpdate) {
      handlers.epic_update = (data: any) => {
        if (!projectId || data.project_id === projectId) {
          callbacks.onEpicUpdate!(data);
        }
      };
    }

    if (callbacks.onSubEpicUpdate) {
      handlers.sub_epic_update = (data: any) => {
        if (!projectId || data.project_id === projectId) {
          callbacks.onSubEpicUpdate!(data);
        }
      };
    }

    if (callbacks.onUserStoryUpdate) {
      handlers.user_story_update = (data: any) => {
        if (!projectId || data.project_id === projectId) {
          callbacks.onUserStoryUpdate!(data);
        }
      };
    }

    if (callbacks.onTaskUpdate) {
      handlers.task_update = (data: any) => {
        if (!projectId || data.project_id === projectId) {
          callbacks.onTaskUpdate!(data);
        }
      };
    }

    if (callbacks.onMemberUpdate) {
      handlers.member_update = (data: any) => {
        if (!projectId || data.project_id === projectId) {
          callbacks.onMemberUpdate!(data);
        }
      };
    }

    if (callbacks.onRepositoryUpdate) {
      handlers.repository_update = (data: any) => {
        if (!projectId || data.project_id === projectId) {
          callbacks.onRepositoryUpdate!(data);
        }
      };
    }

    if (callbacks.onBacklogRegenerated) {
      handlers.backlog_regenerated = (data: any) => {
        if (!projectId || data.project_id === projectId) {
          callbacks.onBacklogRegenerated!(data);
        }
      };
    }

    if (callbacks.onOverviewRegenerated) {
      handlers.overview_regenerated = (data: any) => {
        if (!projectId || data.project_id === projectId) {
          callbacks.onOverviewRegenerated!(data);
        }
      };
    }

    if (callbacks.onNotification) {
      handlers.notification = (data: any) => {
        callbacks.onNotification!(data);
      };
    }

    return handlers;
  }, [callbacks, projectId]);

  useEffect(() => {
    const handlers = stableCallbacks();
    
    // Create a single handler that routes messages based on type
    const messageHandler = (message: any) => {
      const eventType = message.type || message.action;
      const handler = handlers[eventType];
      if (handler && typeof handler === 'function') {
        handler(message);
      }
    };
    
    const unsubscribe = subscribe(messageHandler);

    // Cleanup: call unsubscribe function
    return () => {
      unsubscribe();
    };
  }, [subscribe, stableCallbacks]);

  // Return connection status and utility functions
  const { connectionStatus, getConnectionStatus } = useWebSocket();

  return {
    connectionStatus,
    getConnectionStatus,
  };
};
