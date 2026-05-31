#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2] || process.cwd();
const skills = readdirSync(root)
  .map((name) => join(root, name))
  .filter((path) => statSync(path).isDirectory())
  .filter((path) => {
    try { return statSync(join(path, 'SKILL.md')).isFile(); }
    catch { return false; }
  });

const rows = skills.map((dir) => {
  const skill = dir.split(/[\\/]/).pop();
  const text = readFileSync(join(dir, 'SKILL.md'), 'utf8');
  const bashBlocks = [...text.matchAll(/```bash\n([\s\S]*?)```/g)].length;
  const commandMentions = [...text.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]).filter((cmd) => /\b(npm|node|curl|code|gmcli|gdcli|gccli|browser-|search\.js|content\.js)\b/.test(cmd));
  return {
    skill,
    lines: text.split(/\r?\n/).length,
    bashBlocks,
    commandMentions: commandMentions.length,
    network: /https?:\/\/|api|oauth|gmail|drive|calendar|youtube|brave|groq/i.test(text),
    mutating: /send email|upload|delete|share|sharing|create|update|draft|download/i.test(text),
    auth: /api key|oauth|credential|token|cookies|logins|profile/i.test(text),
  };
});

console.log('# Skill Telemetry Summary');
console.log('');
console.log(`Skills: ${rows.length}`);
console.log(`Network-capable: ${rows.filter((r) => r.network).length}`);
console.log(`Auth-sensitive: ${rows.filter((r) => r.auth).length}`);
console.log(`Potentially mutating: ${rows.filter((r) => r.mutating).length}`);
console.log('');
console.log('| Skill | Lines | Bash blocks | Commands | Network | Auth | Mutating |');
console.log('|---|---:|---:|---:|---|---|---|');
for (const r of rows) {
  console.log(`| ${r.skill} | ${r.lines} | ${r.bashBlocks} | ${r.commandMentions} | ${r.network ? 'yes' : 'no'} | ${r.auth ? 'yes' : 'no'} | ${r.mutating ? 'yes' : 'no'} |`);
}
