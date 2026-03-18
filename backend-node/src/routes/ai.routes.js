import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as ctrl from '../controllers/ai.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);

router.post('/proposals/', upload.single('file'), ctrl.uploadProposal);

router.get('/projects/', ctrl.listProjects);
router.get('/projects/my-projects/', ctrl.listProjects);
router.post('/projects/', ctrl.createProject);
router.get('/projects/:id', ctrl.getProject);
router.get('/projects/:id/statistics/', ctrl.getProjectStatistics);
router.get('/projects/:id/current-proposal/', ctrl.getCurrentProposal);
router.get('/projects/:id/backlog/', ctrl.getProjectBacklog);
router.put('/projects/:id', ctrl.updateProject);
router.patch('/projects/:id', ctrl.updateProject);
router.delete('/projects/:id', ctrl.deleteProject);
router.put('/projects/:id/ingest-proposal/:proposal_id', ctrl.ingestProposal);
router.put('/projects/:id/generate-overview/', ctrl.generateOverview);
router.put('/projects/:id/generate-backlog', ctrl.generateBacklog);

router.get('/project-features/', ctrl.listProjectFeatures);
router.post('/project-features/', ctrl.createProjectFeature);
router.get('/project-roles/', ctrl.listProjectRoles);
router.post('/project-roles/', ctrl.createProjectRole);
router.get('/project-goals/', ctrl.listProjectGoals);
router.post('/project-goals/', ctrl.createProjectGoal);
router.get('/timeline-weeks/', ctrl.listTimelineWeeks);
router.post('/timeline-weeks/', ctrl.createTimelineWeek);
router.get('/timeline-items/', ctrl.listTimelineItems);
router.post('/timeline-items/', ctrl.createTimelineItem);

router.get('/epics/', ctrl.listEpics);
router.post('/epics/', ctrl.createEpic);
router.get('/epics/:id', ctrl.getEpic);
router.put('/epics/:id', ctrl.updateEpic);
router.delete('/epics/:id', ctrl.deleteEpic);

router.get('/sub-epics/', ctrl.listSubEpics);
router.post('/sub-epics/', ctrl.createSubEpic);

router.get('/user-stories/', ctrl.listUserStories);
router.post('/user-stories/', ctrl.createUserStory);

router.get('/story-tasks/', ctrl.listStoryTasks);
router.get('/story-tasks/user-assigned/', ctrl.listStoryTasksUserAssigned);
router.get('/story-tasks/recent-completed/', ctrl.listStoryTasksRecentCompleted);
router.post('/story-tasks/bulk-assign/', ctrl.bulkAssignStoryTasks);
router.post('/story-tasks/', ctrl.createStoryTask);
router.put('/story-tasks/:id', ctrl.updateStoryTask);
router.patch('/story-tasks/:id', ctrl.updateStoryTask);

router.get('/project-members/', ctrl.listProjectMembers);
router.post('/project-members/', ctrl.createProjectMember);
router.delete('/project-members/:id', ctrl.deleteProjectMember);

router.get('/invitations/', ctrl.listInvitations);
router.get('/invitations/my-invitations/', ctrl.listMyInvitations);
router.post('/invitations/', ctrl.createInvitation);
router.post('/invitations/:id/accept', ctrl.acceptInvitation);
router.post('/invitations/:id/decline', ctrl.declineInvitation);

router.get('/notifications/', ctrl.listNotifications);
router.get('/notifications/unread_count/', ctrl.getNotificationsUnreadCount);
router.delete('/notifications/:id', ctrl.deleteNotification);
router.patch('/notifications/:id/read', ctrl.markNotificationRead);
router.post('/notifications/:id/mark_read/', ctrl.markNotificationRead);
router.post('/notifications/mark_all_read/', ctrl.markAllNotificationsRead);

export default router;
