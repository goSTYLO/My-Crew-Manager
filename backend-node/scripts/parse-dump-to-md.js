/**
 * Parse restore_projects.sql (from pg_restore) and generate sample-outputs.md
 * Run: node scripts/parse-dump-to-md.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.join(__dirname, '../restore_projects.sql');

const content = fs.readFileSync(sqlPath, 'utf8');

function parseCopyBlock(name, text) {
  const re = new RegExp(
    `COPY public\\.${name} \\(([^)]+)\\) FROM stdin;\\n([\\s\\S]*?)\\n\\\\.`,
    'g'
  );
  const match = re.exec(text);
  if (!match) return [];
  const cols = match[1].split(/,\s*/).map((c) => c.trim());
  const rows = match[2]
    .split('\n')
    .filter((l) => l.trim())
    .map((line) => {
      const vals = [];
      let cur = '';
      let i = 0;
      while (i < line.length) {
        if (line[i] === '\\') {
          if (line[i + 1] === 'N') {
            vals.push(null);
            i += 2;
          } else if (line[i + 1] === 't') {
            vals.push(true);
            i += 2;
          } else if (line[i + 1] === 'n') {
            vals.push(null);
            i += 2;
          } else {
            cur += line[i];
            i++;
          }
        } else if (line[i] === '\t') {
          vals.push(cur || null);
          cur = '';
          i++;
        } else {
          cur += line[i];
          i++;
        }
      }
      if (cur !== undefined) vals.push(cur || null);
      const o = {};
      cols.forEach((c, j) => (o[c] = vals[j]));
      return o;
    });
  return rows;
}

const projects = parseCopyBlock('ai_api_project', content);
const features = parseCopyBlock('ai_api_projectfeature', content);
const goals = parseCopyBlock('ai_api_projectgoal', content);
const roles = parseCopyBlock('ai_api_projectrole', content);
const proposals = parseCopyBlock('ai_api_proposal', content);
const epics = parseCopyBlock('ai_api_epic', content);
const subepics = parseCopyBlock('ai_api_subepic', content);
const userstories = parseCopyBlock('ai_api_userstory', content);
const storytasks = parseCopyBlock('ai_api_storytask', content);
const timelineWeeks = parseCopyBlock('ai_api_timelineweek', content);
const timelineItems = parseCopyBlock('ai_api_timelineitem', content);
const repos = parseCopyBlock('ai_api_repository', content);

const byProject = (arr, pid) => arr.filter((r) => Number(r.project_id) === Number(pid));
const bySubEpic = (arr, sid) => arr.filter((r) => Number(r.sub_epic_id) === Number(sid));
const byEpic = (arr, eid) => arr.filter((r) => Number(r.epic_id) === Number(eid));
const byWeek = (arr, wid) => arr.filter((r) => Number(r.week_id) === Number(wid));

function toMd(proj) {
  const pid = Number(proj.id);
  const projFeatures = byProject(features, pid);
  const projGoals = byProject(goals, pid);
  const projRoles = byProject(roles, pid);
  const projProposals = byProject(proposals, pid);
  const projEpics = byProject(epics, pid);
  const projWeeks = byProject(timelineWeeks, pid).sort((a, b) => a.week_number - b.week_number);
  const projRepos = byProject(repos, pid);

  const proposalText =
    projProposals[0]?.parsed_text?.replace(/\\n/g, '\n')?.slice(0, 800) || proj.summary;
  const lines = [];

  lines.push(`## ${proj.title}`);
  lines.push('');
  if (proj.summary) {
    lines.push('**Summary:**');
    lines.push(proj.summary);
    lines.push('');
  }
  lines.push(`**Status:** ${proj.status || 'in_progress'}`);
  lines.push('');
  if (proposalText) {
    lines.push('**Proposal / Input:**');
    lines.push(proposalText);
    lines.push('');
  }
  if (projRoles.length) {
    lines.push('**Roles:**');
    projRoles.forEach((r) => lines.push(`- ${r.role}`));
    lines.push('');
  }
  if (projFeatures.length) {
    lines.push('**Features:**');
    projFeatures.forEach((f) => lines.push(`- ${f.title}`));
    lines.push('');
  }
  if (projGoals.length) {
    lines.push('**Goals:**');
    projGoals.forEach((g) =>
      lines.push(`- ${g.title}${g.role ? ` (${g.role})` : ''}`)
    );
    lines.push('');
  }
  if (projWeeks.length) {
    lines.push('**Timeline:**');
    projWeeks.forEach((w) => {
      const items = byWeek(timelineItems, w.id).map((i) => i.title);
      lines.push(`Week ${w.week_number}:`);
      items.forEach((t) => lines.push(`- ${t}`));
    });
    lines.push('');
  }
  if (projRepos.length) {
    lines.push('**Repositories:**');
    projRepos.forEach((r) => lines.push(`- ${r.name}: ${r.url} (${r.branch})`));
    lines.push('');
  }
  if (projEpics.length) {
    lines.push('**Backlog (Epics → Sub-epics → User Stories → Tasks):**');
    projEpics.forEach((epic) => {
      lines.push(`### ${epic.title}`);
      if (epic.description) lines.push(`*${epic.description}*`);
      const subs = byEpic(subepics, epic.id);
      subs.forEach((sub) => {
        lines.push(`#### ${sub.title}`);
        const stories = bySubEpic(userstories, sub.id);
        stories.forEach((us) => {
          lines.push(`- **${us.title}**`);
          const usTasks = storytasks.filter((t) => Number(t.user_story_id) === Number(us.id));
          usTasks.forEach((t) => lines.push(`  - ${t.title}`));
        });
      });
    });
  }
  return lines.join('\n');
}

// Pick 5 diverse projects with good content (prefer those with summaries, features, epics)
const candidates = projects
  .filter((p) => p.summary && p.summary !== 'No summary provided' && p.summary.length > 50)
  .sort((a, b) => (b.summary?.length || 0) - (a.summary?.length || 0));

const selected = candidates.slice(0, 5).length >= 5
  ? candidates.slice(0, 5)
  : projects.slice(0, 5);

const header = `# Sample Project Outputs for AI Training

These 5 projects were extracted from the actual database dump (MycrewManager_db_2.sql).
Use as few-shot examples or training data. Run \`node scripts/export-projects.js\` when DB is connected to refresh from live data.

---

`;

const md = header + selected.map(toMd).join('\n\n---\n\n');
const outPath = path.join(__dirname, '../sample-outputs.md');
fs.writeFileSync(outPath, md, 'utf8');
console.log(`Wrote ${outPath} with ${selected.length} projects`);
