import { db } from './db.js';

/** Messages "sent" in mock mode (tests/dev). */
export const pushOutbox = [];
const mock = () => process.env.PUSH_MODE === 'mock';

/** Expo push notification to every device of the given users. Fire-and-forget. */
export function pushTo(userIds, title, body, data = {}) {
  if (!userIds.length) return;
  const rows = db
    .prepare(`SELECT token FROM push_tokens WHERE user_id IN (${userIds.map(() => '?').join(',')})`)
    .all(...userIds);
  if (!rows.length) return;
  const messages = rows.map((r) => ({ to: r.token, title, body, data, sound: 'default' }));
  if (mock()) return void pushOutbox.push(...messages);
  send(messages).catch((e) => console.error('push failed', e.message));
}

async function send(messages) {
  const r = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(messages),
  });
  if (!r.ok) throw new Error(`Expo push ${r.status}`);
  const { data = [] } = await r.json();
  data.forEach((t, i) => {
    if (t.details?.error === 'DeviceNotRegistered') db.prepare('DELETE FROM push_tokens WHERE token = ?').run(messages[i].to);
  });
}
