#!/usr/bin/env node
// Builds two stand-alone HTML files (images embedded) that can be sent by WhatsApp/email and opened by double-click:
//   node tools/build-single-html.js <out-dir>
//   skyland-website-preview.html   skyland-admin-demo.html   (keep them in the same folder so their links work)
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const out = process.argv[2]; if (!out) { console.error('usage: build-single-html.js <out-dir>'); process.exit(1); }
const SITE = 'skyland-website-preview.html', ADMIN = 'skyland-admin-demo.html';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bzsingle-'));
const run = (script, dir, link) => cp.execFileSync('node', [path.join(__dirname, script), path.join(tmp, dir), link], { stdio: 'pipe' });
run('build-preview.js', 'site', process.env.ADMIN_URL || ADMIN);
run('build-admin-demo.js', 'admin', process.env.SITE_URL || SITE);
// embed fonts so the file looks right offline / in restricted viewers
const font = (family, file, weight) => `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:swap;src:url(data:font/woff2;base64,${fs.readFileSync(path.join(__dirname, 'fonts', file)).toString('base64')}) format('woff2')}`;
const FONT_CSS = font('Fraunces', 'fraunces.woff2', '600 700') + font('Inter', 'inter.woff2', '400 700');
// smaller images keep the files light enough for phones and chat previews
for (const dir of ['site', 'admin']) {
  const root = path.join(tmp, dir, 'img'); if (!fs.existsSync(root)) continue;
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  for (const f of walk(root).filter(f => f.endsWith('.jpg'))) {
    const w = f.endsWith('hero.jpg') ? 1200 : f.includes('packages') ? 720 : 640;
    cp.execFileSync('convert', [f, '-resize', w + 'x>', '-strip', '-interlace', 'Plane', '-quality', '62', f]);
  }
}
const mime = { png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml' };
const inline = (html, dir) => html.replace(/img\/[\w\/.-]+?\.(png|jpg|svg)/g, m => {
  const f = path.join(dir, m); if (!fs.existsSync(f)) return m;
  return `data:${mime[m.split('.').pop()]};base64,${fs.readFileSync(f).toString('base64')}`;
});
const wrap = f => { f = f.replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>/, '<style>' + FONT_CSS + '</style>'); const i = f.lastIndexOf('</style>') + 8;
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">\n${f.slice(0, i)}\n</head><body>\n${f.slice(i)}\n</body></html>\n`; };
fs.mkdirSync(out, { recursive: true });
for (const [dir, name] of [['site', SITE], ['admin', ADMIN]]) {
  const html = wrap(inline(fs.readFileSync(path.join(tmp, dir, 'index.html'), 'utf8'), path.join(tmp, dir)));
  fs.writeFileSync(path.join(out, name), html); console.log(name, (html.length / 1048576).toFixed(1) + ' MB');
}
fs.rmSync(tmp, { recursive: true, force: true });
