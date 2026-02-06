import { Router } from 'express';
import { z } from 'zod';

import { User } from '../models/User.js';
import { hashPassword, verifyPassword } from '../lib/crypto.js';
import { signAccessToken } from '../lib/jwt.js';
import { generateReferralCode, validatePasswordStrength } from '../lib/validation.js';

export const authRouter = Router();

authRouter.post('/signup', async (req, res) => {
  const schema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string(),
    phone: z.string().optional(),
    referralCode: z.string().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const { name, email, password, phone, referralCode } = parsed.data;
  if (!validatePasswordStrength(password)) {
    return res.status(400).json({ error: 'Weak password' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ error: 'Email already in use' });

  const hashedPassword = await hashPassword(password);

  let code = generateReferralCode();
  // avoid collision (rare)
  // eslint-disable-next-line no-await-in-loop
  while (await User.findOne({ referralCode: code })) code = generateReferralCode();

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    phone: phone || '',
    hashedPassword,
    referralCode: code,
    referredUsers: [],
  });

  if (referralCode) {
    const referrer = await User.findOne({ referralCode });
    if (referrer && String(referrer._id) !== String(user._id)) {
      referrer.referredUsers.push(user._id);
      await referrer.save();
    }
  }

  const token = signAccessToken({ sub: String(user._id) });
  return res.json({ token });
});

authRouter.post('/login', async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

    const { email, password } = parsed.data;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await verifyPassword(password, user.hashedPassword);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signAccessToken({ sub: String(user._id) });
    return res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
