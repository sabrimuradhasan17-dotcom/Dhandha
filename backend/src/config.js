export const config = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  dbPath: process.env.DB_PATH || './dhandha.db',
  commissionPercent: Number(process.env.COMMISSION_PERCENT || 20),
  offerFanout: Number(process.env.OFFER_FANOUT || 3),
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
};
export const razorpayEnabled = () => Boolean(config.razorpayKeyId && config.razorpayKeySecret);
