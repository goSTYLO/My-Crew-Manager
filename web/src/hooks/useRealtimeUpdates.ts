import { useEffect, useCallback, useRef } from 'react';
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

  // Store callbacks in ref to avoid re-subscriptions when callbacks change
  const callbacksRef = useRef(callbacks);
  const projectIdRef = useRef(projectId);
  
  // Update refs when they change
  useEffect(() => {
    callbacksRef.current = callbacks;
    projectIdRef.current = projectId;
  }, [callbacks, projectId]);

  // Create stable callback references that use refs
  const stableCallbacks = useCallback(() => {
    const handlers: { [key: string]: (data: any) => void } = {};
    const currentCallbacks = callbacksRef.current;
    const currentProjectId = projectIdRef.current;

    if (currentCallbacks.onProjectUpdate) {
      handlers.project_update = (data: any) => {
        if (!currentProjectId || data.project_id === currentProjectId) {
          currentCallbacks.onProjectUpdate!(data);
        }
      };
    }

    if (currentCallbacks.onEpicUpdate) {
      handlers.epic_update = (data: any) => {
        if (!currentProjectId || data.project_id === currentProjectId) {
          currentCallbacks.onEpicUpdate!(data);
        }
      };
    }

    if (currentCallbacks.onSubEpicUpdate) {
      handlers.sub_epic_update = (data: any) => {
        if (!currentProjectId || data.project_id === currentProjectId) {
          currentCallbacks.onSubEpicUpdate!(data);
        }
      };
    }

    if (currentCallbacks.onUserStoryUpdate) {
      handlers.user_story_update = (data: any) => {
        if (!currentProjectId || data.project_id === currentProjectId) {
          currentCallbacks.onUserStoryUpdate!(data);
        }
      };
    }

    if (currentCallbacks.onTaskUpdate) {
      handlers.task_update = (data: any) => {
        if (!currentProjectId || data.project_id === currentProjectId) {
          currentCallbacks.onTaskUpdate!(data);
        }
      };
    }

    if (currentCallbacks.onMemberUpdate) {
      handlers.member_update = (data: any) => {
        if (!currentProjectId || data.project_id === currentProjectId) {
          currentCallbacks.onMemberUpdate!(data);
        }
      };
    }

    if (currentCallbacks.onRepositoryUpdate) {
      handlers.repository_update = (data: any) => {
        if (!currentProjectId || data.project_id === currentProjectId) {
          currentCallbacks.onRepositoryUpdate!(data);
        }
      };
    }

    if (currentCallbacks.onBacklogRegenerated) {
      handlers.backlog_regenerated = (data: any) => {
        if (!currentProjectId || data.project_id === currentProjectId) {
          currentCallbacks.onBacklogRegenerated!(data);
        }
      };
    }

    if (currentCallbacks.onOverviewRegenerated) {
      handlers.overview_regenerated = (data: any) => {
        if (!currentProjectId || data.project_id === currentProjectId) {
          currentCallbacks.onOverviewRegenerated!(data);
        }
      };
    }

    if (currentCallbacks.onNotification) {
      handlers.notification = (data: any) => {
        currentCallbacks.onNotification!(data);
      };
    }

    return handlers;
  }, []); // Empty deps - use refs instead

  useEffect(() => {
    const messageHandler = (message: any) => {
      let eventType = message.type || message.action;
      let eventData = message;

      if (message.type === 'project_event' && message.data) {
        eventType = message.data.type || message.data.action;
        eventData = message.data;
      }

      const handlers = stableCallbacks();
      const handler = handlers[eventType];
      if (handler && typeof handler === 'function') {
        handler(eventData);
      }
    };

    const unsubscribe = subscribe(messageHandler);
    return () => unsubscribe();
  }, [subscribe, stableCallbacks]);

  // Return connection status and utility functions
  const { connectionStatus, getConnectionStatus } = useWebSocket();

  return {
    connectionStatus,
    getConnectionStatus,
  };
};
