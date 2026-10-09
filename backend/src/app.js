import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/auth.js';
import catalogRoutes from './routes/catalog.js';
import bookingRoutes from './routes/bookings.js';
import paymentRoutes from './routes/payments.js';
import workerRoutes from './routes/worker.js';
import chatRoutes from './routes/chat.js';
import adminRoutes from './routes/admin.js';
import { seedCatalog, seedAdmin } from './seed.js';

seedCatalog();
seedAdmin();

export const app = express();
app.use(cors());
app.use(express.json({ verify: (req, _res, buf) => (req.rawBody = buf.toString('utf8')) }));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/auth', authRoutes);
app.use('/', catalogRoutes);
app.use('/bookings', bookingRoutes);
app.use('/payments', paymentRoutes);
app.use('/bookings', chatRoutes);
app.use('/worker', workerRoutes);
app.use('/admin', adminRoutes);
app.use('/', express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), '../public')));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});
