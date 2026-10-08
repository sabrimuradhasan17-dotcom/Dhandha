// Tiny JSON-file database: whole DB in memory, written atomically on every change.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const FILE = path.join(DIR, 'db.json');
fs.mkdirSync(path.join(DIR, 'uploads'), { recursive: true });
let db = null;

function hashPassword(pw, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  return { salt, hash: crypto.scryptSync(pw, salt, 64).toString('hex') };
}
function checkPassword(pw, rec) {
  const h = crypto.scryptSync(pw, rec.salt, 64);
  const b = Buffer.from(rec.hash, 'hex');
  return h.length === b.length && crypto.timingSafeEqual(h, b);
}
function uid() { return crypto.randomBytes(5).toString('hex'); }

function load() {
  if (db) return db;
  if (fs.existsSync(FILE)) db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  else {
    db = require('./seed')();
    const pw = process.env.ADMIN_PASSWORD || 'skyland@2026';
    db.admin = { ...hashPassword(pw), mustChange: !process.env.ADMIN_PASSWORD };
    db.secret = crypto.randomBytes(32).toString('hex');
    save();
  }
  return db;
}
function save() {
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 1));
  fs.renameSync(tmp, FILE);
}
function backup() {
  const d = path.join(DIR, 'backups'); fs.mkdirSync(d, { recursive: true });
  const f = path.join(d, 'db-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json');
  fs.copyFileSync(FILE, f);
  const all = fs.readdirSync(d).sort(); while (all.length > 20) fs.unlinkSync(path.join(d, all.shift()));
}
function replace(next) { backup(); db = next; save(); }
module.exports = { load, save, uid, hashPassword, checkPassword, replace, DIR, get db() { return load(); } };
