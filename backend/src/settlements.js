import { db, tx } from './db.js';

/**
 * Balance = what the platform owes the worker.
 *  + worker's share of online-paid completed jobs (platform collected the money)
 *  - commission on cash jobs (worker collected the money)
 *  - payouts already made, + remittances already received
 * Negative balance means the worker owes the platform.
 */
export function workerBalance(workerId) {
  const j = db
    .prepare(
      `SELECT COALESCE(SUM(CASE WHEN payment_method='online' THEN amount - commission END),0) AS online_share,
              COALESCE(SUM(CASE WHEN payment_method='cash' THEN commission END),0) AS cash_commission
       FROM bookings WHERE worker_id = ? AND status = 'completed'`,
    )
    .get(workerId);
  const s = db
    .prepare(
      `SELECT COALESCE(SUM(CASE WHEN kind='payout' THEN amount END),0) AS paid_out,
              COALESCE(SUM(CASE WHEN kind='remittance' THEN amount END),0) AS remitted
       FROM settlements WHERE worker_id = ?`,
    )
    .get(workerId);
  return {
    online_share: j.online_share,
    cash_commission: j.cash_commission,
    paid_out: s.paid_out,
    remitted: s.remitted,
    balance: j.online_share - j.cash_commission - s.paid_out + s.remitted,
  };
}

export const settlementHistory = (workerId) =>
  db.prepare('SELECT id, kind, amount, reference, created_at FROM settlements WHERE worker_id = ? ORDER BY id DESC LIMIT 100').all(workerId);

export function recordSettlement(workerId, kind, amount, reference) {
  if (!['payout', 'remittance'].includes(kind)) return { status: 400, error: "kind must be 'payout' or 'remittance'" };
  if (!Number.isInteger(amount) || amount <= 0) return { status: 400, error: 'amount must be a positive whole number of rupees' };
  if (!db.prepare('SELECT 1 FROM workers WHERE user_id = ?').get(workerId)) return { status: 404, error: 'Worker not found' };
  return tx(() => {
    const { balance } = workerBalance(workerId);
    if (kind === 'payout' && amount > balance) return { status: 409, error: `Cannot pay more than the balance owed (₹${Math.max(balance, 0)})` };
    if (kind === 'remittance' && amount > -balance) return { status: 409, error: `Worker only owes ₹${Math.max(-balance, 0)}` };
    const x = db.prepare('INSERT INTO settlements (worker_id, kind, amount, reference) VALUES (?,?,?,?)').run(workerId, kind, amount, reference);
    return { id: Number(x.lastInsertRowid), ...workerBalance(workerId) };
  });
}
