import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as ctrl from '../controllers/ai.controller.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware.js';
import { aiSchemas } from '../validation/schemas.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);

router.post('/proposals/', upload.single('file'), ctrl.uploadProposal);

router.get('/projects/', validateQuery(aiSchemas.listProjectsQuery), ctrl.listProjects);
router.get('/projects/my-projects/', validateQuery(aiSchemas.listProjectsQuery), ctrl.listProjects);
router.post('/projects/', validateBody(aiSchemas.createProject), ctrl.createProject);
router.get('/projects/:id', validateParams(aiSchemas.projectIdParam), ctrl.getProject);
router.get('/projects/:id/statistics/', validateParams(aiSchemas.projectIdParam), ctrl.getProjectStatistics);
router.get('/projects/:id/current-proposal/', validateParams(aiSchemas.projectIdParam), ctrl.getCurrentProposal);
router.get('/projects/:id/backlog/', validateParams(aiSchemas.projectIdParam), ctrl.getProjectBacklog);
router.put('/projects/:id', validateParams(aiSchemas.projectIdParam), validateBody(aiSchemas.updateProject), ctrl.updateProject);
router.patch('/projects/:id', validateParams(aiSchemas.projectIdParam), validateBody(aiSchemas.updateProject), ctrl.updateProject);
router.put('/projects/:id/update-status/', validateParams(aiSchemas.projectIdParam), validateBody(aiSchemas.updateProject), ctrl.updateProjectStatus);
router.delete('/projects/:id', validateParams(aiSchemas.projectIdParam), ctrl.deleteProject);
router.put('/projects/:id/ingest-proposal/:proposal_id', validateParams(aiSchemas.projectIdParam.extend({ proposal_id: aiSchemas.projectIdParam.shape.id })), ctrl.ingestProposal);
router.put('/projects/:id/generate-overview/', validateParams(aiSchemas.projectIdParam), ctrl.generateOverview);
router.put('/projects/:id/generate-backlog', validateParams(aiSchemas.projectIdParam), ctrl.generateBacklog);

router.get('/project-features/', ctrl.listProjectFeatures);
router.post('/project-features/', ctrl.createProjectFeature);
router.patch('/project-features/:id/', ctrl.updateProjectFeature);
router.delete('/project-features/:id/', ctrl.deleteProjectFeature);
router.get('/project-roles/', ctrl.listProjectRoles);
router.post('/project-roles/', ctrl.createProjectRole);
router.patch('/project-roles/:id/', ctrl.updateProjectRole);
router.delete('/project-roles/:id/', ctrl.deleteProjectRole);
router.get('/project-goals/', ctrl.listProjectGoals);
router.post('/project-goals/', ctrl.createProjectGoal);
router.patch('/project-goals/:id/', ctrl.updateProjectGoal);
router.delete('/project-goals/:id/', ctrl.deleteProjectGoal);
router.get('/timeline-weeks/', ctrl.listTimelineWeeks);
router.post('/timeline-weeks/', ctrl.createTimelineWeek);
router.post('/project-timeline/', ctrl.createProjectTimeline);
router.delete('/timeline-weeks/:id/', ctrl.deleteTimelineWeek);
router.get('/timeline-items/', ctrl.listTimelineItems);
router.post('/timeline-items/', ctrl.createTimelineItem);
router.patch('/timeline-items/:id/', ctrl.updateTimelineItem);
router.delete('/timeline-items/:id/', ctrl.deleteTimelineItem);

router.get('/epics/', ctrl.listEpics);
router.post('/epics/', ctrl.createEpic);
router.get('/epics/:id', ctrl.getEpic);
router.put('/epics/:id', ctrl.updateEpic);
router.patch('/epics/:id/', ctrl.updateEpic);
router.delete('/epics/:id', ctrl.deleteEpic);

router.get('/sub-epics/', ctrl.listSubEpics);
router.post('/sub-epics/', ctrl.createSubEpic);
router.patch('/sub-epics/:id/', ctrl.updateSubEpic);
router.delete('/sub-epics/:id/', ctrl.deleteSubEpic);

router.get('/user-stories/', ctrl.listUserStories);
router.post('/user-stories/', ctrl.createUserStory);
router.patch('/user-stories/:id/', ctrl.updateUserStory);
router.delete('/user-stories/:id/', ctrl.deleteUserStory);

router.get('/story-tasks/', ctrl.listStoryTasks);
router.get('/story-tasks/user-assigned/', ctrl.listStoryTasksUserAssigned);
router.get('/story-tasks/recent-completed/', ctrl.listStoryTasksRecentCompleted);
router.post('/story-tasks/bulk-assign/', ctrl.bulkAssignStoryTasks);
router.post('/story-tasks/', ctrl.createStoryTask);
router.put('/story-tasks/:id', ctrl.updateStoryTask);
router.patch('/story-tasks/:id', ctrl.updateStoryTask);
router.delete('/story-tasks/:id/', ctrl.deleteStoryTask);

router.get('/project-members/', ctrl.listProjectMembers);
router.post('/project-members/', ctrl.createProjectMember);
router.patch('/project-members/:id/', ctrl.updateProjectMember);
router.delete('/project-members/:id', ctrl.deleteProjectMember);

router.get('/repositories/', ctrl.listRepositories);
router.post('/repositories/', ctrl.createRepository);
router.patch('/repositories/:id/', ctrl.updateRepository);
router.delete('/repositories/:id/', ctrl.deleteRepository);

router.get('/invitations/', ctrl.listInvitations);
router.get('/invitations/my-invitations/', ctrl.listMyInvitations);
router.post('/invitations/', ctrl.createInvitation);
router.post('/invitations/:id/accept', ctrl.acceptInvitation);
router.post('/invitations/:id/accept/', ctrl.acceptInvitation);
router.post('/invitations/:id/decline', ctrl.declineInvitation);
router.post('/invitations/:id/decline/', ctrl.declineInvitation);

router.get('/notifications/', ctrl.listNotifications);
router.get('/notifications/unread_count/', ctrl.getNotificationsUnreadCount);
router.delete('/notifications/:id', ctrl.deleteNotification);
router.patch('/notifications/:id/read', ctrl.markNotificationRead);
router.post('/notifications/:id/mark_read/', ctrl.markNotificationRead);
router.post('/notifications/mark_all_read/', ctrl.markAllNotificationsRead);

export default router;
