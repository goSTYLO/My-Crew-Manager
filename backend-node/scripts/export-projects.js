/**
 * Export up to 5 projects from the database for AI training samples
 * Run: node scripts/export-projects.js [> sample-outputs.md]
 * Requires: DATABASE_URL or DB_* vars in env (from .env)
 * Note: sample-outputs.md is pre-populated from seed data. Run this script with
 * a live DB connection to overwrite with real project data.
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../src/lib/prisma.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

if (!process.env.DATABASE_URL && process.env.DB_NAME) {
  const user = process.env.DB_USER || 'postgres';
  const pass = process.env.DB_PASSWORD || '';
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const db = process.env.DB_NAME;
  process.env.DATABASE_URL = `postgresql://${user}:${encodeURIComponent(pass)}@${host}:${port}/${db}`;
}

function projectToMarkdown(p) {
  const lines = [];
  lines.push(`## ${p.title}`);
  lines.push('');
  if (p.summary) {
    lines.push('**Summary:**');
    lines.push(p.summary);
    lines.push('');
  }
  if (p.status) {
    lines.push(`**Status:** ${p.status}`);
    lines.push('');
  }
  if (p.proposalText) {
    lines.push('**Proposal / Input:**');
    lines.push(p.proposalText);
    lines.push('');
  }
  if (p.roles?.length) {
    lines.push('**Roles:**');
    p.roles.forEach((r) => lines.push(`- ${r}`));
    lines.push('');
  }
  if (p.features?.length) {
    lines.push('**Features:**');
    p.features.forEach((f) => lines.push(`- ${typeof f === 'string' ? f : f.title}`));
    lines.push('');
  }
  if (p.goals?.length) {
    lines.push('**Goals:**');
    p.goals.forEach((g) => {
      const t = typeof g === 'object' ? `${g.title} (${g.role || ''})` : g;
      lines.push(`- ${t}`);
    });
    lines.push('');
  }
  if (p.timeline?.length) {
    lines.push('**Timeline:**');
    p.timeline.forEach((w) => {
      const weekNum = w.week ?? w.week_number;
      lines.push(`Week ${weekNum}:`);
      (w.items ?? []).forEach((i) => lines.push(`- ${typeof i === 'string' ? i : i.title}`));
    });
    lines.push('');
  }
  if (p.repositories?.length) {
    lines.push('**Repositories:**');
    p.repositories.forEach((r) => {
      const name = r.name ?? '';
      const url = r.url ?? '';
      const branch = r.branch ?? 'main';
      lines.push(`- ${name}: ${url} (${branch})`);
    });
    lines.push('');
  }
  if (p.epics?.length) {
    lines.push('**Backlog (Epics → Sub-epics → User Stories → Tasks):**');
    p.epics.forEach((epic) => {
      lines.push(`### ${epic.title}`);
      if (epic.description) lines.push(`*${epic.description}*`);
      (epic.subEpics ?? []).forEach((sub) => {
        lines.push(`#### ${sub.title}`);
        (sub.stories ?? []).forEach((story) => {
          const stitle = typeof story === 'string' ? story : story.title;
          lines.push(`- **${stitle}**`);
          const tasks = story.tasks ?? [];
          tasks.forEach((t) => lines.push(`  - ${typeof t === 'string' ? t : t.title}`));
        });
      });
    });
  }
  return lines.join('\n');
}

async function main() {
  const projects = await prisma.ai_api_project.findMany({
    take: 5,
    orderBy: { id: 'asc' },
    include: {
      ai_api_projectfeature: { orderBy: { id: 'asc' } },
      ai_api_projectgoal: { orderBy: { id: 'asc' } },
      ai_api_projectrole: { orderBy: { id: 'asc' } },
      ai_api_proposal: { orderBy: { id: 'asc' } },
      ai_api_repository: { orderBy: { id: 'asc' } },
      ai_api_timelineweek: { orderBy: { week_number: 'asc' }, include: { ai_api_timelineitem: { orderBy: { id: 'asc' } } } },
      ai_api_epic: { orderBy: { id: 'asc' }, include: { ai_api_subepic: { orderBy: { id: 'asc' } } } },
    },
  });

  const normalized = projects.map((proj) => {
    const proposal = proj.ai_api_proposal?.[0];
    const proposalText = proposal?.parsed_text ?? null;

    const epics = (proj.ai_api_epic ?? []).map((epic) => {
      const subEpics = (epic.ai_api_subepic ?? []).map(async (sub) => {
        const userStories = await prisma.ai_api_userstory.findMany({
          where: { sub_epic_id: sub.id },
          orderBy: { id: 'asc' },
          include: {
            ai_api_storytask: { orderBy: { id: 'asc' } },
          },
        });
        return {
          title: sub.title,
          stories: userStories.map((us) => ({
            title: us.title,
            tasks: (us.ai_api_storytask ?? []).map((t) => t.title),
          })),
        };
      });
      return { epic, subEpics };
    });

    return {
      id: proj.id,
      title: proj.title,
      summary: proj.summary,
      status: proj.status,
      proposalText,
      roles: (proj.ai_api_projectrole ?? []).map((r) => r.role),
      features: (proj.ai_api_projectfeature ?? []).map((f) => f.title),
      goals: (proj.ai_api_projectgoal ?? []).map((g) => ({ title: g.title, role: g.role })),
      timeline: (proj.ai_api_timelineweek ?? []).map((w) => ({
        week_number: w.week_number,
        items: (w.ai_api_timelineitem ?? []).map((i) => i.title),
      })),
      repositories: (proj.ai_api_repository ?? []).map((r) => ({ name: r.name, url: r.url, branch: r.branch })),
      epicsData: epics,
    };
  });

  const results = [];
  for (const n of normalized) {
    const epics = [];
    for (const { epic, subEpics } of n.epicsData) {
      const subs = await Promise.all(subEpics);
      epics.push({
        title: epic.title,
        description: epic.description ?? null,
        subEpics: subs,
      });
    }
    results.push({
      ...n,
      epics,
      epicsData: undefined,
    });
  }

  return results.map((p) => projectToMarkdown(p)).join('\n\n---\n\n');
}

main()
  .then((md) => {
    console.log(md);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
