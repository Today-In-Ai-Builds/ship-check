// The two agent skills Ship Check composes, loaded at the exact commits that
// were reviewed, and refused if their bytes ever differ from that review.
// Nothing from either repo is copied into this one or installed into your agent.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const SKILLS = {
  review: {
    name: 'Ponytail review',
    repo: 'DietrichGebert/ponytail', license: 'MIT',
    commit: '9cc65d03aa2da1db7121b912d03596409ee340b8',
    path: 'skills/ponytail-review/SKILL.md',
    sha256: '33fe4ebe22a460924e5d4a261e223df22e409cc94ab76182bee9fb91a3ef022e',
  },
  diagnose: {
    name: "Matt Pocock's diagnosing-bugs",
    repo: 'mattpocock/skills', license: 'MIT',
    commit: 'b0618bc436ad893b3c5e84e55fba86586d34a404',
    path: 'skills/engineering/diagnosing-bugs/SKILL.md',
    sha256: '849198df88cdb65fd0d97236604c1fca7ff2f22d2f705f9724a800d0266b118d',
  },
};

const sha256 = (text) => createHash('sha256').update(text, 'utf8').digest('hex');

async function fetchRaw(skill) {
  const url = `https://raw.githubusercontent.com/${skill.repo}/${skill.commit}/${skill.path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${skill.name}: ${url} returned ${res.status}`);
  return res.text();
}

export async function loadSkill(skill, { fetch = fetchRaw, cacheDir = '.ship-check/skills' } = {}) {
  const cached = cacheDir && join(cacheDir, `${skill.sha256}.md`);
  let text;
  if (cached) text = await readFile(cached, 'utf8').catch(() => undefined);
  text ??= await fetch(skill);
  if (sha256(text) !== skill.sha256) {
    throw new Error(`${skill.name} at ${skill.commit.slice(0, 7)} does not match its pinned sha256; ` +
      'refusing to run it. Review the new version before updating the pin in ship-check/skills.mjs.');
  }
  if (cached) {
    await mkdir(cacheDir, { recursive: true });
    await writeFile(cached, text, 'utf8');
  }
  return text;
}
