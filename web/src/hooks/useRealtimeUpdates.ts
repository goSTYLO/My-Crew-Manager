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
  const { subscribe, unsubscribe } = useWebSocket();

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

    // Subscribe to all event types
    Object.entries(handlers).forEach(([eventType, handler]) => {
      subscribe(eventType, handler);
    });

    // Cleanup: unsubscribe from all event types
    return () => {
      Object.entries(handlers).forEach(([eventType, handler]) => {
        unsubscribe(eventType, handler);
      });
    };
  }, [subscribe, unsubscribe, stableCallbacks]);

  // Return connection status and utility functions
  const { connectionStatus, getConnectionStatus } = useWebSocket();

  return {
    connectionStatus,
    getConnectionStatus,
  };
};
