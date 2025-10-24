import { isTaskCompleted, isTaskInProgress, isTaskPending } from './analyticsUtils';

export interface AggregatedTaskStats {
  completed: number;
  inProgress: number;
  pending: number;
  total: number;
}

export interface MonthlyTrendData {
  months: string[];
  completed: number[];
}

export interface Collaborator {
  id: number;
  name: string;
  email: string;
  avatar: string;
}

// Aggregate task stats across all project backlogs
export function calculateAggregatedTaskStats(
  projectBacklogs: Array<{ projectId: number; backlog: any }>,
  timeFilter: string = 'all'
): AggregatedTaskStats {
  // Calculate aggregated task statistics with optional time filtering
  
  let completed = 0;
  let inProgress = 0;
  let pending = 0;

  // Helper function to filter tasks by time
  const filterTasksByTime = (tasks: any[], timeFilter: string) => {
    if (timeFilter === 'all') return tasks;
    
    const now = new Date();
    let filterDate = new Date();
    
    switch (timeFilter) {
      case 'this_week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'last_week':
        filterDate.setDate(now.getDate() - 14);
        break;
      case 'this_month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case 'last_month':
        filterDate.setMonth(now.getMonth() - 2);
        break;
      default:
        return tasks;
    }
    
    return tasks.filter(task => {
      const taskDate = new Date(task.updated_at || task.created_at);
      return taskDate >= filterDate;
    });
  };

  projectBacklogs.forEach(({ backlog }) => {
    if (!backlog || !backlog.epics) return;

    backlog.epics.forEach((epic: any) => {
      epic.subEpics?.forEach((subEpic: any) => {
        subEpic.userStories?.forEach((userStory: any) => {
          const filteredTasks = filterTasksByTime(userStory.tasks || [], timeFilter);
          
          filteredTasks.forEach((task: any) => {
            if (isTaskCompleted(task)) {
              completed++;
            } else if (isTaskInProgress(task)) {
              inProgress++;
            } else if (isTaskPending(task)) {
              pending++;
            }
          });
        });
      });
    });
  });

  const total = completed + inProgress + pending;
  
  // Return aggregated statistics

  return {
    completed,
    inProgress,
    pending,
    total
  };
}

// Generate project creation trends based on time filter
export function generateProjectCreationTrends(
  projects: any[],
  timeFilter: string = 'all'
): MonthlyTrendData {
  // Filter projects based on time filter
  const filteredProjects = filterProjectsByTime(projects, timeFilter);
  
  // Group projects by time periods based on filter
  let periods: string[] = [];
  let created: number[] = [];
  
  switch (timeFilter) {
    case 'all':
      // Group by months for all time
      const monthlyGroups = groupProjectsByMonth(filteredProjects);
      periods = monthlyGroups.map(group => group.period);
      created = monthlyGroups.map(group => group.count);
      break;
      
    case 'this_month':
    case 'last_month':
      // Group by weeks for monthly view
      const weeklyGroups = groupProjectsByWeek(filteredProjects);
      periods = weeklyGroups.map(group => group.period);
      created = weeklyGroups.map(group => group.count);
      break;
      
    case 'this_week':
    case 'last_week':
      // Group by days for weekly view
      const dailyGroups = groupProjectsByDay(filteredProjects);
      periods = dailyGroups.map(group => group.period);
      created = dailyGroups.map(group => group.count);
      break;
      
    default:
      // Default to monthly grouping
      const defaultGroups = groupProjectsByMonth(filteredProjects);
      periods = defaultGroups.map(group => group.period);
      created = defaultGroups.map(group => group.count);
  }

  return {
    months: periods,
    completed: created
  };
}

// Helper function to filter projects by time
function filterProjectsByTime(projects: any[], timeFilter: string): any[] {
  if (timeFilter === 'all') return projects;
  
  const now = new Date();
  let filterDate = new Date();
  
  switch (timeFilter) {
    case 'this_week':
      filterDate.setDate(now.getDate() - 7);
      break;
    case 'last_week':
      filterDate.setDate(now.getDate() - 14);
      break;
    case 'this_month':
      filterDate.setMonth(now.getMonth() - 1);
      break;
    case 'last_month':
      filterDate.setMonth(now.getMonth() - 2);
      break;
    default:
      return projects;
  }
  
  return projects.filter(project => {
    const projectDate = new Date(project.created_at || project.createdAt || 0);
    return projectDate >= filterDate;
  });
}

// Helper function to group projects by month
function groupProjectsByMonth(projects: any[]): Array<{ period: string; count: number }> {
  const groups = new Map<string, number>();
  
  projects.forEach(project => {
    const date = new Date(project.created_at || project.createdAt || 0);
    const period = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    groups.set(period, (groups.get(period) || 0) + 1);
  });
  
  return Array.from(groups.entries())
    .map(([period, count]) => ({ period, count }))
    .sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime());
}

// Helper function to group projects by week
function groupProjectsByWeek(projects: any[]): Array<{ period: string; count: number }> {
  const groups = new Map<string, number>();
  
  projects.forEach(project => {
    const date = new Date(project.created_at || project.createdAt || 0);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const period = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    groups.set(period, (groups.get(period) || 0) + 1);
  });
  
  return Array.from(groups.entries())
    .map(([period, count]) => ({ period, count }))
    .sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime());
}

// Helper function to group projects by day
function groupProjectsByDay(projects: any[]): Array<{ period: string; count: number }> {
  const groups = new Map<string, number>();
  
  projects.forEach(project => {
    const date = new Date(project.created_at || project.createdAt || 0);
    const period = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    groups.set(period, (groups.get(period) || 0) + 1);
  });
  
  return Array.from(groups.entries())
    .map(([period, count]) => ({ period, count }))
    .sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime());
}

// Extract all users as potential collaborators
export function extractAllUsers(
  allUsers: any[]
): Collaborator[] {
  // Extract all users as potential collaborators
  
  const collaboratorMap = new Map<number, Collaborator>();

  allUsers.forEach((user: any) => {
    if (user.user_id && !collaboratorMap.has(user.user_id)) {
      const collaborator = {
        id: user.user_id,
        name: user.name || 'Unknown User',
        email: user.email || 'unknown@example.com',
        avatar: generateAvatarColor(user.user_id)
      };
      collaboratorMap.set(user.user_id, collaborator);
    }
  });

  const collaborators = Array.from(collaboratorMap.values());
  
  return collaborators;
}

// Generate consistent avatar colors for collaborators
function generateAvatarColor(userId: number): string {
  const colors = [
    '#F59E0B', // yellow-500
    '#EF4444', // red-500
    '#10B981', // emerald-500
    '#3B82F6', // blue-500
    '#14B8A6', // teal-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#6B7280'  // gray-500
  ];
  return colors[userId % colors.length];
}
