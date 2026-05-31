#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2] || process.cwd();
const skillDirs = readdirSync(root)
  .map((name) => join(root, name))
  .filter((path) => statSync(path).isDirectory())
  .filter((path) => {
    try { return statSync(join(path, 'SKILL.md')).isFile(); }
    catch { return false; }
  });

const rows = [];
let failures = 0;

for (const dir of skillDirs) {
  const name = dir.split(/[\\/]/).pop();
  const file = join(dir, 'SKILL.md');
  const text = readFileSync(file, 'utf8');
  const issues = [];
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!fm) issues.push('missing frontmatter');
  const frontmatter = fm?.[1] || '';
  if (!/^name:\s*\S+/m.test(frontmatter)) issues.push('missing name');
  if (!/^description:\s*\S.{20,}/m.test(frontmatter)) issues.push('missing useful description');
  if (text.includes('{baseDir}')) issues.push('deprecated {baseDir} placeholder');
  if (/npm install(\s+-g)?/i.test(text)) issues.push('installation command requires approval');
  if (/api key|oauth|credential|token|cookies|logins|profile/i.test(text)) issues.push('auth/secrets handling requires approval gate');
  if (/send email|upload|delete|sharing|share|purchase|form/i.test(text)) issues.push('mutating external action requires approval gate');
  if (!/approval|ask|confirm|permission|explicit/i.test(text) && issues.some((i) => /auth|mutating|install/.test(i))) {
    issues.push('missing explicit approval language for risky operation');
  }
  rows.push({ skill: name, issues });
  failures += issues.length;
}

for (const row of rows) {
  console.log(`${row.skill}: ${row.issues.length ? row.issues.join('; ') : 'ok'}`);
}
console.log(`\nSummary: ${skillDirs.length} skills checked, ${failures} issues.`);
process.exitCode = failures > 0 ? 1 : 0;
