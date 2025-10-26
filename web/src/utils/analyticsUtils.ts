// Analytics utility functions for monitoring dashboard

export interface AnalyticsConfig {
  includeEpics?: boolean;
  includeSubEpics?: boolean;
  includeUserStories?: boolean;
  includeTasks?: boolean;
}

export interface TaskStats {
  completed: number;
  inProgress: number;  // pending + assigned
  pending: number;     // pending + unassigned
  total: number;
}

export interface WeeklyData {
  weeks: string[];
  completed: number[];
  inProgress: number[];
  pending: number[];
}

// Helper: Check if task is "in progress" (has assignee)
export function isTaskInProgress(task: any): boolean {
  return task.status === 'pending' && task.assignee !== null;
}

// Helper: Check if task is pending (no assignee)
export function isTaskPending(task: any): boolean {
  return task.status === 'pending' && task.assignee === null;
}

// Helper: Check if task is completed
export function isTaskCompleted(task: any): boolean {
  return task.status === 'done';
}

// Helper: Check if higher-level item is completed
export function isItemCompleted(item: any): boolean {
  return item.is_complete === true;
}

// Flatten all items from backlog based on config
function flattenBacklogItems(backlog: any, config: AnalyticsConfig): any[] {
  const items: any[] = [];
  
  if (!backlog || !backlog.epics) return items;
  
  backlog.epics.forEach((epic: any) => {
    if (config.includeEpics) {
      items.push({ ...epic, type: 'epic' });
    }
    
    epic.subEpics?.forEach((subEpic: any) => {
      if (config.includeSubEpics) {
        items.push({ ...subEpic, type: 'sub_epic' });
      }
      
      subEpic.userStories?.forEach((userStory: any) => {
        if (config.includeUserStories) {
          items.push({ ...userStory, type: 'user_story' });
        }
        
        if (config.includeTasks) {
          userStory.tasks?.forEach((task: any) => {
            items.push({ ...task, type: 'task' });
          });
        }
      });
    });
  });
  
  return items;
}

// Calculate overall statistics
export function calculateTaskStats(backlog: any, config: AnalyticsConfig): TaskStats {
  const items = flattenBacklogItems(backlog, config);
  
  let completed = 0;
  let inProgress = 0;
  let pending = 0;
  
  items.forEach(item => {
    if (item.type === 'task') {
      if (isTaskCompleted(item)) {
        completed++;
      } else if (isTaskInProgress(item)) {
        inProgress++;
      } else if (isTaskPending(item)) {
        pending++;
      }
    } else {
      // For epics, sub-epics, user stories
      if (isItemCompleted(item)) {
        completed++;
      } else {
        // For non-tasks, we'll consider them as "pending" if not complete
        // This is a simplification since they don't have assignee status
        pending++;
      }
    }
  });
  
  const total = completed + inProgress + pending;
  
  return {
    completed,
    inProgress,
    pending,
    total
  };
}

// Generate weekly chart data (6 weeks, grouped by task ID ranges)
export function generateWeeklyData(backlog: any, config: AnalyticsConfig): WeeklyData {
  const items = flattenBacklogItems(backlog, config);
  
  // Only use tasks for weekly data since they have IDs
  const tasks = items.filter(item => item.type === 'task');
  
  if (tasks.length === 0) {
    // Return empty data if no tasks
    return {
      weeks: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
      completed: [0, 0, 0, 0, 0, 0],
      inProgress: [0, 0, 0, 0, 0, 0],
      pending: [0, 0, 0, 0, 0, 0]
    };
  }
  
  // Find min and max task IDs
  const taskIds = tasks.map(task => task.id).filter(id => id != null);
  const minId = Math.min(...taskIds);
  const maxId = Math.max(...taskIds);
  
  // Create 6 equal buckets
  const bucketSize = Math.max(1, Math.ceil((maxId - minId + 1) / 6));
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
  const completed: number[] = [];
  const inProgress: number[] = [];
  const pending: number[] = [];
  
  for (let i = 0; i < 6; i++) {
    const bucketStart = minId + (i * bucketSize);
    const bucketEnd = i === 5 ? maxId : bucketStart + bucketSize - 1;
    
    // Count tasks in this bucket by status
    const bucketTasks = tasks.filter(task => 
      task.id >= bucketStart && task.id <= bucketEnd
    );
    
    let bucketCompleted = 0;
    let bucketInProgress = 0;
    let bucketPending = 0;
    
    bucketTasks.forEach(task => {
      if (isTaskCompleted(task)) {
        bucketCompleted++;
      } else if (isTaskInProgress(task)) {
        bucketInProgress++;
      } else if (isTaskPending(task)) {
        bucketPending++;
      }
    });
    
    completed.push(bucketCompleted);
    inProgress.push(bucketInProgress);
    pending.push(bucketPending);
  }
  
  return {
    weeks,
    completed,
    inProgress,
    pending
  };
}

// Calculate percentage change (for future use in delta calculations)
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// Get default analytics configuration
export function getDefaultAnalyticsConfig(): AnalyticsConfig {
  return {
    includeEpics: false,
    includeSubEpics: false,
    includeUserStories: false,
    includeTasks: true
  };
}
