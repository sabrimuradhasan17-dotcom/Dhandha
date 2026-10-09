import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from './config.js';

export function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(pw, salt, 64).toString('hex')}`;
}

export function verifyPassword(pw, stored) {
  const [salt, hash] = stored.split(':');
  const test = crypto.scryptSync(pw, salt, 64);
  const known = Buffer.from(hash, 'hex');
  return known.length === test.length && crypto.timingSafeEqual(known, test);
}

export const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: '30d' });

export function requireAuth(...roles) {
  return (req, res, next) => {
    const h = req.headers.authorization || '';
    try {
      const p = jwt.verify(h.replace(/^Bearer /, ''), config.jwtSecret);
      if (roles.length && !roles.includes(p.role)) return res.status(403).json({ error: 'Forbidden' });
      req.user = { id: p.sub, role: p.role };
      next();
    } catch {
      res.status(401).json({ error: 'Unauthorized' });
    }
  };
}
