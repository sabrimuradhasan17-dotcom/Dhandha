import crypto from 'node:crypto';
import { config, razorpayEnabled } from './config.js';

const MOCK_SECRET = 'mock-secret';
const hmac = (secret, data) => crypto.createHmac('sha256', secret).update(data).digest('hex');
const eq = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

async function rzp(path, body) {
  const auth = Buffer.from(`${config.razorpayKeyId}:${config.razorpayKeySecret}`).toString('base64');
  const r = await fetch(`https://api.razorpay.com/v1${path}`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await r.json();
  if (!r.ok) throw new Error(json?.error?.description || `Razorpay error ${r.status}`);
  return json;
}

/** Create a payment order for `amount` rupees. */
export async function createOrder(bookingId, amount) {
  if (!razorpayEnabled()) {
    return { provider: 'mock', orderId: `mock_order_${bookingId}_${Date.now()}`, keyId: 'mock' };
  }
  const o = await rzp('/orders', { amount: amount * 100, currency: 'INR', receipt: `booking_${bookingId}` });
  return { provider: 'razorpay', orderId: o.id, keyId: config.razorpayKeyId };
}

/** Verify the checkout signature returned to the app after payment. */
export function verifySignature(orderId, paymentId, signature) {
  if (!razorpayEnabled()) {
    return process.env.NODE_ENV !== 'production' && eq(signature, hmac(MOCK_SECRET, `${orderId}|${paymentId}`));
  }
  return eq(signature, hmac(config.razorpayKeySecret, `${orderId}|${paymentId}`));
}

export const mockSign = (orderId, paymentId) => hmac(MOCK_SECRET, `${orderId}|${paymentId}`);

export function verifyWebhook(rawBody, signature) {
  if (!razorpayEnabled() || !signature) return false;
  return eq(signature, hmac(config.razorpayKeySecret, rawBody));
}

export async function refund(providerPaymentId, amount) {
  if (!razorpayEnabled()) return;
  await rzp(`/payments/${providerPaymentId}/refund`, { amount: amount * 100 });
}
