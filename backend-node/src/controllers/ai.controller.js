import { prisma } from '../lib/prisma.js';
import { broadcast } from '../services/broadcast.service.js';
import { callAIService } from '../services/ai.service.js';
import { PDFParse } from 'pdf-parse';

function getUserId(req) {
  return req.user?.user_id ?? req.user?._id;
}

async function getProjectMemberIds(projectId) {
  const members = await prisma.ai_api_projectmember.findMany({
    where: { project_id: projectId },
    select: { user_id: true },
  });
  return members.map((m) => Number(m.user_id));
}

function broadcastToProject(projectId, eventType, action, data, actor) {
  getProjectMemberIds(projectId).then((userIds) => {
    userIds.forEach((uid) => {
      const room = `user_${uid}_updates`;
      broadcast(room, {
        type: eventType,
        action,
        project_id: projectId,
        data: toJsonSafe(data),
        actor: { id: actor ? String(actor.user_id ?? actor._id) : undefined, name: actor?.name },
      });
    });
  });
}

async function ensureProjectMember(projectId, userId) {
  const member = await prisma.ai_api_projectmember.findFirst({
    where: { project_id: Number(projectId), user_id: BigInt(userId) },
  });
  return member;
}

function getProjectIdFromQuery(query) {
  const raw = query?.project_id ?? query?.project;
  if (raw === undefined || raw === null || raw === '') return null;
  const projectId = Number(raw);
  return Number.isFinite(projectId) ? projectId : null;
}

function toJsonSafe(value) {
  if (typeof value === 'bigint') return Number(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map((v) => toJsonSafe(v));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = toJsonSafe(v);
    }
    return out;
  }
  return value;
}

function projectToResponse(p, createdBy, statusUpdatedBy) {
  return {
    id: String(p.id),
    title: p.title,
    summary: p.summary,
    status: p.status,
    status_updated_at: p.status_updated_at,
    status_updated_by_name: statusUpdatedBy?.name,
    created_by: createdBy ? String(createdBy.user_id) : String(p.created_by_id),
    created_by_name: createdBy?.name,
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}

async function createNotification({ recipientId, actorId = null, notificationType, title, message, objectId = null, actionUrl = null }) {
  await prisma.ai_api_notification.create({
    data: {
      recipient_id: Number(recipientId),
      actor_id: actorId != null ? Number(actorId) : null,
      notification_type: notificationType,
      title,
      message,
      object_id: objectId,
      action_url: actionUrl,
      is_read: false,
      created_at: new Date(),
      read_at: null,
      content_type_id: null,
    },
  });
}

export async function listProjects(req, res, next) {
  try {
    const userId = getUserId(req);
    const members = await prisma.ai_api_projectmember.findMany({
      where: { user_id: BigInt(userId) },
      select: { project_id: true },
    });
    const projectIds = [...new Set(members.map((m) => m.project_id))];
    const projects = await prisma.ai_api_project.findMany({
      where: { id: { in: projectIds } },
    });
    const createdByIds = [...new Set(projects.map((p) => Number(p.created_by_id)).filter(Boolean))];
    const statusByIds = [...new Set(projects.map((p) => p.status_updated_by_id).filter(Boolean))];
    const users = await prisma.user.findMany({
      where: { user_id: { in: [...createdByIds, ...statusByIds] } },
      select: { user_id: true, name: true, email: true },
    });
    const userMap = Object.fromEntries(users.map((u) => [u.user_id, u]));
    const data = projects.map((p) => {
      const createdBy = userMap[Number(p.created_by_id)];
      const statusBy = p.status_updated_by_id ? userMap[p.status_updated_by_id] : null;
      return projectToResponse(p, createdBy, statusBy);
    });
    return res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getProject(req, res, next) {
  try {
    const projectId = Number(req.params.id);
    const project = await prisma.ai_api_project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(projectId, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });
    const createdBy = await prisma.user.findUnique({ where: { user_id: Number(project.created_by_id) }, select: { user_id: true, name: true, email: true } });
    const statusBy = project.status_updated_by_id
      ? await prisma.user.findUnique({ where: { user_id: project.status_updated_by_id }, select: { user_id: true, name: true } })
      : null;
    return res.json(projectToResponse(project, createdBy, statusBy));
  } catch (err) {
    next(err);
  }
}

export async function createProject(req, res, next) {
  try {
    const userId = getUserId(req);
    const user = await prisma.user.findUnique({ where: { user_id: userId }, select: { name: true, email: true } });
    const project = await prisma.ai_api_project.create({
      data: {
        title: req.body.title || 'Untitled',
        summary: req.body.summary ?? null,
        status: req.body.status || 'in_progress',
        created_at: new Date(),
        created_by_id: BigInt(userId),
      },
    });
    await prisma.ai_api_projectmember.create({
      data: {
        project_id: project.id,
        user_id: BigInt(userId),
        user_name: user.name,
        user_email: user.email,
        role: 'Owner',
        joined_at: new Date(),
      },
    });
    const resp = projectToResponse(project, { user_id: userId, name: user.name, email: user.email }, null);
    broadcastToProject(project.id, 'project_update', 'created', resp, req.user);
    return res.status(201).json(resp);
  } catch (err) {
    next(err);
  }
}

export async function getCurrentProposal(req, res, next) {
  try {
    const projectId = Number(req.params.id);
    const project = await prisma.ai_api_project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(projectId, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });

    const proposal = await prisma.ai_api_proposal.findFirst({
      where: { project_id: projectId },
      orderBy: { uploaded_at: 'desc' },
    });

    if (!proposal || !proposal.parsed_text) {
      return res.json(null);
    }

    return res.json({
      id: String(proposal.id),
      parsed_text: proposal.parsed_text,
      uploaded_at: proposal.uploaded_at,
      file: proposal.file,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProject(req, res, next) {
  try {
    const projectId = Number(req.params.id);
    const project = await prisma.ai_api_project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(projectId, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });

    const data = {};
    if (req.body.title) data.title = req.body.title;
    if (req.body.summary !== undefined) data.summary = req.body.summary;
    if (req.body.status) {
      data.status = req.body.status;
      data.status_updated_at = new Date();
      data.status_updated_by_id = getUserId(req);
    }
    const updated = await prisma.ai_api_project.update({
      where: { id: projectId },
      data,
    });
    const statusBy = updated.status_updated_by_id
      ? await prisma.user.findUnique({ where: { user_id: updated.status_updated_by_id }, select: { name: true } })
      : null;
    const createdBy = await prisma.user.findUnique({ where: { user_id: Number(updated.created_by_id) }, select: { user_id: true, name: true } });
    const resp = projectToResponse(updated, createdBy, statusBy);
    broadcastToProject(projectId, 'project_update', 'updated', resp, req.user);
    return res.json(resp);
  } catch (err) {
    next(err);
  }
}

export async function updateProjectStatus(req, res, next) {
  return updateProject(req, res, next);
}

export async function deleteProject(req, res, next) {
  try {
    const projectId = Number(req.params.id);
    const project = await prisma.ai_api_project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(projectId, getUserId(req));
    if (!member || member.role !== 'Owner') return res.status(403).json({ detail: 'Only owner can delete' });
    await prisma.ai_api_project.delete({ where: { id: projectId } });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function saveOverviewToDb(projectId, data) {
  const set = {};
  if (data.title != null) set.title = data.title;
  if (data.summary != null) set.summary = data.summary;
  if (Object.keys(set).length) await prisma.ai_api_project.update({ where: { id: projectId }, data: set });

  await prisma.ai_api_projectfeature.deleteMany({ where: { project_id: projectId } });
  await prisma.ai_api_projectrole.deleteMany({ where: { project_id: projectId } });
  await prisma.ai_api_projectgoal.deleteMany({ where: { project_id: projectId } });

  const weeks = await prisma.ai_api_timelineweek.findMany({ where: { project_id: projectId } });
  const weekIds = weeks.map((w) => w.id);
  await prisma.ai_api_timelineitem.deleteMany({ where: { week_id: { in: weekIds } } });
  await prisma.ai_api_timelineweek.deleteMany({ where: { project_id: projectId } });

  if (data.features?.length) {
    await prisma.ai_api_projectfeature.createMany({
      data: data.features.map((t) => ({ project_id: projectId, title: t })),
    });
  }
  if (data.roles?.length) {
    await prisma.ai_api_projectrole.createMany({
      data: data.roles.map((r) => ({ project_id: projectId, role: r })),
    });
  }
  if (data.goals?.length) {
    await prisma.ai_api_projectgoal.createMany({
      data: data.goals.map((g) => ({
        project_id: projectId,
        title: typeof g === 'string' ? g : g.title,
        role: typeof g === 'object' && g.role != null ? g.role : null,
      })),
    });
  }
  if (data.timeline?.length) {
    for (const w of data.timeline) {
      const weekNum = typeof w === 'object' ? w.week_number : w;
      const goals = (typeof w === 'object' && w.goals) || [];
      const week = await prisma.ai_api_timelineweek.create({
        data: { project_id: projectId, week_number: weekNum },
      });
      if (goals.length) {
        await prisma.ai_api_timelineitem.createMany({
          data: goals.map((g) => ({ week_id: week.id, title: typeof g === 'string' ? g : g.title })),
        });
      }
    }
  }
}

/**
 * Maps overview timeline (array of { week_number, goals }) to Part 1 format
 * ({ week1: [task strings], week2: [...], ... }) for Model 2 input.
 */
function buildPart1Timeline(timeline) {
  const out = {};
  for (const w of timeline || []) {
    const weekNum = w.week_number ?? 0;
    const key = `week${weekNum}`;
    const tasks = (w.goals || []).map((g) => (typeof g === 'string' ? g : g?.title ?? '')).filter(Boolean);
    out[key] = tasks;
  }
  return Object.keys(out).length ? out : { week1: [], week2: [], week3: [], week4: [] };
}

function buildOverviewResponse(project, data) {
  return {
    id: String(project.id),
    title: data.title ?? project.title,
    summary: data.summary ?? project.summary,
    features: data.features || [],
    roles: data.roles || [],
    goals: data.goals || [],
    timeline: data.timeline || [],
  };
}

export async function ingestProposal(req, res, next) {
  try {
    const projectId = Number(req.params.id);
    const proposalId = Number(req.params.proposal_id);
    const project = await prisma.ai_api_project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(projectId, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });
    const proposal = await prisma.ai_api_proposal.findFirst({
      where: { id: proposalId, project_id: projectId },
    });
    if (!proposal) return res.status(404).json({ detail: 'Proposal not found' });
    if (!proposal.parsed_text) return res.status(400).json({ error: 'Proposal has no parsed text' });

    const result = await callAIService('/generate-overview', { proposal_text: proposal.parsed_text });
    if (result.error) return res.status(result.status).json(result.data);

    await saveOverviewToDb(projectId, result.data);
    const projectUpdated = await prisma.ai_api_project.findUnique({ where: { id: projectId } });
    broadcastToProject(projectId, 'overview_regenerated', 'regenerated', result.data, req.user);
    return res.json(buildOverviewResponse(projectUpdated, result.data));
  } catch (err) {
    next(err);
  }
}

export async function generateOverview(req, res, next) {
  try {
    const projectId = Number(req.params.id);
    const project = await prisma.ai_api_project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(projectId, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });

    const proposal = await prisma.ai_api_proposal.findFirst({
      where: { project_id: projectId },
      orderBy: { uploaded_at: 'desc' },
    });
    if (!proposal?.parsed_text) return res.status(400).json({ detail: 'No proposal with parsed text found' });

    const result = await callAIService('/generate-overview', { proposal_text: proposal.parsed_text });
    if (result.error) return res.status(result.status).json(result.data);

    await saveOverviewToDb(projectId, result.data);
    const projectUpdated = await prisma.ai_api_project.findUnique({ where: { id: projectId } });
    broadcastToProject(projectId, 'overview_regenerated', 'regenerated', result.data, req.user);
    return res.json(buildOverviewResponse(projectUpdated, result.data));
  } catch (err) {
    next(err);
  }
}

async function saveBacklogToDb(projectId, data) {
  const epics = data.epics || [];
  const existingEpics = await prisma.ai_api_epic.findMany({ where: { project_id: projectId } });
  for (const e of existingEpics) {
    const subEpics = await prisma.ai_api_subepic.findMany({ where: { epic_id: e.id } });
    for (const se of subEpics) {
      const stories = await prisma.ai_api_userstory.findMany({ where: { sub_epic_id: se.id } });
      for (const s of stories) {
        await prisma.ai_api_storytask.deleteMany({ where: { user_story_id: s.id } });
      }
      await prisma.ai_api_userstory.deleteMany({ where: { sub_epic_id: se.id } });
    }
    await prisma.ai_api_subepic.deleteMany({ where: { epic_id: e.id } });
  }
  await prisma.ai_api_epic.deleteMany({ where: { project_id: projectId } });

  for (const epic of epics) {
    const createdEpic = await prisma.ai_api_epic.create({
      data: {
        project_id: projectId,
        title: epic.title,
        description: epic.description ?? null,
        ai: epic.ai !== false,
        is_complete: false,
      },
    });
    for (const sub of epic.sub_epics || []) {
      const createdSub = await prisma.ai_api_subepic.create({
        data: {
          epic_id: createdEpic.id,
          title: sub.title,
          ai: sub.ai !== false,
          is_complete: false,
        },
      });
      for (const story of sub.user_stories || []) {
        const createdStory = await prisma.ai_api_userstory.create({
          data: {
            sub_epic_id: createdSub.id,
            title: story.title,
            ai: story.ai !== false,
            is_complete: false,
          },
        });
        for (const task of story.tasks || []) {
          await prisma.ai_api_storytask.create({
            data: {
              user_story_id: createdStory.id,
              title: task.title,
              status: task.status ?? 'pending',
              ai: task.ai !== false,
            },
          });
        }
      }
    }
  }
}

async function getProjectBacklogData(projectId) {
  const epics = await prisma.ai_api_epic.findMany({ where: { project_id: projectId }, orderBy: { id: 'asc' } });
  const result = [];
  for (const epic of epics) {
    const subEpics = await prisma.ai_api_subepic.findMany({ where: { epic_id: epic.id }, orderBy: { id: 'asc' } });
    const subEpicsData = [];
    for (const se of subEpics) {
      const stories = await prisma.ai_api_userstory.findMany({ where: { sub_epic_id: se.id }, orderBy: { id: 'asc' } });
      const storiesData = [];
      for (const us of stories) {
        const tasks = await prisma.ai_api_storytask.findMany({
          where: { user_story_id: us.id },
          include: { ai_api_projectmember: true },
          orderBy: { id: 'asc' },
        });
        storiesData.push({
          id: String(us.id),
          title: us.title,
          ai: us.ai,
          is_complete: us.is_complete,
          tasks: tasks.map((t) => ({
            id: String(t.id),
            title: t.title,
            status: t.status,
            assignee: t.assignee_id ? Number(t.assignee_id) : null,
            assignee_details: t.ai_api_projectmember
              ? {
                  id: Number(t.ai_api_projectmember.id),
                  user_id: Number(t.ai_api_projectmember.user_id),
                  user_name: t.ai_api_projectmember.user_name,
                  user_email: t.ai_api_projectmember.user_email,
                  role: t.ai_api_projectmember.role,
                }
              : null,
            ai: t.ai,
            commit_title: t.commit_title,
            commit_branch: t.commit_branch,
            due_date: t.due_date ? new Date(t.due_date).toISOString().slice(0, 10) : null,
          })),
        });
      }
      subEpicsData.push({
        id: String(se.id),
        title: se.title,
        ai: se.ai,
        is_complete: se.is_complete,
        user_stories: storiesData,
      });
    }
    result.push({
      id: String(epic.id),
      title: epic.title,
      description: epic.description,
      ai: epic.ai,
      is_complete: epic.is_complete,
      sub_epics: subEpicsData,
    });
  }
  return result;
}

export async function generateBacklog(req, res, next) {
  try {
    const projectId = Number(req.params.id);
    const project = await prisma.ai_api_project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(projectId, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });

    const proposal = await prisma.ai_api_proposal.findFirst({
      where: { project_id: projectId },
      orderBy: { uploaded_at: 'desc' },
    });
    if (!proposal?.parsed_text) return res.status(400).json({ detail: 'No proposal with parsed text found' });

    const overviewResult = await callAIService('/generate-overview', { proposal_text: proposal.parsed_text });
    if (overviewResult.error) return res.status(overviewResult.status).json(overviewResult.data);

    const overview = overviewResult.data || {};
    const part1 = {
      summary: overview.summary || project.summary || '',
      roles: overview.roles || [],
      features: overview.features || [],
      goals: (overview.goals || []).map((g) => ({ epic: g.title || '', role: g.role || '' })),
      timeline: buildPart1Timeline(overview.timeline),
    };
    const part1Json = JSON.stringify(part1);

    const result = await callAIService('/generate-backlog', { part1_json: part1Json });
    if (result.error) return res.status(result.status).json(result.data);

    await saveBacklogToDb(projectId, result.data);
    const backlog = await getProjectBacklogData(projectId);
    broadcastToProject(projectId, 'backlog_regenerated', 'regenerated', backlog, req.user);
    return res.json(backlog);
  } catch (err) {
    next(err);
  }
}

export async function uploadProposal(req, res, next) {
  try {
    const file = req.file;
    const projectId = req.body.project_id ? Number(req.body.project_id) : null;

    if (!file || !projectId) {
      return res.status(400).json({ error: 'Missing file or project_id' });
    }

    const project = await prisma.ai_api_project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(projectId, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });

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

    const proposal = await prisma.ai_api_proposal.create({
      data: {
        project_id: projectId,
        file: file.originalname,
        parsed_text: text,
        uploaded_at: new Date(),
        uploaded_by_id: BigInt(getUserId(req)),
      },
    });

    const preview = text.length > 300 ? text.slice(0, 300) + '...' : text;
    return res.status(201).json({
      message: 'Proposal uploaded and parsed successfully',
      proposal_id: String(proposal.id),
      project_id: String(projectId),
      parsed_text_preview: preview,
    });
  } catch (err) {
    next(err);
  }
}

export async function getProjectBacklog(req, res, next) {
  try {
    const projectId = Number(req.params.id);
    const project = await prisma.ai_api_project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(projectId, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });
    const epics = await getProjectBacklogData(projectId);
    return res.json({ epics });
  } catch (err) {
    next(err);
  }
}

// Project features, roles, goals, timeline
export async function listProjectFeatures(req, res, next) {
  try {
    const projectId = getProjectIdFromQuery(req.query);
    if (!projectId) return res.status(400).json({ detail: 'project_id required' });
    const member = await ensureProjectMember(projectId, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });
    const items = await prisma.ai_api_projectfeature.findMany({
      where: { project_id: projectId },
      orderBy: { id: 'asc' },
    });
    return res.json(items.map((i) => ({ ...i, id: Number(i.id) })));
  } catch (err) {
    next(err);
  }
}

export async function createProjectFeature(req, res, next) {
  try {
    const projectId = Number(req.body.project);
    const member = await ensureProjectMember(projectId, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });
    const item = await prisma.ai_api_projectfeature.create({
      data: {
        project_id: projectId,
        title: req.body.title || 'Feature',
      },
    });
    const out = { ...item, id: Number(item.id) };
    broadcastToProject(projectId, 'project_feature_update', 'created', out, req.user);
    return res.status(201).json(out);
  } catch (err) {
    next(err);
  }
}

export async function updateProjectFeature(req, res, next) {
  try {
    const featureId = BigInt(req.params.id);
    const feature = await prisma.ai_api_projectfeature.findUnique({ where: { id: featureId } });
    if (!feature) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(feature.project_id, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });

    const updated = await prisma.ai_api_projectfeature.update({
      where: { id: featureId },
      data: { title: req.body.title ?? feature.title },
    });
    const out = { ...updated, id: Number(updated.id) };
    broadcastToProject(feature.project_id, 'project_feature_update', 'updated', out, req.user);
    return res.json(out);
  } catch (err) {
    next(err);
  }
}

export async function deleteProjectFeature(req, res, next) {
  try {
    const featureId = BigInt(req.params.id);
    const feature = await prisma.ai_api_projectfeature.findUnique({ where: { id: featureId } });
    if (!feature) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(feature.project_id, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });
    await prisma.ai_api_projectfeature.delete({ where: { id: featureId } });
    broadcastToProject(feature.project_id, 'project_feature_update', 'deleted', { id: String(featureId) }, req.user);
    return res.json({ status: 'deleted', id: String(featureId) });
  } catch (err) {
    next(err);
  }
}

export async function listProjectRoles(req, res, next) {
  try {
    const projectId = getProjectIdFromQuery(req.query);
    if (!projectId) return res.status(400).json({ detail: 'project_id required' });
    const member = await ensureProjectMember(projectId, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });
    const items = await prisma.ai_api_projectrole.findMany({
      where: { project_id: projectId },
      orderBy: { id: 'asc' },
    });
    return res.json(items.map((i) => ({ ...i, id: Number(i.id) })));
  } catch (err) {
    next(err);
  }
}

export async function createProjectRole(req, res, next) {
  try {
    const projectId = Number(req.body.project);
    const member = await ensureProjectMember(projectId, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });
    const item = await prisma.ai_api_projectrole.create({
      data: {
        project_id: projectId,
        role: req.body.role || 'Role',
      },
    });
    const out = { ...item, id: Number(item.id) };
    broadcastToProject(projectId, 'project_role_update', 'created', out, req.user);
    return res.status(201).json(out);
  } catch (err) {
    next(err);
  }
}

export async function updateProjectRole(req, res, next) {
  try {
    const roleId = BigInt(req.params.id);
    const role = await prisma.ai_api_projectrole.findUnique({ where: { id: roleId } });
    if (!role) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(role.project_id, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });

    const updated = await prisma.ai_api_projectrole.update({
      where: { id: roleId },
      data: { role: req.body.role ?? role.role },
    });
    const out = { ...updated, id: Number(updated.id) };
    broadcastToProject(role.project_id, 'project_role_update', 'updated', out, req.user);
    return res.json(out);
  } catch (err) {
    next(err);
  }
}

export async function deleteProjectRole(req, res, next) {
  try {
    const roleId = BigInt(req.params.id);
    const role = await prisma.ai_api_projectrole.findUnique({ where: { id: roleId } });
    if (!role) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(role.project_id, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });
    await prisma.ai_api_projectrole.delete({ where: { id: roleId } });
    broadcastToProject(role.project_id, 'project_role_update', 'deleted', { id: String(roleId) }, req.user);
    return res.json({ status: 'deleted', id: String(roleId) });
  } catch (err) {
    next(err);
  }
}

export async function listProjectGoals(req, res, next) {
  try {
    const projectId = getProjectIdFromQuery(req.query);
    if (!projectId) return res.status(400).json({ detail: 'project_id required' });
    const member = await ensureProjectMember(projectId, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });
    const items = await prisma.ai_api_projectgoal.findMany({
      where: { project_id: projectId },
      orderBy: { id: 'asc' },
    });
    return res.json(items.map((i) => ({ ...i, id: Number(i.id) })));
  } catch (err) {
    next(err);
  }
}

export async function createProjectGoal(req, res, next) {
  try {
    const projectId = Number(req.body.project);
    const member = await ensureProjectMember(projectId, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });
    const item = await prisma.ai_api_projectgoal.create({
      data: {
        project_id: projectId,
        title: req.body.title || 'Goal',
        role: req.body.role ?? null,
      },
    });
    const out = { ...item, id: Number(item.id) };
    broadcastToProject(projectId, 'project_goal_update', 'created', out, req.user);
    return res.status(201).json(out);
  } catch (err) {
    next(err);
  }
}

export async function updateProjectGoal(req, res, next) {
  try {
    const goalId = BigInt(req.params.id);
    const goal = await prisma.ai_api_projectgoal.findUnique({ where: { id: goalId } });
    if (!goal) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(goal.project_id, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });

    const updated = await prisma.ai_api_projectgoal.update({
      where: { id: goalId },
      data: {
        title: req.body.title ?? goal.title,
        role: req.body.role !== undefined ? req.body.role : goal.role,
      },
    });
    const out = { ...updated, id: Number(updated.id) };
    broadcastToProject(goal.project_id, 'project_goal_update', 'updated', out, req.user);
    return res.json(out);
  } catch (err) {
    next(err);
  }
}

export async function deleteProjectGoal(req, res, next) {
  try {
    const goalId = BigInt(req.params.id);
    const goal = await prisma.ai_api_projectgoal.findUnique({ where: { id: goalId } });
    if (!goal) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(goal.project_id, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });
    await prisma.ai_api_projectgoal.delete({ where: { id: goalId } });
    broadcastToProject(goal.project_id, 'project_goal_update', 'deleted', { id: String(goalId) }, req.user);
    return res.json({ status: 'deleted', id: String(goalId) });
  } catch (err) {
    next(err);
  }
}

export async function listTimelineWeeks(req, res, next) {
  try {
    const projectId = getProjectIdFromQuery(req.query);
    if (!projectId) return res.status(400).json({ detail: 'project_id required' });
    const member = await ensureProjectMember(projectId, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });
    const items = await prisma.ai_api_timelineweek.findMany({
      where: { project_id: projectId },
      include: { ai_api_timelineitem: true },
      orderBy: { week_number: 'asc' },
    });
    return res.json(items.map((i) => ({
      id: Number(i.id),
      week_number: i.week_number,
      project_id: i.project_id,
      timeline_items: i.ai_api_timelineitem.map((t) => ({ id: Number(t.id), title: t.title, week_id: Number(t.week_id) })),
    })));
  } catch (err) {
    next(err);
  }
}

export async function createTimelineWeek(req, res, next) {
  try {
    const projectId = Number(req.body.project);
    const member = await ensureProjectMember(projectId, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });
    const item = await prisma.ai_api_timelineweek.create({
      data: {
        project_id: projectId,
        week_number: req.body.week_number ?? 1,
      },
    });
    const out = { ...item, id: Number(item.id) };
    broadcastToProject(projectId, 'timeline_update', 'created', out, req.user);
    return res.status(201).json(out);
  } catch (err) {
    next(err);
  }
}

export async function createProjectTimeline(req, res, next) {
  try {
    const projectId = Number(req.body.project);
    const member = await ensureProjectMember(projectId, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });

    const week = await prisma.ai_api_timelineweek.create({
      data: {
        project_id: projectId,
        week_number: req.body.week_number ?? 1,
      },
    });

    const goals = Array.isArray(req.body.goals) ? req.body.goals : [];
    if (goals.length > 0) {
      await prisma.ai_api_timelineitem.createMany({
        data: goals
          .map((g) => (typeof g === 'string' ? g : g?.title))
          .filter(Boolean)
          .map((title) => ({ week_id: week.id, title })),
      });
    }

    const timelineItems = await prisma.ai_api_timelineitem.findMany({ where: { week_id: week.id }, orderBy: { id: 'asc' } });
    const out = {
      id: Number(week.id),
      week_number: week.week_number,
      project_id: week.project_id,
      timeline_items: timelineItems.map((t) => ({ id: Number(t.id), title: t.title, week_id: Number(t.week_id) })),
    };
    broadcastToProject(projectId, 'timeline_update', 'created', out, req.user);
    return res.status(201).json(out);
  } catch (err) {
    next(err);
  }
}

export async function listTimelineItems(req, res, next) {
  try {
    const weekId = BigInt(req.query.week_id || req.query.week);
    const week = await prisma.ai_api_timelineweek.findUnique({ where: { id: weekId } });
    if (!week) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(week.project_id, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });
    const items = await prisma.ai_api_timelineitem.findMany({
      where: { week_id: weekId },
      orderBy: { id: 'asc' },
    });
    return res.json(items.map((i) => ({ ...i, id: Number(i.id) })));
  } catch (err) {
    next(err);
  }
}

export async function createTimelineItem(req, res, next) {
  try {
    const weekId = BigInt(req.body.week);
    const week = await prisma.ai_api_timelineweek.findUnique({ where: { id: weekId } });
    if (!week) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(week.project_id, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });
    const item = await prisma.ai_api_timelineitem.create({
      data: {
        week_id: weekId,
        title: req.body.title || 'Item',
      },
    });
    const out = { ...item, id: Number(item.id) };
    broadcastToProject(week.project_id, 'timeline_update', 'created', out, req.user);
    return res.status(201).json(out);
  } catch (err) {
    next(err);
  }
}

export async function updateTimelineItem(req, res, next) {
  try {
    const itemId = BigInt(req.params.id);
    const item = await prisma.ai_api_timelineitem.findUnique({ where: { id: itemId } });
    if (!item) return res.status(404).json({ detail: 'Not found' });
    const week = await prisma.ai_api_timelineweek.findUnique({ where: { id: item.week_id } });
    if (!week) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(week.project_id, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });

    const updated = await prisma.ai_api_timelineitem.update({
      where: { id: itemId },
      data: { title: req.body.title ?? item.title },
    });
    const out = { ...updated, id: Number(updated.id), week_id: Number(updated.week_id) };
    broadcastToProject(week.project_id, 'timeline_update', 'updated', out, req.user);
    return res.json(out);
  } catch (err) {
    next(err);
  }
}

export async function deleteTimelineItem(req, res, next) {
  try {
    const itemId = BigInt(req.params.id);
    const item = await prisma.ai_api_timelineitem.findUnique({ where: { id: itemId } });
    if (!item) return res.status(404).json({ detail: 'Not found' });
    const week = await prisma.ai_api_timelineweek.findUnique({ where: { id: item.week_id } });
    if (!week) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(week.project_id, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });

    await prisma.ai_api_timelineitem.delete({ where: { id: itemId } });
    broadcastToProject(week.project_id, 'timeline_update', 'deleted', { id: String(itemId) }, req.user);
    return res.json({ status: 'deleted', id: String(itemId) });
  } catch (err) {
    next(err);
  }
}

export async function deleteTimelineWeek(req, res, next) {
  try {
    const weekId = BigInt(req.params.id);
    const week = await prisma.ai_api_timelineweek.findUnique({ where: { id: weekId } });
    if (!week) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(week.project_id, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });

    await prisma.ai_api_timelineweek.delete({ where: { id: weekId } });
    broadcastToProject(week.project_id, 'timeline_update', 'deleted', { id: String(weekId) }, req.user);
    return res.json({ status: 'deleted', id: String(weekId) });
  } catch (err) {
    next(err);
  }
}

// Epics CRUD
export async function listEpics(req, res, next) {
  try {
    const projectId = req.query.project ? Number(req.query.project) : null;
    if (!projectId) return res.status(400).json({ detail: 'project required' });
    const member = await ensureProjectMember(projectId, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });
    const epics = await prisma.ai_api_epic.findMany({
      where: { project_id: projectId },
      orderBy: { id: 'asc' },
    });
    return res.json(epics.map((e) => ({
      id: Number(e.id),
      project: e.project_id,
      title: e.title,
      description: e.description,
      ai: e.ai,
      is_complete: e.is_complete,
    })));
  } catch (err) {
    next(err);
  }
}

export async function createEpic(req, res, next) {
  try {
    const projectId = Number(req.body.project);
    const member = await ensureProjectMember(projectId, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });
    const epic = await prisma.ai_api_epic.create({
      data: {
        project_id: projectId,
        title: req.body.title || 'Epic',
        description: req.body.description ?? null,
        ai: req.body.ai !== false,
        is_complete: false,
      },
    });
    const out = { ...epic, id: Number(epic.id) };
    broadcastToProject(projectId, 'epic_update', 'created', out, req.user);
    return res.status(201).json(out);
  } catch (err) {
    next(err);
  }
}

export async function getEpic(req, res, next) {
  try {
    const epicId = BigInt(req.params.id);
    const epic = await prisma.ai_api_epic.findUnique({ where: { id: epicId } });
    if (!epic) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(epic.project_id, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });
    return res.json({ ...epic, id: Number(epic.id) });
  } catch (err) {
    next(err);
  }
}

export async function updateEpic(req, res, next) {
  try {
    const epicId = BigInt(req.params.id);
    const epic = await prisma.ai_api_epic.findUnique({ where: { id: epicId } });
    if (!epic) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(epic.project_id, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });

    const data = {};
    if (req.body.title) data.title = req.body.title;
    if (req.body.description !== undefined) data.description = req.body.description;
    if (req.body.is_complete !== undefined) data.is_complete = req.body.is_complete;

    const updated = await prisma.ai_api_epic.update({ where: { id: epicId }, data });
    const out = { ...updated, id: Number(updated.id) };
    broadcastToProject(epic.project_id, 'epic_update', 'updated', out, req.user);
    return res.json(out);
  } catch (err) {
    next(err);
  }
}

export async function deleteEpic(req, res, next) {
  try {
    const epicId = BigInt(req.params.id);
    const epic = await prisma.ai_api_epic.findUnique({ where: { id: epicId } });
    if (!epic) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(epic.project_id, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });
    await prisma.ai_api_epic.delete({ where: { id: epicId } });
    broadcastToProject(epic.project_id, 'epic_update', 'deleted', { id: String(epicId) }, req.user);
    return res.json({ status: 'deleted', id: String(epicId) });
  } catch (err) {
    next(err);
  }
}

export async function listSubEpics(req, res, next) {
  try {
    const epicId = BigInt(req.query.epic);
    const epic = await prisma.ai_api_epic.findUnique({ where: { id: epicId } });
    if (!epic) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(epic.project_id, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });
    const items = await prisma.ai_api_subepic.findMany({ where: { epic_id: epicId } });
    return res.json(items.map((i) => toJsonSafe({ ...i, id: Number(i.id) })));
  } catch (err) {
    next(err);
  }
}

export async function createSubEpic(req, res, next) {
  try {
    const epicId = BigInt(req.body.epic);
    const epic = await prisma.ai_api_epic.findUnique({ where: { id: epicId } });
    if (!epic) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(epic.project_id, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });
    const item = await prisma.ai_api_subepic.create({
      data: {
        epic_id: epicId,
        title: req.body.title || 'Sub-epic',
        ai: req.body.ai !== false,
        is_complete: false,
      },
    });
    const out = toJsonSafe({ ...item, id: Number(item.id) });
    broadcastToProject(epic.project_id, 'sub_epic_update', 'created', out, req.user);
    return res.status(201).json(out);
  } catch (err) {
    next(err);
  }
}

export async function updateSubEpic(req, res, next) {
  try {
    const subEpicId = BigInt(req.params.id);
    const subEpic = await prisma.ai_api_subepic.findUnique({
      where: { id: subEpicId },
      include: { ai_api_epic: true },
    });
    if (!subEpic) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(subEpic.ai_api_epic.project_id, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });

    const data = {};
    if (req.body.title !== undefined) data.title = req.body.title;
    if (req.body.is_complete !== undefined) data.is_complete = req.body.is_complete;

    const updated = await prisma.ai_api_subepic.update({ where: { id: subEpicId }, data });
    const out = toJsonSafe({ ...updated, id: Number(updated.id) });
    broadcastToProject(subEpic.ai_api_epic.project_id, 'sub_epic_update', 'updated', out, req.user);
    return res.json(out);
  } catch (err) {
    next(err);
  }
}

export async function deleteSubEpic(req, res, next) {
  try {
    const subEpicId = BigInt(req.params.id);
    const subEpic = await prisma.ai_api_subepic.findUnique({
      where: { id: subEpicId },
      include: { ai_api_epic: true },
    });
    if (!subEpic) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(subEpic.ai_api_epic.project_id, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });

    await prisma.ai_api_subepic.delete({ where: { id: subEpicId } });
    broadcastToProject(subEpic.ai_api_epic.project_id, 'sub_epic_update', 'deleted', { id: String(subEpicId) }, req.user);
    return res.json({ status: 'deleted', id: String(subEpicId) });
  } catch (err) {
    next(err);
  }
}

export async function listUserStories(req, res, next) {
  try {
    const subEpicId = BigInt(req.query.sub_epic);
    const subEpic = await prisma.ai_api_subepic.findUnique({
      where: { id: subEpicId },
      include: { ai_api_epic: true },
    });
    if (!subEpic) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(subEpic.ai_api_epic.project_id, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });
    const items = await prisma.ai_api_userstory.findMany({ where: { sub_epic_id: subEpicId } });
    return res.json(items.map((i) => toJsonSafe({ ...i, id: Number(i.id) })));
  } catch (err) {
    next(err);
  }
}

export async function createUserStory(req, res, next) {
  try {
    const subEpicId = BigInt(req.body.sub_epic);
    const subEpic = await prisma.ai_api_subepic.findUnique({
      where: { id: subEpicId },
      include: { ai_api_epic: true },
    });
    if (!subEpic) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(subEpic.ai_api_epic.project_id, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });
    const item = await prisma.ai_api_userstory.create({
      data: {
        sub_epic_id: subEpicId,
        title: req.body.title || 'Story',
        ai: req.body.ai !== false,
        is_complete: false,
      },
    });
    const out = toJsonSafe({ ...item, id: Number(item.id) });
    broadcastToProject(subEpic.ai_api_epic.project_id, 'user_story_update', 'created', out, req.user);
    return res.status(201).json(out);
  } catch (err) {
    next(err);
  }
}

export async function updateUserStory(req, res, next) {
  try {
    const storyId = BigInt(req.params.id);
    const story = await prisma.ai_api_userstory.findUnique({
      where: { id: storyId },
      include: { ai_api_subepic: { include: { ai_api_epic: true } } },
    });
    if (!story) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(story.ai_api_subepic.ai_api_epic.project_id, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });

    const data = {};
    if (req.body.title !== undefined) data.title = req.body.title;
    if (req.body.is_complete !== undefined) data.is_complete = req.body.is_complete;

    const updated = await prisma.ai_api_userstory.update({ where: { id: storyId }, data });
    const out = toJsonSafe({ ...updated, id: Number(updated.id) });
    broadcastToProject(story.ai_api_subepic.ai_api_epic.project_id, 'user_story_update', 'updated', out, req.user);
    return res.json(out);
  } catch (err) {
    next(err);
  }
}

export async function deleteUserStory(req, res, next) {
  try {
    const storyId = BigInt(req.params.id);
    const story = await prisma.ai_api_userstory.findUnique({
      where: { id: storyId },
      include: { ai_api_subepic: { include: { ai_api_epic: true } } },
    });
    if (!story) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(story.ai_api_subepic.ai_api_epic.project_id, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });

    await prisma.ai_api_userstory.delete({ where: { id: storyId } });
    broadcastToProject(story.ai_api_subepic.ai_api_epic.project_id, 'user_story_update', 'deleted', { id: String(storyId) }, req.user);
    return res.json({ status: 'deleted', id: String(storyId) });
  } catch (err) {
    next(err);
  }
}

export async function listStoryTasks(req, res, next) {
  try {
    const userStoryId = BigInt(req.query.user_story);
    const story = await prisma.ai_api_userstory.findUnique({
      where: { id: userStoryId },
      include: { ai_api_subepic: { include: { ai_api_epic: true } } },
    });
    if (!story) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(story.ai_api_subepic.ai_api_epic.project_id, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });
    const items = await prisma.ai_api_storytask.findMany({
      where: { user_story_id: userStoryId },
      include: { ai_api_projectmember: true },
    });
    return res.json(items.map((t) => toJsonSafe({
      ...t,
      id: Number(t.id),
      assignee: t.assignee_id ? Number(t.assignee_id) : null,
      assignee_details: t.ai_api_projectmember
        ? {
            id: Number(t.ai_api_projectmember.id),
            user_id: Number(t.ai_api_projectmember.user_id),
            user_name: t.ai_api_projectmember.user_name,
            user_email: t.ai_api_projectmember.user_email,
            role: t.ai_api_projectmember.role,
          }
        : null,
    })));
  } catch (err) {
    next(err);
  }
}

async function resolveAssigneeId(projectId, assigneeInput) {
  if (assigneeInput == null) return null;
  const num = typeof assigneeInput === 'number' ? assigneeInput : parseInt(assigneeInput, 10);
  if (isNaN(num)) return null;
  const byMemberId = await prisma.ai_api_projectmember.findFirst({
    where: { project_id: projectId, id: BigInt(num) },
  });
  if (byMemberId) return byMemberId.id;
  const byUserId = await prisma.ai_api_projectmember.findFirst({
    where: { project_id: projectId, user_id: BigInt(num) },
  });
  return byUserId?.id ?? null;
}

export async function createStoryTask(req, res, next) {
  try {
    const userStoryId = BigInt(req.body.user_story);
    const story = await prisma.ai_api_userstory.findUnique({
      where: { id: userStoryId },
      include: { ai_api_subepic: { include: { ai_api_epic: true } } },
    });
    if (!story) return res.status(404).json({ detail: 'Not found' });
    const projectId = story.ai_api_subepic.ai_api_epic.project_id;
    const member = await ensureProjectMember(projectId, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });

    const assigneeId = await resolveAssigneeId(projectId, req.body.assignee);

    const item = await prisma.ai_api_storytask.create({
      data: {
        user_story_id: userStoryId,
        title: req.body.title || 'Task',
        status: req.body.status || 'pending',
        ai: req.body.ai !== false,
        assignee_id: assigneeId,
        commit_title: req.body.commit_title ?? null,
        commit_branch: req.body.commit_branch ?? null,
        due_date: req.body.due_date ? new Date(req.body.due_date) : null,
      },
      include: { ai_api_projectmember: true },
    });
    const out = toJsonSafe({
      ...item,
      id: Number(item.id),
      assignee: assigneeId ? Number(assigneeId) : null,
      assignee_details: item.ai_api_projectmember
        ? {
            id: Number(item.ai_api_projectmember.id),
            user_id: Number(item.ai_api_projectmember.user_id),
            user_name: item.ai_api_projectmember.user_name,
            user_email: item.ai_api_projectmember.user_email,
            role: item.ai_api_projectmember.role,
          }
        : null,
    });
    broadcastToProject(projectId, 'task_update', 'created', out, req.user);
    return res.status(201).json(out);
  } catch (err) {
    next(err);
  }
}

async function cascadeStoryTaskComplete(userStoryId) {
  const task = await prisma.ai_api_storytask.findFirst({
    where: { user_story_id: userStoryId, status: { not: 'done' } },
  });
  const allDone = !task;
  if (allDone) {
    await prisma.ai_api_userstory.update({ where: { id: userStoryId }, data: { is_complete: true } });
    const story = await prisma.ai_api_userstory.findUnique({ where: { id: userStoryId }, include: { ai_api_subepic: true } });
    if (story) {
      const subEpicId = story.sub_epic_id;
      const otherStories = await prisma.ai_api_userstory.findFirst({
        where: { sub_epic_id: subEpicId, is_complete: false },
      });
      if (!otherStories) {
        await prisma.ai_api_subepic.update({ where: { id: subEpicId }, data: { is_complete: true } });
        const subEpic = await prisma.ai_api_subepic.findUnique({ where: { id: subEpicId } });
        if (subEpic) {
          const otherSubs = await prisma.ai_api_subepic.findFirst({
            where: { epic_id: subEpic.epic_id, is_complete: false },
          });
          if (!otherSubs) {
            await prisma.ai_api_epic.update({ where: { id: subEpic.epic_id }, data: { is_complete: true } });
          }
        }
      }
    }
  }
}

export async function updateStoryTask(req, res, next) {
  try {
    const taskId = BigInt(req.params.id);
    const task = await prisma.ai_api_storytask.findUnique({
      where: { id: taskId },
      include: { ai_api_userstory: { include: { ai_api_subepic: { include: { ai_api_epic: true } } } } },
    });
    if (!task) return res.status(404).json({ detail: 'Not found' });
    const projectId = task.ai_api_userstory?.ai_api_subepic?.ai_api_epic?.project_id;
    if (!projectId) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(projectId, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });

    const data = {};
    if (req.body.title) data.title = req.body.title;
    if (req.body.status) data.status = req.body.status;
    if (req.body.assignee !== undefined) {
      data.assignee_id = await resolveAssigneeId(projectId, req.body.assignee);
    }
    if (req.body.commit_title !== undefined) data.commit_title = req.body.commit_title;
    if (req.body.commit_branch !== undefined) data.commit_branch = req.body.commit_branch;
    if (req.body.due_date !== undefined) data.due_date = req.body.due_date ? new Date(req.body.due_date) : null;

    const updated = await prisma.ai_api_storytask.update({
      where: { id: taskId },
      data,
      include: { ai_api_projectmember: true },
    });
    if (req.body.status === 'done') {
      await cascadeStoryTaskComplete(task.user_story_id);
    }
    const out = toJsonSafe({
      ...updated,
      id: Number(updated.id),
      assignee: updated.assignee_id ? Number(updated.assignee_id) : null,
      assignee_details: updated.ai_api_projectmember
        ? {
            id: Number(updated.ai_api_projectmember.id),
            user_id: Number(updated.ai_api_projectmember.user_id),
            user_name: updated.ai_api_projectmember.user_name,
            user_email: updated.ai_api_projectmember.user_email,
            role: updated.ai_api_projectmember.role,
          }
        : null,
    });
    broadcastToProject(projectId, 'task_update', 'updated', out, req.user);
    return res.json(out);
  } catch (err) {
    next(err);
  }
}

export async function deleteStoryTask(req, res, next) {
  try {
    const taskId = BigInt(req.params.id);
    const task = await prisma.ai_api_storytask.findUnique({
      where: { id: taskId },
      include: { ai_api_userstory: { include: { ai_api_subepic: { include: { ai_api_epic: true } } } } },
    });
    if (!task) return res.status(404).json({ detail: 'Not found' });
    const projectId = task.ai_api_userstory?.ai_api_subepic?.ai_api_epic?.project_id;
    if (!projectId) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(projectId, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });

    await prisma.ai_api_storytask.delete({ where: { id: taskId } });
    broadcastToProject(projectId, 'task_update', 'deleted', { id: String(taskId) }, req.user);
    return res.json({ status: 'deleted', id: String(taskId) });
  } catch (err) {
    next(err);
  }
}

export async function getProjectStatistics(req, res, next) {
  try {
    const projectId = Number(req.params.id);
    const project = await prisma.ai_api_project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(projectId, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });

    const epics = await prisma.ai_api_epic.findMany({ where: { project_id: projectId } });
    const epicIds = epics.map((e) => e.id);
    const subEpics = await prisma.ai_api_subepic.findMany({ where: { epic_id: { in: epicIds } } });
    const subEpicIds = subEpics.map((s) => s.id);
    const stories = await prisma.ai_api_userstory.findMany({ where: { sub_epic_id: { in: subEpicIds } } });
    const storyIds = stories.map((s) => s.id);
    const taskCount = await prisma.ai_api_storytask.count({ where: { user_story_id: { in: storyIds } } });
    return res.json({ task_count: taskCount, sprint_count: 0 });
  } catch (err) {
    next(err);
  }
}

export async function deleteProjectMember(req, res, next) {
  try {
    const memberId = BigInt(req.params.id);
    const member = await prisma.ai_api_projectmember.findUnique({ where: { id: memberId } });
    if (!member) return res.status(404).json({ detail: 'Not found' });
    const projectId = member.project_id;
    const actor = await ensureProjectMember(projectId, getUserId(req));
    if (!actor || actor.role !== 'Owner') return res.status(403).json({ detail: 'Only owner can remove members' });
    if (member.role === 'Owner') return res.status(403).json({ detail: 'Cannot remove owner' });

    const actorUser = await prisma.user.findUnique({
      where: { user_id: getUserId(req) },
      select: { name: true },
    });
    const project = await prisma.ai_api_project.findUnique({
      where: { id: projectId },
      select: { title: true },
    });

    await prisma.ai_api_projectmember.delete({ where: { id: memberId } });

    await createNotification({
      recipientId: Number(member.user_id),
      actorId: getUserId(req),
      notificationType: 'member_removed',
      title: 'Removed from project',
      message: `You were removed from project \"${project?.title || 'Untitled'}\" by ${actorUser?.name || 'the owner'}.`,
      objectId: projectId,
      actionUrl: null,
    });

    broadcastToProject(projectId, 'member_update', 'removed', { id: String(memberId) }, req.user);
    return res.json({ status: 'deleted', id: String(memberId) });
  } catch (err) {
    next(err);
  }
}

export async function updateProjectMember(req, res, next) {
  try {
    const memberId = BigInt(req.params.id);
    const targetMember = await prisma.ai_api_projectmember.findUnique({ where: { id: memberId } });
    if (!targetMember) return res.status(404).json({ detail: 'Not found' });

    const actor = await ensureProjectMember(targetMember.project_id, getUserId(req));
    if (!actor || actor.role !== 'Owner') return res.status(403).json({ detail: 'Only owner can update members' });
    if (targetMember.role === 'Owner' && req.body.role && req.body.role !== 'Owner') {
      return res.status(403).json({ detail: 'Cannot demote owner' });
    }

    const data = {};
    if (req.body.role !== undefined) data.role = req.body.role;
    if (req.body.user_name !== undefined) data.user_name = req.body.user_name;
    if (req.body.user_email !== undefined) data.user_email = req.body.user_email;

    const updated = await prisma.ai_api_projectmember.update({ where: { id: memberId }, data });
    const out = {
      ...updated,
      id: Number(updated.id),
      user_id: Number(updated.user_id),
      user: { user_id: Number(updated.user_id), name: updated.user_name, email: updated.user_email },
    };
    broadcastToProject(targetMember.project_id, 'member_update', 'updated', out, req.user);
    return res.json(out);
  } catch (err) {
    next(err);
  }
}

export async function listStoryTasksUserAssigned(req, res, next) {
  try {
    const userId = getUserId(req);
    const members = await prisma.ai_api_projectmember.findMany({
      where: { user_id: BigInt(userId) },
      select: { id: true },
    });
    const memberIds = members.map((m) => m.id);
    if (memberIds.length === 0) return res.json([]);
    const tasks = await prisma.ai_api_storytask.findMany({
      where: { assignee_id: { in: memberIds } },
      include: { ai_api_userstory: true },
      orderBy: { updated_at: 'desc' },
    });
    return res.json(tasks.map((t) => toJsonSafe({ ...t, id: Number(t.id) })));
  } catch (err) {
    next(err);
  }
}

export async function listStoryTasksRecentCompleted(req, res, next) {
  try {
    const userId = getUserId(req);
    const members = await prisma.ai_api_projectmember.findMany({
      where: { user_id: BigInt(userId) },
      select: { project_id: true },
    });
    const projectIds = [...new Set(members.map((m) => m.project_id))];
    const epics = await prisma.ai_api_epic.findMany({ where: { project_id: { in: projectIds } } });
    const subEpics = await prisma.ai_api_subepic.findMany({ where: { epic_id: { in: epics.map((e) => e.id) } } });
    const stories = await prisma.ai_api_userstory.findMany({ where: { sub_epic_id: { in: subEpics.map((s) => s.id) } } });
    const tasks = await prisma.ai_api_storytask.findMany({
      where: { user_story_id: { in: stories.map((s) => s.id) }, status: 'done' },
      include: { ai_api_userstory: true },
      orderBy: { updated_at: 'desc' },
      take: 20,
    });
    return res.json(tasks.map((t) => toJsonSafe({ ...t, id: Number(t.id) })));
  } catch (err) {
    next(err);
  }
}

export async function bulkAssignStoryTasks(req, res, next) {
  try {
    const { task_ids, assignee_id } = req.body;
    if (!Array.isArray(task_ids) || task_ids.length === 0) return res.status(400).json({ detail: 'task_ids array required' });

    const tasks = await prisma.ai_api_storytask.findMany({
      where: { id: { in: task_ids.map((id) => BigInt(id)) } },
      include: { ai_api_userstory: { include: { ai_api_subepic: { include: { ai_api_epic: true } } } } },
    });
    let projectId = null;
    for (const t of tasks) {
      const epic = t.ai_api_userstory?.ai_api_subepic?.ai_api_epic;
      if (epic) {
        projectId = epic.project_id;
        const member = await ensureProjectMember(projectId, getUserId(req));
        if (!member) return res.status(403).json({ detail: 'Not a member for one or more tasks' });
      }
    }
    const assigneeMemberId = projectId && assignee_id ? await resolveAssigneeId(projectId, assignee_id) : null;
    await prisma.ai_api_storytask.updateMany({
      where: { id: { in: task_ids.map((id) => BigInt(id)) } },
      data: { assignee_id: assigneeMemberId },
    });
    const updated = await prisma.ai_api_storytask.findMany({
      where: { id: { in: task_ids.map((id) => BigInt(id)) } },
      include: { ai_api_projectmember: true },
    });
    if (projectId) broadcastToProject(projectId, 'task_update', 'bulk_assign', updated, req.user);
    return res.json(updated.map((t) => toJsonSafe({ ...t, id: Number(t.id) })));
  } catch (err) {
    next(err);
  }
}

export async function deleteNotification(req, res, next) {
  try {
    const notifId = BigInt(req.params.id);
    const userId = getUserId(req);
    const notif = await prisma.ai_api_notification.findFirst({
      where: { id: notifId, recipient_id: userId },
    });
    if (!notif) return res.status(404).json({ detail: 'Not found' });
    await prisma.ai_api_notification.delete({ where: { id: notifId } });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getNotificationsUnreadCount(req, res, next) {
  try {
    const count = await prisma.ai_api_notification.count({
      where: { recipient_id: getUserId(req), is_read: false },
    });
    return res.json({ unread_count: count });
  } catch (err) {
    next(err);
  }
}

export async function listMyInvitations(req, res, next) {
  try {
    const userId = getUserId(req);
    const invs = await prisma.ai_api_projectinvitation.findMany({
      where: { invitee_id: userId },
      include: {
        ai_api_project: true,
        user_ai_api_projectinvitation_invited_by_idTouser: { select: { name: true, email: true } },
        user_ai_api_projectinvitation_invitee_idTouser: { select: { name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const invitations = invs.map((i) =>
      toJsonSafe({
        id: Number(i.id),
        project: Number(i.project_id),
        project_title: i.ai_api_project?.title || null,
        invitee: Number(i.invitee_id),
        invitee_name: i.user_ai_api_projectinvitation_invitee_idTouser?.name || null,
        invitee_email: i.user_ai_api_projectinvitation_invitee_idTouser?.email || null,
        invited_by: Number(i.invited_by_id),
        invited_by_name: i.user_ai_api_projectinvitation_invited_by_idTouser?.name || null,
        invited_by_email: i.user_ai_api_projectinvitation_invited_by_idTouser?.email || null,
        status: i.status,
        role: i.role,
        message: i.message,
        created_at: i.created_at,
        updated_at: i.updated_at,
      })
    );

    return res.json({ invitations });
  } catch (err) {
    next(err);
  }
}

export async function declineInvitation(req, res, next) {
  try {
    const invId = BigInt(req.params.id);
    const inv = await prisma.ai_api_projectinvitation.findUnique({ where: { id: invId } });
    if (!inv) return res.status(404).json({ detail: 'Not found' });
    if (inv.invitee_id !== Number(getUserId(req))) return res.status(403).json({ detail: 'Not your invitation' });
    if (inv.status !== 'pending') return res.status(400).json({ detail: 'Invitation no longer valid' });
    const updated = await prisma.ai_api_projectinvitation.update({
      where: { id: invId },
      data: { status: 'declined', updated_at: new Date() },
    });
    return res.json({ ...updated, id: Number(updated.id) });
  } catch (err) {
    next(err);
  }
}

export async function listProjectMembers(req, res, next) {
  try {
    const projectId = getProjectIdFromQuery(req.query);
    if (!projectId) return res.status(400).json({ detail: 'project_id required' });
    const member = await ensureProjectMember(projectId, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });
    const members = await prisma.ai_api_projectmember.findMany({
      where: { project_id: projectId },
    });
    return res.json(members.map((m) => ({
      ...m,
      id: Number(m.id),
      user_id: Number(m.user_id),
      user: { user_id: Number(m.user_id), name: m.user_name, email: m.user_email },
    })));
  } catch (err) {
    next(err);
  }
}

export async function createProjectMember(req, res, next) {
  try {
    const projectId = Number(req.body.project);
    const project = await prisma.ai_api_project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ detail: 'Not found' });
    const inviter = await ensureProjectMember(projectId, getUserId(req));
    if (!inviter || inviter.role !== 'Owner') return res.status(403).json({ detail: 'Only owner can add members' });

    let user = null;
    if (req.body.user) {
      const uid = Number(req.body.user);
      user = await prisma.user.findUnique({ where: { user_id: uid } });
    }
    if (!user && req.body.user_email) {
      user = await prisma.user.findUnique({ where: { email: req.body.user_email.toLowerCase() } });
    }
    if (!user) return res.status(404).json({ detail: 'User not found' });

    const existing = await prisma.ai_api_projectmember.findFirst({
      where: { project_id: projectId, user_id: BigInt(user.user_id) },
    });
    if (existing) return res.status(400).json({ detail: 'Already a member' });

    const member = await prisma.ai_api_projectmember.create({
      data: {
        project_id: projectId,
        user_id: BigInt(user.user_id),
        user_name: user.name,
        user_email: user.email,
        role: req.body.role || 'Member',
        joined_at: new Date(),
      },
    });
    const out = {
      ...member,
      id: Number(member.id),
      user_id: Number(member.user_id),
      user: { user_id: Number(member.user_id), name: member.user_name, email: member.user_email },
    };
    broadcastToProject(projectId, 'member_update', 'created', out, req.user);
    return res.status(201).json(out);
  } catch (err) {
    next(err);
  }
}

export async function listRepositories(req, res, next) {
  try {
    const projectId = getProjectIdFromQuery(req.query);
    if (!projectId) return res.status(400).json({ detail: 'project_id required' });
    const member = await ensureProjectMember(projectId, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });

    const repos = await prisma.ai_api_repository.findMany({
      where: { project_id: projectId },
      include: { ai_api_projectmember: true },
      orderBy: { id: 'asc' },
    });

    return res.json(
      repos.map((r) =>
        toJsonSafe({
          ...r,
          id: Number(r.id),
          project_id: r.project_id,
          assigned_to: r.ai_api_projectmember?.user_id ? Number(r.ai_api_projectmember.user_id) : null,
        })
      )
    );
  } catch (err) {
    next(err);
  }
}

export async function createRepository(req, res, next) {
  try {
    const projectId = Number(req.body.project);
    if (!projectId) return res.status(400).json({ detail: 'project required' });
    const member = await ensureProjectMember(projectId, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });

    const assignedToMemberId = await resolveAssigneeId(projectId, req.body.assigned_to);

    const repo = await prisma.ai_api_repository.create({
      data: {
        project_id: projectId,
        name: req.body.name || 'Repository',
        url: req.body.url || '',
        branch: req.body.branch || 'main',
        assigned_to_id: assignedToMemberId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: { ai_api_projectmember: true },
    });

    const out = toJsonSafe({
      ...repo,
      id: Number(repo.id),
      assigned_to: repo.ai_api_projectmember?.user_id ? Number(repo.ai_api_projectmember.user_id) : null,
    });
    broadcastToProject(projectId, 'repository_update', 'created', out, req.user);
    return res.status(201).json(out);
  } catch (err) {
    next(err);
  }
}

export async function updateRepository(req, res, next) {
  try {
    const repoId = BigInt(req.params.id);
    const repo = await prisma.ai_api_repository.findUnique({ where: { id: repoId } });
    if (!repo) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(repo.project_id, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });

    const data = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.url !== undefined) data.url = req.body.url;
    if (req.body.branch !== undefined) data.branch = req.body.branch;
    if (req.body.assigned_to !== undefined) {
      data.assigned_to_id = await resolveAssigneeId(repo.project_id, req.body.assigned_to);
    }
    data.updated_at = new Date();

    const updated = await prisma.ai_api_repository.update({
      where: { id: repoId },
      data,
      include: { ai_api_projectmember: true },
    });

    const out = toJsonSafe({
      ...updated,
      id: Number(updated.id),
      assigned_to: updated.ai_api_projectmember?.user_id ? Number(updated.ai_api_projectmember.user_id) : null,
    });
    broadcastToProject(repo.project_id, 'repository_update', 'updated', out, req.user);
    return res.json(out);
  } catch (err) {
    next(err);
  }
}

export async function deleteRepository(req, res, next) {
  try {
    const repoId = BigInt(req.params.id);
    const repo = await prisma.ai_api_repository.findUnique({ where: { id: repoId } });
    if (!repo) return res.status(404).json({ detail: 'Not found' });
    const member = await ensureProjectMember(repo.project_id, getUserId(req));
    if (!member) return res.status(403).json({ detail: 'Not a member' });

    await prisma.ai_api_repository.delete({ where: { id: repoId } });
    broadcastToProject(repo.project_id, 'repository_update', 'deleted', { id: String(repoId) }, req.user);
    return res.json({ status: 'deleted', id: String(repoId) });
  } catch (err) {
    next(err);
  }
}

export async function listInvitations(req, res, next) {
  try {
    const projectId = getProjectIdFromQuery(req.query);
    const inviteeId = req.query.invitee ? Number(req.query.invitee) : null;
    const where = {};
    if (projectId) where.project_id = projectId;
    if (inviteeId) where.invitee_id = inviteeId;
    const invs = await prisma.ai_api_projectinvitation.findMany({
      where,
      include: { ai_api_project: true, user_ai_api_projectinvitation_invitee_idTouser: true, user_ai_api_projectinvitation_invited_by_idTouser: true },
    });
    return res.json(invs.map((i) => toJsonSafe({
      ...i,
      id: Number(i.id),
      project: i.ai_api_project,
      invitee: Number(i.invitee_id),
      invitee_name: i.user_ai_api_projectinvitation_invitee_idTouser?.name || null,
      invitee_email: i.user_ai_api_projectinvitation_invitee_idTouser?.email || null,
      invited_by_name: i.user_ai_api_projectinvitation_invited_by_idTouser?.name || null,
      invited_by_email: i.user_ai_api_projectinvitation_invited_by_idTouser?.email || null,
      invitedBy: i.user_ai_api_projectinvitation_invited_by_idTouser,
    })));
  } catch (err) {
    next(err);
  }
}

export async function createInvitation(req, res, next) {
  try {
    const projectId = Number(req.body.project);
    const project = await prisma.ai_api_project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ detail: 'Not found' });
    const inviter = await ensureProjectMember(projectId, getUserId(req));
    if (!inviter || inviter.role !== 'Owner') return res.status(403).json({ detail: 'Only owner can invite' });

    let invitee = null;
    if (req.body.invitee) {
      invitee = await prisma.user.findUnique({ where: { user_id: Number(req.body.invitee) } });
    }
    if (!invitee && req.body.invitee_email) {
      invitee = await prisma.user.findUnique({ where: { email: req.body.invitee_email.toLowerCase() } });
    }
    if (!invitee) return res.status(404).json({ detail: 'Invitee not found' });
    if (invitee.user_id === getUserId(req)) return res.status(400).json({ detail: 'Cannot invite yourself' });

    const existing = await prisma.ai_api_projectmember.findFirst({
      where: { project_id: projectId, user_id: BigInt(invitee.user_id) },
    });
    if (existing) return res.status(400).json({ detail: 'User is already a member' });

    const existingInvitation = await prisma.ai_api_projectinvitation.findUnique({
      where: {
        project_id_invitee_id: {
          project_id: projectId,
          invitee_id: invitee.user_id,
        },
      },
    });

    if (existingInvitation) {
      if (existingInvitation.status === 'pending') {
        return res.status(400).json({ detail: 'Invitation is already pending' });
      }

      const updatedInvitation = await prisma.ai_api_projectinvitation.update({
        where: { id: existingInvitation.id },
        data: {
          invited_by_id: getUserId(req),
          status: 'pending',
          role: req.body.role || existingInvitation.role || 'Member',
          message: req.body.message ?? existingInvitation.message ?? '',
          updated_at: new Date(),
        },
      });

      return res.status(201).json({ ...updatedInvitation, id: Number(updatedInvitation.id) });
    }

    const inv = await prisma.ai_api_projectinvitation.create({
      data: {
        project_id: projectId,
        invitee_id: invitee.user_id,
        invited_by_id: getUserId(req),
        status: 'pending',
        role: req.body.role || 'Member',
        message: req.body.message ?? '',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    return res.status(201).json({ ...inv, id: Number(inv.id) });
  } catch (err) {
    next(err);
  }
}

export async function acceptInvitation(req, res, next) {
  try {
    const invId = BigInt(req.params.id);
    const inv = await prisma.ai_api_projectinvitation.findUnique({ where: { id: invId } });
    if (!inv) return res.status(404).json({ detail: 'Not found' });
    if (inv.invitee_id !== Number(getUserId(req))) return res.status(403).json({ detail: 'Not your invitation' });
    if (inv.status !== 'pending') return res.status(400).json({ detail: 'Invitation no longer valid' });

    await prisma.ai_api_projectinvitation.update({
      where: { id: invId },
      data: { status: 'accepted', updated_at: new Date() },
    });

    const existingMember = await prisma.ai_api_projectmember.findFirst({
      where: { project_id: inv.project_id, user_id: BigInt(inv.invitee_id) },
    });
    if (!existingMember) {
      const user = await prisma.user.findUnique({ where: { user_id: inv.invitee_id } });
      if (!user) return res.status(404).json({ detail: 'Invitee not found' });
      await prisma.ai_api_projectmember.create({
        data: {
          project_id: inv.project_id,
          user_id: BigInt(inv.invitee_id),
          user_name: user.name,
          user_email: user.email,
          role: inv.role,
          joined_at: new Date(),
        },
      });
    }
    broadcastToProject(inv.project_id, 'member_update', 'created', { user: inv.invitee_id }, req.user);
    return res.json(toJsonSafe({ ...inv, id: Number(inv.id), status: 'accepted', updated_at: new Date() }));
  } catch (err) {
    next(err);
  }
}

export async function listNotifications(req, res, next) {
  try {
    const sinceRaw = req.query?.since;
    const sinceDate = sinceRaw ? new Date(String(sinceRaw)) : null;
    const hasValidSince = sinceDate instanceof Date && !Number.isNaN(sinceDate.getTime());

    const where = { recipient_id: getUserId(req) };
    if (hasValidSince) {
      where.created_at = { gt: sinceDate };
    }

    const items = await prisma.ai_api_notification.findMany({
      where,
      include: { user_ai_api_notification_actor_idTouser: { select: { name: true } } },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
    return res.json(items.map((i) => ({
      ...i,
      id: Number(i.id),
      actor: i.user_ai_api_notification_actor_idTouser,
    })));
  } catch (err) {
    next(err);
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    const notifId = BigInt(req.params.id);
    const notif = await prisma.ai_api_notification.findFirst({
      where: { id: notifId, recipient_id: getUserId(req) },
    });
    if (!notif) return res.status(404).json({ detail: 'Not found' });
    const updated = await prisma.ai_api_notification.update({
      where: { id: notifId },
      data: { is_read: true, read_at: new Date() },
    });
    return res.json({ ...updated, id: Number(updated.id) });
  } catch (err) {
    next(err);
  }
}

export async function markAllNotificationsRead(req, res, next) {
  try {
    await prisma.ai_api_notification.updateMany({
      where: { recipient_id: getUserId(req), is_read: false },
      data: { is_read: true, read_at: new Date() },
    });
    return res.json({ status: 'all marked as read' });
  } catch (err) {
    next(err);
  }
}
