const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'docs/visual-acceptance/v7-20260907');
fs.mkdirSync(out, { recursive: true });
const target = path.join(out, 'baseline.json');
if (fs.existsSync(target)) throw Error('Baseline already exists; preserve the original snapshot.');
const files = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f);
    else if (e.isFile()) files.push({ file: path.relative(root, f), bytes: fs.statSync(f).size, sha256: crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex') });
  }
}
walk(path.join(root, 'src'));
for (const name of ['package.json', 'package-lock.json', 'vite.config.ts', 'index.html']) {
  const file = path.join(root, name);
  if (fs.existsSync(file)) files.push({ file: name, sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') });
}
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });
fs.writeFileSync(target, JSON.stringify({ createdAt: new Date().toISOString(), root, commit: git('rev-parse', 'HEAD').trim(), branch: git('branch', '--show-current').trim(), status: git('status', '--porcelain=v1', '--untracked-files=all'), files }, null, 2));
fs.writeFileSync(path.join(out, 'baseline-working-tree.patch'), git('diff', '--binary'));
console.log(JSON.stringify({ snapshot: target, files: files.length }));
