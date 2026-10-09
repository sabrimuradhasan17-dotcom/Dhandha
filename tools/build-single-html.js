#!/usr/bin/env node
// Builds two stand-alone HTML files (photos + fonts embedded, no server, no internet) that can be sent by WhatsApp/email
// and opened by double-click:
//   node tools/build-single-html.js <out-dir>
//   la-bhutanz-website-preview.html   la-bhutanz-admin-demo.html   (keep them in the same folder so their links work)
// The website file embeds web-sized copies of the photos (the full-quality set ships in the zip / hosted version).
// A text snapshot is baked in so viewers that block scripts still show the content; with scripts on, the full motion site runs.
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const out = process.argv[2]; if (!out) { console.error('usage: build-single-html.js <out-dir>'); process.exit(1); }
const SITE = 'la-bhutanz-website-preview.html', ADMIN = 'la-bhutanz-admin-demo.html';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bzsingle-'));
const run = (script, dir, link) => cp.execFileSync('node', [path.join(__dirname, script), path.join(tmp, dir), link], { stdio: 'pipe' });
run('build-preview.js', 'site', ADMIN);
run('build-admin-demo.js', 'admin', SITE);

// web-sized photos: hero 1280px, others 720px (PIL), logo 220px
cp.execFileSync('python3', ['-I', '-c', `
import sys, glob, os
from PIL import Image
d = sys.argv[1]
for f in glob.glob(d + '/img/photos/*.jpg'):
    im = Image.open(f).convert('RGB'); mw = 1280 if os.path.basename(f).startswith('hero-') else 720
    if im.width > mw: im = im.resize((mw, round(im.height * mw / im.width)), Image.LANCZOS)
    im.save(f, 'JPEG', quality=58, optimize=True, progressive=True)
lg = d + '/img/logo.png'; im = Image.open(lg)
im = im.resize((220, round(im.height * 220 / im.width)), Image.LANCZOS); im.save(lg, optimize=True)
`, path.join(tmp, 'site')], { stdio: 'pipe' });

// bake the snapshot while the photos are still plain files (so they are not duplicated into the snapshot)
cp.execFileSync('node', [path.join(__dirname, 'prerender.js'), path.join(tmp, 'site/index.html')], { stdio: 'pipe' });

const b64 = f => fs.readFileSync(f).toString('base64');
const fontsInline = (html, dir) => html.replace(/url\(fonts\/([\w.-]+\.woff2)\)/g, (m, n) => `url(data:font/woff2;base64,${b64(path.join(dir, 'fonts', n))})`);
const logoInline = (html, dir) => html.split('img/logo.png').join('data:image/png;base64,' + b64(path.join(dir, 'img/logo.png')));
const faviconInline = (html, dir) => { const f = path.join(dir, 'img/favicon.png'); return fs.existsSync(f) ? html.split('img/favicon.png').join('data:image/png;base64,' + b64(f)) : html; };
const wrap = f => { const i = f.indexOf('</style>') + 8;
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#fbf7f0">\n${f.slice(0, i)}\n</head><body>\n${f.slice(i)}\n</body></html>\n`; };

// website
{
  const dir = path.join(tmp, 'site'); let html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  const map = {};
  for (const f of fs.readdirSync(path.join(dir, 'img/photos'))) map['img/photos/' + f] = 'data:image/jpeg;base64,' + b64(path.join(dir, 'img/photos', f));
  map['img/logo.png'] = 'data:image/png;base64,' + b64(path.join(dir, 'img/logo.png'));
  const hook = `<script>window.__IMG=${JSON.stringify(map)};(function(){var M=window.__IMG,re=/img\\/(photos\\/[\\w-]+\\.jpg|logo\\.png)/g,d=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');Object.defineProperty(Element.prototype,'innerHTML',{configurable:true,get:d.get,set:function(v){d.set.call(this,typeof v==='string'?v.replace(re,function(m){return M[m]||m}):v)}})})();</script>\n`;
  const at = html.indexOf('<script>\nlet __route'); if (at < 0) throw new Error('shim not found');
  // the baked snapshot's <img> tags would request files that do not exist in a single file; the live render swaps in embedded copies
  html = html.slice(0, at).split('src="img/photos/').join('data-src="img/photos/') + hook + html.slice(at);
  html = faviconInline(logoInline(fontsInline(html, dir), dir), dir);
  html = wrap(html);
  fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, SITE), html); console.log(SITE, (html.length / 1048576).toFixed(1) + ' MB');
}
// admin demo
{
  const dir = path.join(tmp, 'admin'); let html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  html = wrap(faviconInline(logoInline(fontsInline(html, dir), dir), dir));
  fs.writeFileSync(path.join(out, ADMIN), html); console.log(ADMIN, (html.length / 1048576).toFixed(1) + ' MB');
}
fs.rmSync(tmp, { recursive: true, force: true });
