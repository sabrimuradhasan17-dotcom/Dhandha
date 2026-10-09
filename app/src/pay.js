import { api } from './api';

/** Pays for a booking. Uses Razorpay checkout when configured server-side, else the dev mock. */
export async function payForBooking(booking, user) {
  const order = await api('POST', '/payments/order', { bookingId: booking.id });
  let result;
  if (order.provider === 'mock') {
    result = await api('POST', '/payments/mock-pay', { orderId: order.orderId });
  } else {
    // Needs a dev build (not Expo Go): `npx expo prebuild` then run on device.
    const RazorpayCheckout = require('react-native-razorpay').default;
    const r = await RazorpayCheckout.open({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount * 100,
      currency: 'INR',
      name: 'Dhandha',
      description: booking.service_name,
      prefill: { contact: user.phone, name: user.name },
    });
    result = { orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature };
  }
  await api('POST', '/payments/verify', result);
}
