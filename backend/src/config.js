export const config = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  dbPath: process.env.DB_PATH || './dhandha.db',
  commissionPercent: Number(process.env.COMMISSION_PERCENT || 20),
  offerFanout: Number(process.env.OFFER_FANOUT || 3),
  offerTtlMin: Number(process.env.OFFER_TTL_MIN || 10),
  countryCode: process.env.DEFAULT_COUNTRY_CODE || '+91',
  twilioSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioFrom: process.env.TWILIO_FROM || '',
  otpCooldownSec: Number(process.env.OTP_COOLDOWN_SEC ?? 30),
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
};
export const razorpayEnabled = () => Boolean(config.razorpayKeyId && config.razorpayKeySecret);

if (process.env.NODE_ENV === 'production' && config.jwtSecret === 'dev-secret-change-me') {
  throw new Error('Refusing to start in production without JWT_SECRET');
}
