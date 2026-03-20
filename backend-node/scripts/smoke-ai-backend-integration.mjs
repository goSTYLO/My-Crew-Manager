/**
 * End-to-end smoke test: backend-node + AI microservice (FastAPI) migration path.
 *
 * Prerequisites:
 *   - PostgreSQL + `npm run seed` (or seed users matching accounts below)
 *   - Backend: `npm run dev` (uses PORT from backend-node `.env`, often 8001)
 *   - AI: `cd AI && python -m uvicorn main:app --port 8002` and backend .env AI_SERVICE_URL
 *
 * Usage (from backend-node):
 *   node scripts/smoke-ai-backend-integration.mjs
 *
 * Env (optional):
 *   API_BASE        - default http://127.0.0.1:$PORT (PORT from `.env`, else 5000)
 *   AI_HEALTH_URL   - default AI_SERVICE_URL from env or http://127.0.0.1:8002
 *   PM_EMAIL        - default pm.maya@mycrewmanager.test (matches `npm run seed`)
 *   PM_PASSWORD     - default CrewPass!2026 (matches `npm run seed`)
 *   PROPOSAL_TEXT   - override proposal body text
 *   REQUEST_TIMEOUT_MS - default 600000 (10 min for LLM)
 *   SMOKE_PRINT_RAW - set to "0" to hide pretty-printed overview/backlog JSON (default: print full API payloads for manual review)
 */
import 'dotenv/config';
import { PDFDocument, StandardFonts } from 'pdf-lib';

const BACKEND_PORT = String(process.env.PORT || '5000').replace(/[^0-9]/g, '') || '5000';
const API_BASE = (process.env.API_BASE || `http://127.0.0.1:${BACKEND_PORT}`).replace(/\/$/, '');
const AI_HEALTH_URL = (
  process.env.AI_HEALTH_URL ||
  process.env.AI_SERVICE_URL ||
  'http://127.0.0.1:8002'
).replace(/\/$/, '');
const PM_EMAIL = process.env.PM_EMAIL || 'pm.maya@mycrewmanager.test';
const PM_PASSWORD = process.env.PM_PASSWORD || 'CrewPass!2026';
const PROPOSAL_TEXT =
  process.env.PROPOSAL_TEXT ||
  'EventEase helps organizers plan weddings and conferences with AI-driven venue and vendor suggestions, scheduling tools, and notifications. It reduces planning overhead for busy teams.';

const TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || '600000');

const PROPOSAL_FILENAME = 'smoke-migration-proposal.pdf';

/** Full JSON from generate-overview / generate-backlog for manual parsing checks (disable: SMOKE_PRINT_RAW=0) */
const PRINT_RAW = process.env.SMOKE_PRINT_RAW !== '0';

function printRawBlock(label, data) {
  if (!PRINT_RAW) return;
  const body =
    typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  console.log(`\n---------- [smoke-ai] RAW: ${label} ----------`);
  console.log(body);
  console.log(`---------- end RAW: ${label} ----------\n`);
}

function log(step, detail) {
  console.log(`[smoke-ai] ${step}${detail != null ? `: ${detail}` : ''}`);
}

async function fetchJson(url, options = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...options,
      signal: ctrl.signal,
      headers: {
        Accept: 'application/json',
        ...options.headers,
      },
    });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    const code = err?.cause?.code || err?.code;
    const tip =
      code === 'ECONNREFUSED'
        ? ' Nothing is listening — start the backend (`npm run dev`) and/or set API_BASE to match its PORT (see backend-node `.env`).'
        : '';
    throw new Error(`${err.message} @ ${url}.${tip}`);
  } finally {
    clearTimeout(t);
  }
}

async function buildProposalPdf(text) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText(text, { x: 72, y: 720, size: 12, font, maxWidth: 468, lineHeight: 14 });
  return doc.save();
}

/** Expected timeline item rows from overview.timeline (same logic as parse_overview save). */
function expectedTimelineItemCount(overview) {
  let n = 0;
  for (const w of overview?.timeline || []) {
    const goals = (typeof w === 'object' && w?.goals) || [];
    n += goals.length;
  }
  return n;
}

/**
 * Walk nested backlog from GET /projects/:id/backlog/ (shape: { epics: [...] }).
 */
function countBacklogTree(epics) {
  let epicCount = 0;
  let subEpicCount = 0;
  let userStoryCount = 0;
  let taskCount = 0;
  for (const e of epics || []) {
    epicCount++;
    for (const se of e.sub_epics || []) {
      subEpicCount++;
      for (const us of se.user_stories || []) {
        userStoryCount++;
        taskCount += (us.tasks || []).length;
      }
    }
  }
  return { epicCount, subEpicCount, userStoryCount, taskCount };
}

/**
 * After generate-overview: fetch project + list endpoints and assert counts match API overview.
 */
async function validateOverviewStored(projectId, overview, authHeader) {
  const q = `project_id=${projectId}`;
  const headers = authHeader;

  const [projR, featR, roleR, goalR, weeksR] = await Promise.all([
    fetchJson(`${API_BASE}/api/ai/projects/${projectId}`, { headers }),
    fetchJson(`${API_BASE}/api/ai/project-features/?${q}`, { headers }),
    fetchJson(`${API_BASE}/api/ai/project-roles/?${q}`, { headers }),
    fetchJson(`${API_BASE}/api/ai/project-goals/?${q}`, { headers }),
    fetchJson(`${API_BASE}/api/ai/timeline-weeks/?${q}`, { headers }),
  ]);

  for (const [name, res] of [
    ['project', projR],
    ['project-features', featR],
    ['project-roles', roleR],
    ['project-goals', goalR],
    ['timeline-weeks', weeksR],
  ]) {
    if (!res.ok) {
      throw new Error(`validate overview fetch ${name} failed: ${res.status} ${JSON.stringify(res.data)}`);
    }
  }

  const project = projR.data;
  const features = Array.isArray(featR.data) ? featR.data : [];
  const roles = Array.isArray(roleR.data) ? roleR.data : [];
  const goals = Array.isArray(goalR.data) ? goalR.data : [];
  const weeks = Array.isArray(weeksR.data) ? weeksR.data : [];

  let timelineItemCount = 0;
  for (const w of weeks) {
    const items = w.timeline_items || [];
    timelineItemCount += items.length;
  }

  const overviewGoals = Array.isArray(overview?.goals) ? overview.goals.length : 0;
  const overviewFeatures = Array.isArray(overview?.features) ? overview.features.length : 0;
  const overviewRoles = Array.isArray(overview?.roles) ? overview.roles.length : 0;
  const overviewWeeks = Array.isArray(overview?.timeline) ? overview.timeline.length : 0;
  const expectedItems = expectedTimelineItemCount(overview);

  const hasSummary =
    project?.summary != null && String(project.summary).trim().length > 0 ? 1 : 0;
  const expectedSummary = overview?.summary != null && String(overview.summary).trim().length > 0 ? 1 : 0;

  log(
    'stored overview',
    `summary=${hasSummary} (expect ${expectedSummary}), roles=${roles.length}/${overviewRoles}, ` +
      `features=${features.length}/${overviewFeatures}, goals=${goals.length}/${overviewGoals}, ` +
      `timeline_weeks=${weeks.length}/${overviewWeeks}, timeline_items=${timelineItemCount}/${expectedItems}`
  );

  if (hasSummary !== expectedSummary) {
    throw new Error(`Overview summary mismatch: stored has text=${hasSummary}, expected=${expectedSummary}`);
  }
  if (features.length !== overviewFeatures) {
    throw new Error(`Features count mismatch: DB=${features.length}, overview API=${overviewFeatures}`);
  }
  if (roles.length !== overviewRoles) {
    throw new Error(`Roles count mismatch: DB=${roles.length}, overview API=${overviewRoles}`);
  }
  if (goals.length !== overviewGoals) {
    throw new Error(`Goals count mismatch: DB=${goals.length}, overview API=${overviewGoals}`);
  }
  if (weeks.length !== overviewWeeks) {
    throw new Error(`Timeline weeks mismatch: DB=${weeks.length}, overview API=${overviewWeeks}`);
  }
  if (timelineItemCount !== expectedItems) {
    throw new Error(`Timeline items mismatch: DB=${timelineItemCount}, expected from overview=${expectedItems}`);
  }

  return {
    summary: hasSummary,
    roles: roles.length,
    features: features.length,
    goals: goals.length,
    timelineWeeks: weeks.length,
    timelineItems: timelineItemCount,
  };
}

/**
 * After generate-backlog: reconcile GET /backlog tree vs flat epic/sub-epic/story/task list endpoints.
 */
async function validateBacklogStored(projectId, backlogTreeEpics, authHeader) {
  const tree = countBacklogTree(backlogTreeEpics);
  log(
    'backlog tree counts',
    `epics=${tree.epicCount}, sub_epics=${tree.subEpicCount}, user_stories=${tree.userStoryCount}, tasks=${tree.taskCount}`
  );

  const epicsR = await fetchJson(`${API_BASE}/api/ai/epics/?project=${projectId}`, { headers: authHeader });
  if (!epicsR.ok) {
    throw new Error(`list epics failed: ${epicsR.status} ${JSON.stringify(epicsR.data)}`);
  }
  const flatEpics = Array.isArray(epicsR.data) ? epicsR.data : [];
  if (flatEpics.length !== tree.epicCount) {
    throw new Error(`Epic count mismatch: listEpics=${flatEpics.length}, tree=${tree.epicCount}`);
  }

  let flatSub = 0;
  let flatStories = 0;
  let flatTasks = 0;

  for (const epic of flatEpics) {
    const seR = await fetchJson(`${API_BASE}/api/ai/sub-epics/?epic=${epic.id}`, { headers: authHeader });
    if (!seR.ok) {
      throw new Error(`list sub-epics failed for epic ${epic.id}: ${seR.status}`);
    }
    const subs = Array.isArray(seR.data) ? seR.data : [];
    flatSub += subs.length;

    for (const se of subs) {
      const usR = await fetchJson(`${API_BASE}/api/ai/user-stories/?sub_epic=${se.id}`, { headers: authHeader });
      if (!usR.ok) {
        throw new Error(`list user-stories failed for sub_epic ${se.id}: ${usR.status}`);
      }
      const stories = Array.isArray(usR.data) ? usR.data : [];
      flatStories += stories.length;

      for (const st of stories) {
        const tR = await fetchJson(`${API_BASE}/api/ai/story-tasks/?user_story=${st.id}`, { headers: authHeader });
        if (!tR.ok) {
          throw new Error(`list story-tasks failed for user_story ${st.id}: ${tR.status}`);
        }
        const tasks = Array.isArray(tR.data) ? tR.data : [];
        flatTasks += tasks.length;
      }
    }
  }

  log(
    'stored backlog (flat API)',
    `epics=${flatEpics.length}, sub_epics=${flatSub}, user_stories=${flatStories}, tasks=${flatTasks}`
  );

  if (flatSub !== tree.subEpicCount) {
    throw new Error(`Sub-epic count mismatch: flat API=${flatSub}, tree=${tree.subEpicCount}`);
  }
  if (flatStories !== tree.userStoryCount) {
    throw new Error(`User story count mismatch: flat API=${flatStories}, tree=${tree.userStoryCount}`);
  }
  if (flatTasks !== tree.taskCount) {
    throw new Error(`Task count mismatch: flat API=${flatTasks}, tree=${tree.taskCount}`);
  }

  return { tree, flat: { epics: flatEpics.length, subEpics: flatSub, stories: flatStories, tasks: flatTasks } };
}

async function main() {
  log('API_BASE', API_BASE);
  log('AI_HEALTH_URL', AI_HEALTH_URL);

  let r = await fetchJson(`${API_BASE}/health`);
  if (!r.ok) throw new Error(`Backend /health failed: ${r.status} ${JSON.stringify(r.data)}`);
  log('backend health', 'ok');

  r = await fetchJson(`${AI_HEALTH_URL}/health`);
  if (!r.ok) {
    throw new Error(
      `AI service /health failed (${r.status}). Start FastAPI on ${AI_HEALTH_URL} and set AI_SERVICE_URL in backend .env`
    );
  }
  log('AI health', 'ok');

  r = await fetchJson(`${API_BASE}/api/user/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: PM_EMAIL, password: PM_PASSWORD }),
  });
  if (!r.ok) {
    throw new Error(
      `Login failed: ${r.status} ${JSON.stringify(r.data)}\n` +
        `  Hint: defaults match \`npm run seed\` (PM: pm.maya@mycrewmanager.test / CrewPass!2026). ` +
        `Master seed: master.pm@mycrewmanager.local / MasterSeed!2026. ` +
        `Override with PM_EMAIL and PM_PASSWORD. See accounts.md.`
    );
  }
  if (r.data?.requires_2fa) {
    throw new Error(
      'Login requires 2FA. Set DISABLE_2FA=true for dev or complete the 2FA verify-login flow.'
    );
  }
  const token = r.data?.token || r.data?.access;
  if (!token) throw new Error(`No token in login response: ${JSON.stringify(r.data)}`);
  log('login', PM_EMAIL);

  const authHeader = { Authorization: `Token ${token}` };

  r = await fetchJson(`${API_BASE}/api/ai/projects/`, { headers: authHeader });
  if (!r.ok) throw new Error(`List projects failed: ${r.status} ${JSON.stringify(r.data)}`);

  let projectId;
  const projects = Array.isArray(r.data) ? r.data : [];
  if (projects.length > 0) {
    projectId = Number(projects[0].id);
    log('using existing project', String(projectId));
  } else {
    r = await fetchJson(`${API_BASE}/api/ai/projects/`, {
      method: 'POST',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Smoke AI migration project',
        summary: 'Created by smoke-ai-backend-integration.mjs',
      }),
    });
    if (!r.ok) throw new Error(`Create project failed: ${r.status} ${JSON.stringify(r.data)}`);
    projectId = Number(r.data.id);
    log('created project', String(projectId));
  }

  const pdfBytes = await buildProposalPdf(PROPOSAL_TEXT);
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const form = new FormData();
  form.append('project_id', String(projectId));
  form.append('file', blob, PROPOSAL_FILENAME);

  r = await fetchJson(`${API_BASE}/api/ai/proposals/`, {
    method: 'POST',
    headers: authHeader,
    body: form,
  });
  if (!r.ok) throw new Error(`Upload proposal failed: ${r.status} ${JSON.stringify(r.data)}`);
  log('uploaded proposal', PROPOSAL_FILENAME);

  r = await fetchJson(`${API_BASE}/api/ai/projects/${projectId}/generate-overview/`, {
    method: 'PUT',
    headers: authHeader,
  });
  if (!r.ok) throw new Error(`generate-overview failed: ${r.status} ${JSON.stringify(r.data)}`);
  const overview = r.data;
  const goalCount = Array.isArray(overview?.goals) ? overview.goals.length : 0;
  const featCount = Array.isArray(overview?.features) ? overview.features.length : 0;
  if (!overview?.summary && featCount === 0 && goalCount === 0) {
    throw new Error(`Overview looks empty: ${JSON.stringify(overview)}`);
  }
  log('generate-overview', `goals=${goalCount} features=${featCount}`);
  printRawBlock('overview (generate-overview API response)', overview);

  await validateOverviewStored(projectId, overview, authHeader);

  r = await fetchJson(`${API_BASE}/api/ai/projects/${projectId}/generate-backlog`, {
    method: 'PUT',
    headers: authHeader,
  });
  if (!r.ok) throw new Error(`generate-backlog failed: ${r.status} ${JSON.stringify(r.data)}`);
  const backlog = r.data;
  const epics = Array.isArray(backlog)
    ? backlog
    : Array.isArray(backlog?.epics)
      ? backlog.epics
      : null;
  if (!epics || epics.length === 0) {
    throw new Error(`Backlog has no epics: ${JSON.stringify(backlog)?.slice(0, 500)}`);
  }
  log('generate-backlog', `epics=${epics.length}`);
  printRawBlock('backlog (generate-backlog API response — nested epics)', epics);

  r = await fetchJson(`${API_BASE}/api/ai/projects/${projectId}/backlog/`, { headers: authHeader });
  if (!r.ok) throw new Error(`GET backlog failed: ${r.status} ${JSON.stringify(r.data)}`);
  const stored = r.data?.epics;
  if (!Array.isArray(stored) || stored.length === 0) {
    throw new Error('Persisted backlog empty after generate');
  }
  log('GET backlog', `epics=${stored.length}`);
  printRawBlock('backlog (GET /projects/:id/backlog/ after persist)', r.data);

  await validateBacklogStored(projectId, stored, authHeader);

  console.log('\n[smoke-ai] SUCCESS — backend + AI microservice + Prisma path verified.\n');
}

main().catch((err) => {
  console.error('\n[smoke-ai] FAILED:', err.message || err);
  process.exit(1);
});
