import { verifyAccessToken } from '../lib/jwt.js';
import { User } from '../models/User.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.sub);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

export function requireAdmin(req, res, next) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return res.status(500).json({ error: 'Server not configured' });
  if (req.user?.email !== adminEmail) return res.status(403).json({ error: 'Forbidden' });
  return next();
}
