import {
  Project,
  Proposal,
  ProjectMember,
  Epic,
  SubEpic,
  UserStory,
  StoryTask,
  ProjectInvitation,
  Notification,
  ProjectFeature,
  ProjectRole,
  ProjectGoal,
  TimelineWeek,
  TimelineItem,
} from '../models/index.js';
import { broadcast } from '../services/broadcast.service.js';
import { callAIService } from '../services/ai.service.js';
import mongoose from 'mongoose';
import { PDFParse } from 'pdf-parse';

function getProjectMemberIds(projectId) {
  return ProjectMember.find({ project: projectId }).distinct('user');
}

function broadcastToProject(projectId, eventType, action, data, actor) {
  getProjectMemberIds(projectId).then((userIds) => {
    userIds.forEach((uid) => {
      const room = `user_${uid}_updates`;
      broadcast(room, {
        type: eventType,
        action,
        project_id: projectId,
        data,
        actor: { id: actor?._id?.toString?.(), name: actor?.name },
      });
    });
  });
}

export async function listProjects(req, res, next) {
  try {
    const members = await ProjectMember.find({ user: req.user._id }).distinct('project');
    const projects = await Project.find({ _id: { $in: members } })
      .populate('createdBy', 'name email')
      .populate('statusUpdatedBy', 'name');
    return res.json(projects.map(projectToResponse));
  } catch (err) {
    next(err);
  }
}

export async function getProject(req, res, next) {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('statusUpdatedBy', 'name');
    if (!project) return res.status(404).json({ detail: 'Not found' });
    const isMember = await ProjectMember.findOne({ project: project._id, user: req.user._id });
    if (!isMember) return res.status(403).json({ detail: 'Not a member' });
    return res.json(projectToResponse(project));
  } catch (err) {
    next(err);
  }
}

export async function createProject(req, res, next) {
  try {
    const project = await Project.create({
      title: req.body.title || 'Untitled',
      summary: req.body.summary,
      status: req.body.status || 'in_progress',
      createdBy: req.user._id,
    });
    await ProjectMember.create({
      project: project._id,
      user: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      role: 'Owner',
    });
    broadcastToProject(project._id, 'project_update', 'created', projectToResponse(project), req.user);
    return res.status(201).json(projectToResponse(project));
  } catch (err) {
    next(err);
  }
}

export async function getCurrentProposal(req, res, next) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ detail: 'Not found' });
    const isMember = await ProjectMember.findOne({ project: project._id, user: req.user._id });
    if (!isMember) return res.status(403).json({ detail: 'Not a member' });

    const proposal = await Proposal.findOne({ project: project._id })
      .sort({ createdAt: -1 })
      .lean();

    if (!proposal || !proposal.parsedText) {
      return res.status(404).json({ detail: 'No proposal found' });
    }

    return res.json({
      id: proposal._id.toString(),
      parsed_text: proposal.parsedText,
      uploaded_at: proposal.createdAt,
      file: proposal.file,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProject(req, res, next) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ detail: 'Not found' });
    const isMember = await ProjectMember.findOne({ project: project._id, user: req.user._id });
    if (!isMember) return res.status(403).json({ detail: 'Not a member' });
    if (req.body.title) project.title = req.body.title;
    if (req.body.summary !== undefined) project.summary = req.body.summary;
    if (req.body.status) {
      project.status = req.body.status;
      project.statusUpdatedAt = new Date();
      project.statusUpdatedBy = req.user._id;
    }
    await project.save();
    broadcastToProject(project._id, 'project_update', 'updated', projectToResponse(project), req.user);
    return res.json(projectToResponse(project));
  } catch (err) {
    next(err);
  }
}

export async function deleteProject(req, res, next) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ detail: 'Not found' });
    const member = await ProjectMember.findOne({ project: project._id, user: req.user._id });
    if (!member || member.role !== 'Owner') return res.status(403).json({ detail: 'Only owner can delete' });
    await Project.deleteOne({ _id: project._id });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function ingestProposal(req, res, next) {
  try {
    const { id, proposal_id } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ detail: 'Not found' });
    const isMember = await ProjectMember.findOne({ project: project._id, user: req.user._id });
    if (!isMember) return res.status(403).json({ detail: 'Not a member' });
    const proposal = await Proposal.findOne({ _id: proposal_id, project: project._id });
    if (!proposal) return res.status(404).json({ detail: 'Proposal not found' });
    if (!proposal.parsedText) return res.status(400).json({ error: 'Proposal has no parsed text' });

    const result = await callAIService('/generate-overview', { proposal_text: proposal.parsedText });
    if (result.error) return res.status(result.status).json(result.data);

    await saveOverviewToMongo(project._id, result.data);
    const projectUpdated = await Project.findById(project._id);
    broadcastToProject(project._id, 'overview_regenerated', 'regenerated', result.data, req.user);
    return res.json(buildOverviewResponse(projectUpdated, result.data));
  } catch (err) {
    next(err);
  }
}

export async function generateOverview(req, res, next) {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ detail: 'Not found' });
    const isMember = await ProjectMember.findOne({ project: project._id, user: req.user._id });
    if (!isMember) return res.status(403).json({ detail: 'Not a member' });

    const proposal = await Proposal.findOne({ project: project._id }).sort({ createdAt: -1 }).lean();
    if (!proposal?.parsedText) return res.status(400).json({ detail: 'No proposal with parsed text found' });

    const result = await callAIService('/generate-overview', { proposal_text: proposal.parsedText });
    if (result.error) return res.status(result.status).json(result.data);

    await saveOverviewToMongo(project._id, result.data);
    const projectUpdated = await Project.findById(project._id);
    broadcastToProject(project._id, 'overview_regenerated', 'regenerated', result.data, req.user);
    return res.json(buildOverviewResponse(projectUpdated, result.data));
  } catch (err) {
    next(err);
  }
}

export async function generateBacklog(req, res, next) {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ detail: 'Not found' });
    const isMember = await ProjectMember.findOne({ project: project._id, user: req.user._id });
    if (!isMember) return res.status(403).json({ detail: 'Not a member' });

    const proposal = await Proposal.findOne({ project: project._id }).sort({ createdAt: -1 }).lean();
    if (!proposal?.parsedText) return res.status(400).json({ detail: 'No proposal with parsed text found' });

    const result = await callAIService('/generate-backlog', { proposal_text: proposal.parsedText });
    if (result.error) return res.status(result.status).json(result.data);

    await saveBacklogToMongo(project._id, result.data);
    const backlog = await getProjectBacklogData(project._id);
    broadcastToProject(project._id, 'backlog_regenerated', 'regenerated', backlog, req.user);
    return res.json(backlog);
  } catch (err) {
    next(err);
  }
}

export async function uploadProposal(req, res, next) {
  try {
    const file = req.file;
    const projectId = req.body.project_id;

    if (!file || !projectId) {
      return res.status(400).json({ error: 'Missing file or project_id' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ detail: 'Not found' });
    const isMember = await ProjectMember.findOne({ project: project._id, user: req.user._id });
    if (!isMember) return res.status(403).json({ detail: 'Not a member' });

    if (!file.originalname.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ error: 'Only PDF files are supported' });
    }

    let text;
    try {
      const parser = new PDFParse({ data: file.buffer });
      const result = await parser.getText();
      text = result.text || '';
      await parser.destroy();
    } catch (e) {
      return res.status(500).json({ error: `PDF parsing failed: ${e.message}` });
    }

    const proposal = await Proposal.create({
      project: project._id,
      file: file.originalname,
      parsedText: text,
      uploadedBy: req.user._id,
    });

    const preview = text.length > 300 ? text.slice(0, 300) + '...' : text;
    return res.status(201).json({
      message: 'Proposal uploaded and parsed successfully',
      proposal_id: proposal._id.toString(),
      project_id: project._id.toString(),
      parsed_text_preview: preview,
    });
  } catch (err) {
    next(err);
  }
}

async function saveOverviewToMongo(projectId, data) {
  const set = {};
  if (data.title != null) set.title = data.title;
  if (data.summary != null) set.summary = data.summary;
  if (Object.keys(set).length) await Project.updateOne({ _id: projectId }, { $set: set });
  await ProjectFeature.deleteMany({ project: projectId });
  await ProjectRole.deleteMany({ project: projectId });
  await ProjectGoal.deleteMany({ project: projectId });
  const weeks = await TimelineWeek.find({ project: projectId });
  const weekIds = weeks.map((w) => w._id);
  await TimelineItem.deleteMany({ week: { $in: weekIds } });
  await TimelineWeek.deleteMany({ project: projectId });
  if (data.features?.length) {
    await ProjectFeature.insertMany(data.features.map((t) => ({ project: projectId, title: t, ai: true })));
  }
  if (data.roles?.length) {
    await ProjectRole.insertMany(data.roles.map((r) => ({ project: projectId, role: r, ai: true })));
  }
  if (data.goals?.length) {
    await ProjectGoal.insertMany(
      data.goals.map((g) => ({
        project: projectId,
        title: typeof g === 'string' ? g : g.title,
        role: typeof g === 'object' && g.role != null ? g.role : null,
        ai: true,
      }))
    );
  }
  if (data.timeline?.length) {
    for (const w of data.timeline) {
      const weekNum = typeof w === 'object' ? w.week_number : w;
      const goals = (typeof w === 'object' && w.goals) || [];
      const week = await TimelineWeek.create({ project: projectId, week_number: weekNum });
      if (goals.length) {
        await TimelineItem.insertMany(goals.map((g) => ({ week: week._id, title: typeof g === 'string' ? g : g.title })));
      }
    }
  }
}

function buildOverviewResponse(project, data) {
  const features = data.features || [];
  const roles = data.roles || [];
  const goals = data.goals || [];
  const timeline = data.timeline || [];
  return {
    id: project._id.toString(),
    title: data.title ?? project.title,
    summary: data.summary ?? project.summary,
    features,
    roles,
    goals,
    timeline,
  };
}

async function saveBacklogToMongo(projectId, data) {
  const epics = data.epics || [];
  const existingEpics = await Epic.find({ project: projectId });
  for (const e of existingEpics) {
    const subEpics = await SubEpic.find({ epic: e._id });
    for (const se of subEpics) {
      const stories = await UserStory.find({ subEpic: se._id });
      for (const s of stories) {
        await StoryTask.deleteMany({ userStory: s._id });
      }
      await UserStory.deleteMany({ subEpic: se._id });
    }
    await SubEpic.deleteMany({ epic: e._id });
  }
  await Epic.deleteMany({ project: projectId });
  for (const epic of epics) {
    const createdEpic = await Epic.create({
      project: projectId,
      title: epic.title,
      description: epic.description ?? null,
      ai: epic.ai !== false,
    });
    for (const sub of epic.sub_epics || []) {
      const createdSub = await SubEpic.create({
        epic: createdEpic._id,
        title: sub.title,
        ai: sub.ai !== false,
      });
      for (const story of sub.user_stories || []) {
        const createdStory = await UserStory.create({
          subEpic: createdSub._id,
          title: story.title,
          ai: story.ai !== false,
        });
        for (const task of story.tasks || []) {
          await StoryTask.create({
            userStory: createdStory._id,
            title: task.title,
            description: task.description ?? '',
            status: task.status ?? 'pending',
            ai: task.ai !== false,
          });
        }
      }
    }
  }
}

async function getProjectBacklogData(projectId) {
  const epics = await Epic.find({ project: projectId }).sort({ createdAt: 1 });
  const result = [];
  for (const epic of epics) {
    const subEpics = await SubEpic.find({ epic: epic._id }).sort({ createdAt: 1 });
    const subEpicsData = [];
    for (const se of subEpics) {
      const stories = await UserStory.find({ subEpic: se._id }).sort({ createdAt: 1 });
      const storiesData = [];
      for (const us of stories) {
        const tasks = await StoryTask.find({ userStory: us._id }).populate('assignee').sort({ createdAt: 1 });
        storiesData.push({
          id: us._id.toString(),
          title: us.title,
          ai: us.ai,
          is_complete: us.isComplete,
          tasks: tasks.map((t) => ({
            id: t._id.toString(),
            title: t.title,
            status: t.status,
            assignee: t.assignee?._id?.toString?.(),
            ai: t.ai,
          })),
        });
      }
      subEpicsData.push({
        id: se._id.toString(),
        title: se.title,
        ai: se.ai,
        is_complete: se.isComplete,
        user_stories: storiesData,
      });
    }
    result.push({
      id: epic._id.toString(),
      title: epic.title,
      description: epic.description,
      ai: epic.ai,
      is_complete: epic.isComplete,
      sub_epics: subEpicsData,
    });
  }
  return result;
}

export async function getProjectBacklog(req, res, next) {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ detail: 'Not found' });
    const isMember = await ProjectMember.findOne({ project: project._id, user: req.user._id });
    if (!isMember) return res.status(403).json({ detail: 'Not a member' });
    const backlog = await getProjectBacklogData(project._id);
    return res.json(backlog);
  } catch (err) {
    next(err);
  }
}

function projectToResponse(p) {
  return {
    id: p._id.toString(),
    title: p.title,
    summary: p.summary,
    status: p.status,
    status_updated_at: p.statusUpdatedAt,
    status_updated_by_name: p.statusUpdatedBy?.name,
    created_by: p.createdBy?._id?.toString?.(),
    created_by_name: p.createdBy?.name,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

// Project features, roles, goals, timeline
export async function listProjectFeatures(req, res, next) {
  try {
    const projectId = req.query.project_id || req.query.project;
    const isMember = projectId && (await ProjectMember.findOne({ project: projectId, user: req.user._id }));
    if (!isMember) return res.status(403).json({ detail: 'Not a member' });
    const items = await ProjectFeature.find({ project: projectId }).sort({ createdAt: 1 });
    return res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function createProjectFeature(req, res, next) {
  try {
    const projectId = req.body.project;
    const isMember = await ProjectMember.findOne({ project: projectId, user: req.user._id });
    if (!isMember) return res.status(403).json({ detail: 'Not a member' });
    const item = await ProjectFeature.create({
      project: projectId,
      title: req.body.title || 'Feature',
      ai: req.body.ai !== false,
    });
    broadcastToProject(projectId, 'project_feature_update', 'created', item, req.user);
    return res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

export async function listProjectRoles(req, res, next) {
  try {
    const projectId = req.query.project_id || req.query.project;
    const isMember = projectId && (await ProjectMember.findOne({ project: projectId, user: req.user._id }));
    if (!isMember) return res.status(403).json({ detail: 'Not a member' });
    const items = await ProjectRole.find({ project: projectId }).sort({ createdAt: 1 });
    return res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function createProjectRole(req, res, next) {
  try {
    const projectId = req.body.project;
    const isMember = await ProjectMember.findOne({ project: projectId, user: req.user._id });
    if (!isMember) return res.status(403).json({ detail: 'Not a member' });
    const item = await ProjectRole.create({
      project: projectId,
      role: req.body.role || 'Role',
      ai: req.body.ai !== false,
    });
    broadcastToProject(projectId, 'project_role_update', 'created', item, req.user);
    return res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

export async function listProjectGoals(req, res, next) {
  try {
    const projectId = req.query.project_id || req.query.project;
    const isMember = projectId && (await ProjectMember.findOne({ project: projectId, user: req.user._id }));
    if (!isMember) return res.status(403).json({ detail: 'Not a member' });
    const items = await ProjectGoal.find({ project: projectId }).sort({ createdAt: 1 });
    return res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function createProjectGoal(req, res, next) {
  try {
    const projectId = req.body.project;
    const isMember = await ProjectMember.findOne({ project: projectId, user: req.user._id });
    if (!isMember) return res.status(403).json({ detail: 'Not a member' });
    const item = await ProjectGoal.create({
      project: projectId,
      title: req.body.title || 'Goal',
      role: req.body.role ?? null,
      ai: req.body.ai !== false,
    });
    broadcastToProject(projectId, 'project_goal_update', 'created', item, req.user);
    return res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

export async function listTimelineWeeks(req, res, next) {
  try {
    const projectId = req.query.project_id || req.query.project;
    const isMember = projectId && (await ProjectMember.findOne({ project: projectId, user: req.user._id }));
    if (!isMember) return res.status(403).json({ detail: 'Not a member' });
    const items = await TimelineWeek.find({ project: projectId }).sort({ week_number: 1 });
    return res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function createTimelineWeek(req, res, next) {
  try {
    const projectId = req.body.project;
    const isMember = await ProjectMember.findOne({ project: projectId, user: req.user._id });
    if (!isMember) return res.status(403).json({ detail: 'Not a member' });
    const item = await TimelineWeek.create({
      project: projectId,
      week_number: req.body.week_number ?? 1,
    });
    broadcastToProject(projectId, 'timeline_update', 'created', item, req.user);
    return res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

export async function listTimelineItems(req, res, next) {
  try {
    const weekId = req.query.week_id || req.query.week;
    const week = await TimelineWeek.findById(weekId);
    if (!week) return res.status(404).json({ detail: 'Not found' });
    const isMember = await ProjectMember.findOne({ project: week.project, user: req.user._id });
    if (!isMember) return res.status(403).json({ detail: 'Not a member' });
    const items = await TimelineItem.find({ week: weekId }).sort({ createdAt: 1 });
    return res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function createTimelineItem(req, res, next) {
  try {
    const weekId = req.body.week;
    const week = await TimelineWeek.findById(weekId).populate('project');
    if (!week) return res.status(404).json({ detail: 'Not found' });
    const projectId = week.project?._id || week.project;
    const isMember = await ProjectMember.findOne({ project: projectId, user: req.user._id });
    if (!isMember) return res.status(403).json({ detail: 'Not a member' });
    const item = await TimelineItem.create({
      week: weekId,
      title: req.body.title || 'Item',
    });
    broadcastToProject(projectId, 'timeline_update', 'created', item, req.user);
    return res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

// Epics CRUD
export async function listEpics(req, res, next) {
  try {
    const projectId = req.query.project;
    const isMember = projectId && (await ProjectMember.findOne({ project: projectId, user: req.user._id }));
    if (!isMember) return res.status(403).json({ detail: 'Not a member' });
    const epics = await Epic.find({ project: projectId }).sort({ createdAt: 1 });
    return res.json(epics.map((e) => ({ id: e._id, project: e.project, title: e.title, description: e.description, ai: e.ai, is_complete: e.isComplete })));
  } catch (err) {
    next(err);
  }
}

export async function createEpic(req, res, next) {
  try {
    const projectId = req.body.project;
    const isMember = await ProjectMember.findOne({ project: projectId, user: req.user._id });
    if (!isMember) return res.status(403).json({ detail: 'Not a member' });
    const epic = await Epic.create({
      project: projectId,
      title: req.body.title || 'Epic',
      description: req.body.description,
      ai: req.body.ai !== false,
    });
    broadcastToProject(projectId, 'epic_update', 'created', epic, req.user);
    return res.status(201).json(epic);
  } catch (err) {
    next(err);
  }
}

export async function getEpic(req, res, next) {
  try {
    const epic = await Epic.findById(req.params.id).populate('project');
    if (!epic) return res.status(404).json({ detail: 'Not found' });
    const isMember = await ProjectMember.findOne({ project: epic.project._id, user: req.user._id });
    if (!isMember) return res.status(403).json({ detail: 'Not a member' });
    return res.json(epic);
  } catch (err) {
    next(err);
  }
}

export async function updateEpic(req, res, next) {
  try {
    const epic = await Epic.findById(req.params.id).populate('project');
    if (!epic) return res.status(404).json({ detail: 'Not found' });
    const isMember = await ProjectMember.findOne({ project: epic.project._id, user: req.user._id });
    if (!isMember) return res.status(403).json({ detail: 'Not a member' });
    if (req.body.title) epic.title = req.body.title;
    if (req.body.description !== undefined) epic.description = req.body.description;
    if (req.body.is_complete !== undefined) epic.isComplete = req.body.is_complete;
    await epic.save();
    broadcastToProject(epic.project._id, 'epic_update', 'updated', epic, req.user);
    return res.json(epic);
  } catch (err) {
    next(err);
  }
}

export async function deleteEpic(req, res, next) {
  try {
    const epic = await Epic.findById(req.params.id).populate('project');
    if (!epic) return res.status(404).json({ detail: 'Not found' });
    const isMember = await ProjectMember.findOne({ project: epic.project._id, user: req.user._id });
    if (!isMember) return res.status(403).json({ detail: 'Not a member' });
    await Epic.deleteOne({ _id: epic._id });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// SubEpics, UserStories, StoryTasks - similar CRUD (simplified for brevity)
export async function listSubEpics(req, res, next) {
  const epicId = req.query.epic;
  const epic = await Epic.findById(epicId);
  if (!epic) return res.status(404).json({ detail: 'Not found' });
  const isMember = await ProjectMember.findOne({ project: epic.project, user: req.user._id });
  if (!isMember) return res.status(403).json({ detail: 'Not a member' });
  const items = await SubEpic.find({ epic: epicId });
  return res.json(items);
}

export async function createSubEpic(req, res, next) {
  const epic = await Epic.findById(req.body.epic).populate('project');
  if (!epic) return res.status(404).json({ detail: 'Not found' });
  const isMember = await ProjectMember.findOne({ project: epic.project._id, user: req.user._id });
  if (!isMember) return res.status(403).json({ detail: 'Not a member' });
  const item = await SubEpic.create({ epic: epic._id, title: req.body.title || 'Sub-epic', ai: req.body.ai !== false });
  broadcastToProject(epic.project._id, 'sub_epic_update', 'created', item, req.user);
  return res.status(201).json(item);
}

export async function listUserStories(req, res, next) {
  const subEpicId = req.query.sub_epic;
  const subEpic = await SubEpic.findById(subEpicId).populate({ path: 'epic', populate: 'project' });
  if (!subEpic) return res.status(404).json({ detail: 'Not found' });
  const isMember = await ProjectMember.findOne({ project: subEpic.epic.project._id, user: req.user._id });
  if (!isMember) return res.status(403).json({ detail: 'Not a member' });
  const items = await UserStory.find({ subEpic: subEpicId });
  return res.json(items);
}

export async function createUserStory(req, res, next) {
  const subEpic = await SubEpic.findById(req.body.sub_epic).populate({ path: 'epic', populate: 'project' });
  if (!subEpic) return res.status(404).json({ detail: 'Not found' });
  const isMember = await ProjectMember.findOne({ project: subEpic.epic.project._id, user: req.user._id });
  if (!isMember) return res.status(403).json({ detail: 'Not a member' });
  const item = await UserStory.create({ subEpic: subEpic._id, title: req.body.title || 'Story', ai: req.body.ai !== false });
  broadcastToProject(subEpic.epic.project._id, 'user_story_update', 'created', item, req.user);
  return res.status(201).json(item);
}

export async function listStoryTasks(req, res, next) {
  const userStoryId = req.query.user_story;
  const story = await UserStory.findById(userStoryId).populate({ path: 'subEpic', populate: { path: 'epic', populate: 'project' } });
  if (!story) return res.status(404).json({ detail: 'Not found' });
  const isMember = await ProjectMember.findOne({ project: story.subEpic.epic.project._id, user: req.user._id });
  if (!isMember) return res.status(403).json({ detail: 'Not a member' });
  const items = await StoryTask.find({ userStory: userStoryId }).populate('assignee');
  return res.json(items);
}

export async function createStoryTask(req, res, next) {
  const story = await UserStory.findById(req.body.user_story).populate({ path: 'subEpic', populate: { path: 'epic', populate: 'project' } });
  if (!story) return res.status(404).json({ detail: 'Not found' });
  const isMember = await ProjectMember.findOne({ project: story.subEpic.epic.project._id, user: req.user._id });
  if (!isMember) return res.status(403).json({ detail: 'Not a member' });
  const item = await StoryTask.create({
    userStory: story._id,
    title: req.body.title || 'Task',
    status: req.body.status || 'pending',
    ai: req.body.ai !== false,
    assignee: req.body.assignee || null,
    commitTitle: req.body.commit_title,
    commitBranch: req.body.commit_branch,
    dueDate: req.body.due_date,
  });
  broadcastToProject(story.subEpic.epic.project._id, 'task_update', 'created', item, req.user);
  return res.status(201).json(item);
}

export async function updateStoryTask(req, res, next) {
  const task = await StoryTask.findById(req.params.id).populate({ path: 'userStory', populate: { path: 'subEpic', populate: { path: 'epic', populate: 'project' } } });
  if (!task) return res.status(404).json({ detail: 'Not found' });
  const projectId = task.userStory?.subEpic?.epic?.project?._id;
  const isMember = projectId && (await ProjectMember.findOne({ project: projectId, user: req.user._id }));
  if (!isMember) return res.status(403).json({ detail: 'Not a member' });
  if (req.body.title) task.title = req.body.title;
  if (req.body.status) task.status = req.body.status;
  if (req.body.assignee !== undefined) task.assignee = req.body.assignee;
  if (req.body.commit_title !== undefined) task.commitTitle = req.body.commit_title;
  if (req.body.commit_branch !== undefined) task.commitBranch = req.body.commit_branch;
  if (req.body.due_date !== undefined) task.dueDate = req.body.due_date;
  await task.save();
  broadcastToProject(projectId, 'task_update', 'updated', task, req.user);
  return res.json(task);
}

export async function getProjectStatistics(req, res, next) {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ detail: 'Not found' });
    const isMember = await ProjectMember.findOne({ project: project._id, user: req.user._id });
    if (!isMember) return res.status(403).json({ detail: 'Not a member' });
    const epics = await Epic.find({ project: project._id });
    const epicIds = epics.map((e) => e._id);
    const subEpics = await SubEpic.find({ epic: { $in: epicIds } });
    const subEpicIds = subEpics.map((s) => s._id);
    const stories = await UserStory.find({ subEpic: { $in: subEpicIds } });
    const storyIds = stories.map((s) => s._id);
    const taskCount = await StoryTask.countDocuments({ userStory: { $in: storyIds } });
    return res.json({ task_count: taskCount, sprint_count: 0 });
  } catch (err) {
    next(err);
  }
}

export async function deleteProjectMember(req, res, next) {
  try {
    const member = await ProjectMember.findById(req.params.id).populate('project');
    if (!member) return res.status(404).json({ detail: 'Not found' });
    const projectId = member.project?._id || member.project;
    const actor = await ProjectMember.findOne({ project: projectId, user: req.user._id });
    if (!actor || actor.role !== 'Owner') return res.status(403).json({ detail: 'Only owner can remove members' });
    if (member.role === 'Owner') return res.status(403).json({ detail: 'Cannot remove owner' });
    await ProjectMember.deleteOne({ _id: member._id });
    broadcastToProject(projectId, 'member_update', 'removed', { id: member._id.toString() }, req.user);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function listStoryTasksUserAssigned(req, res, next) {
  try {
    const myMemberIds = await ProjectMember.find({ user: req.user._id }).distinct('_id');
    if (myMemberIds.length === 0) return res.json([]);
    const tasks = await StoryTask.find({ assignee: { $in: myMemberIds } })
      .populate('userStory')
      .sort({ updatedAt: -1 });
    return res.json(tasks);
  } catch (err) {
    next(err);
  }
}

export async function listStoryTasksRecentCompleted(req, res, next) {
  try {
    const projectIds = await ProjectMember.find({ user: req.user._id }).distinct('project');
    const epics = await Epic.find({ project: { $in: projectIds } });
    const subEpics = await SubEpic.find({ epic: { $in: epics.map((e) => e._id) } });
    const stories = await UserStory.find({ subEpic: { $in: subEpics.map((s) => s._id) } });
    const tasks = await StoryTask.find({
      userStory: { $in: stories.map((s) => s._id) },
      status: 'done',
    })
      .populate('userStory')
      .sort({ updatedAt: -1 })
      .limit(20);
    return res.json(tasks);
  } catch (err) {
    next(err);
  }
}

export async function bulkAssignStoryTasks(req, res, next) {
  try {
    const { task_ids, assignee_id } = req.body;
    if (!Array.isArray(task_ids) || task_ids.length === 0)
      return res.status(400).json({ detail: 'task_ids array required' });
    const tasks = await StoryTask.find({ _id: { $in: task_ids } })
      .populate({ path: 'userStory', populate: { path: 'subEpic', populate: 'epic' } });
    let projectId = null;
    for (const t of tasks) {
      const epic = t.userStory?.subEpic?.epic;
      if (epic) {
        projectId = epic.project;
        const isMember = await ProjectMember.findOne({ project: projectId, user: req.user._id });
        if (!isMember) return res.status(403).json({ detail: 'Not a member for one or more tasks' });
      }
    }
    await StoryTask.updateMany(
      { _id: { $in: task_ids } },
      { $set: { assignee: assignee_id || null } }
    );
    const updated = await StoryTask.find({ _id: { $in: task_ids } }).populate('assignee');
    if (projectId) broadcastToProject(projectId, 'task_update', 'bulk_assign', updated, req.user);
    return res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteNotification(req, res, next) {
  try {
    const notif = await Notification.findOne({ _id: req.params.id, recipient: req.user._id });
    if (!notif) return res.status(404).json({ detail: 'Not found' });
    await Notification.deleteOne({ _id: notif._id });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getNotificationsUnreadCount(req, res, next) {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    return res.json({ unread_count: count });
  } catch (err) {
    next(err);
  }
}

export async function listMyInvitations(req, res, next) {
  try {
    const invs = await ProjectInvitation.find({ invitee: req.user._id })
      .populate('project')
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 });
    return res.json(invs);
  } catch (err) {
    next(err);
  }
}

export async function declineInvitation(req, res, next) {
  try {
    const inv = await ProjectInvitation.findById(req.params.id);
    if (!inv) return res.status(404).json({ detail: 'Not found' });
    if (inv.invitee.toString() !== req.user._id.toString()) return res.status(403).json({ detail: 'Not your invitation' });
    if (inv.status !== 'pending') return res.status(400).json({ detail: 'Invitation no longer valid' });
    inv.status = 'declined';
    await inv.save();
    return res.json(inv);
  } catch (err) {
    next(err);
  }
}

export async function listProjectMembers(req, res, next) {
  const projectId = req.query.project;
  const isMember = await ProjectMember.findOne({ project: projectId, user: req.user._id });
  if (!isMember) return res.status(403).json({ detail: 'Not a member' });
  const members = await ProjectMember.find({ project: projectId }).populate('user', 'name email');
  return res.json(members);
}

export async function createProjectMember(req, res, next) {
  const { User } = await import('../models/User.js');
  const projectId = req.body.project;
  const project = await Project.findById(projectId);
  if (!project) return res.status(404).json({ detail: 'Not found' });
  const inviter = await ProjectMember.findOne({ project: projectId, user: req.user._id });
  if (!inviter || inviter.role !== 'Owner') return res.status(403).json({ detail: 'Only owner can add members' });
  const user = await User.findById(req.body.user).catch(() => null) || await User.findOne({ email: req.body.user_email });
  if (!user) return res.status(404).json({ detail: 'User not found' });
  const existing = await ProjectMember.findOne({ project: projectId, user: user._id });
  if (existing) return res.status(400).json({ detail: 'Already a member' });
  const member = await ProjectMember.create({
    project: projectId,
    user: user._id,
    userName: user.name,
    userEmail: user.email,
    role: req.body.role || 'Member',
  });
  broadcastToProject(projectId, 'member_update', 'created', member, req.user);
  return res.status(201).json(member);
}

export async function listInvitations(req, res, next) {
  const projectId = req.query.project;
  const inviteeId = req.query.invitee;
  let q = {};
  if (projectId) q.project = projectId;
  if (inviteeId) q.invitee = inviteeId;
  const invs = await ProjectInvitation.find(q).populate('project invitee invitedBy');
  return res.json(invs);
}

export async function createInvitation(req, res, next) {
  const projectId = req.body.project;
  const project = await Project.findById(projectId);
  if (!project) return res.status(404).json({ detail: 'Not found' });
  const inviter = await ProjectMember.findOne({ project: projectId, user: req.user._id });
  if (!inviter || inviter.role !== 'Owner') return res.status(403).json({ detail: 'Only owner can invite' });
  const { User } = await import('../models/User.js');
  const invitee = await User.findById(req.body.invitee).catch(() => null) || await User.findOne({ email: req.body.invitee_email });
  if (!invitee) return res.status(404).json({ detail: 'Invitee not found' });
  if (invitee._id.toString() === req.user._id.toString()) return res.status(400).json({ detail: 'Cannot invite yourself' });
  const existing = await ProjectMember.findOne({ project: projectId, user: invitee._id });
  if (existing) return res.status(400).json({ detail: 'User is already a member' });
  const inv = await ProjectInvitation.create({
    project: projectId,
    invitee: invitee._id,
    invitedBy: req.user._id,
    status: 'pending',
    role: req.body.role || 'Member',
    message: req.body.message,
  });
  return res.status(201).json(inv);
}

export async function acceptInvitation(req, res, next) {
  const inv = await ProjectInvitation.findById(req.params.id).populate('project');
  if (!inv) return res.status(404).json({ detail: 'Not found' });
  if (inv.invitee.toString() !== req.user._id.toString()) return res.status(403).json({ detail: 'Not your invitation' });
  if (inv.status !== 'pending') return res.status(400).json({ detail: 'Invitation no longer valid' });
  inv.status = 'accepted';
  await inv.save();
  const existingMember = await ProjectMember.findOne({ project: inv.project._id, user: req.user._id });
  if (!existingMember) await ProjectMember.create({
      project: inv.project._id,
      user: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      role: inv.role,
    });
  broadcastToProject(inv.project._id, 'member_update', 'created', { user: req.user._id }, req.user);
  return res.json(inv);
}

export async function listNotifications(req, res, next) {
  const items = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(50).populate('actor', 'name');
  return res.json(items);
}

export async function markNotificationRead(req, res, next) {
  const notif = await Notification.findOne({ _id: req.params.id, recipient: req.user._id });
  if (!notif) return res.status(404).json({ detail: 'Not found' });
  notif.isRead = true;
  notif.readAt = new Date();
  await notif.save();
  return res.json(notif);
}

export async function markAllNotificationsRead(req, res, next) {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    return res.json({ status: 'all marked as read' });
  } catch (err) {
    next(err);
  }
}
