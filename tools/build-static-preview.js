#!/usr/bin/env node
// Builds both previews as plain static files you can host anywhere (Netlify Drop, GitHub Pages, Cloudflare Pages, any web server):
//   node tools/build-static-preview.js <out-dir>
//   <out-dir>/index.html        website preview (read-only)
//   <out-dir>/admin/index.html  admin panel demo (simulated backend, data stays in the visitor's browser)
const fs = require('fs'), path = require('path'), cp = require('child_process');
const out = process.argv[2]; if (!out) { console.error('usage: build-static-preview.js <out-dir>'); process.exit(1); }
const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'bzprev-'));
const run = (script, dir, link) => cp.execFileSync('node', [path.join(__dirname, script), path.join(tmp, dir), link], { stdio: 'pipe' });
run('build-preview.js', 'site', 'admin/');
run('build-admin-demo.js', 'admin', '../');
// the builders emit page fragments (for a host that wraps them); add the document shell for standalone hosting
const wrap = (file, icon) => {
  const f = fs.readFileSync(file, 'utf8'), i = f.indexOf('</style>') + 8;
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><link rel="icon" href="${icon}">\n${f.slice(0, i)}\n</head><body>\n${f.slice(i)}\n</body></html>\n`;
};
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'admin'), { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), wrap(path.join(tmp, 'site/index.html'), 'img/favicon.png'));
fs.cpSync(path.join(tmp, 'site/img'), path.join(out, 'img'), { recursive: true });
fs.cpSync(path.join(tmp, 'site/fonts'), path.join(out, 'fonts'), { recursive: true });
fs.writeFileSync(path.join(out, 'admin/index.html'), wrap(path.join(tmp, 'admin/index.html'), '../img/favicon.png'));
fs.cpSync(path.join(tmp, 'admin/img'), path.join(out, 'admin/img'), { recursive: true });
fs.cpSync(path.join(tmp, 'admin/fonts'), path.join(out, 'admin/fonts'), { recursive: true });
fs.writeFileSync(path.join(out, '.nojekyll'), '');
fs.rmSync(tmp, { recursive: true, force: true });
console.log('built', out);
