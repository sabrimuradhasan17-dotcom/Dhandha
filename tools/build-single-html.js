#!/usr/bin/env node
// Builds two stand-alone HTML files (images embedded) that can be sent by WhatsApp/email and opened by double-click:
//   node tools/build-single-html.js <out-dir>
//   la-bhutanz-website-preview.html   la-bhutanz-admin-demo.html   (keep them in the same folder so their links work)
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const out = process.argv[2]; if (!out) { console.error('usage: build-single-html.js <out-dir>'); process.exit(1); }
const SITE = 'la-bhutanz-website-preview.html', ADMIN = 'la-bhutanz-admin-demo.html';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bzsingle-'));
const run = (script, dir, link) => cp.execFileSync('node', [path.join(__dirname, script), path.join(tmp, dir), link], { stdio: 'pipe' });
run('build-preview.js', 'site', ADMIN);
run('build-admin-demo.js', 'admin', SITE);
const mime = { png: 'image/png', jpg: 'image/jpeg' };
const inline = (html, dir) => html.replace(/img\/[\w\/.-]+?\.(png|jpg)/g, m => {
  const f = path.join(dir, m); if (!fs.existsSync(f)) return m;
  return `data:${mime[m.split('.').pop()]};base64,${fs.readFileSync(f).toString('base64')}`;
});
const wrap = f => { const i = f.indexOf('</style>') + 8;
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">\n${f.slice(0, i)}\n</head><body>\n${f.slice(i)}\n</body></html>\n`; };
fs.mkdirSync(out, { recursive: true });
for (const [dir, name] of [['site', SITE], ['admin', ADMIN]]) {
  const html = wrap(inline(fs.readFileSync(path.join(tmp, dir, 'index.html'), 'utf8'), path.join(tmp, dir)));
  fs.writeFileSync(path.join(out, name), html); console.log(name, (html.length / 1048576).toFixed(1) + ' MB');
}
fs.rmSync(tmp, { recursive: true, force: true });
