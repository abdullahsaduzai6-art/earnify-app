import { Router } from 'express';
import { z } from 'zod';

import { requireAuth } from '../middleware/auth.js';
import { validateWalletAddress, validatePasswordStrength } from '../lib/validation.js';
import { hashPassword, verifyPassword } from '../lib/crypto.js';
import { Transaction } from '../models/Transaction.js';
import { InvestmentPlan } from '../models/InvestmentPlan.js';

export const meRouter = Router();

meRouter.get('/', requireAuth, async (req, res) => {
  const user = req.user;

  const investedAmount = user.investments
    .filter((i) => i.active)
    .reduce((sum, i) => sum + i.amount, 0);

  const dailyEarning = user.investments
    .filter((i) => i.active)
    .reduce((sum, i) => sum + i.dailyEarning, 0);

  const recentTransactions = await Transaction.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(10);

  return res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      walletAddresses: user.walletAddresses,
      referralCode: user.referralCode,
      createdAt: user.createdAt,
    },
    stats: {
      totalBalance: user.balance,
      investedAmount,
      dailyEarning,
      pendingRewards: 0,
    },
    recentTransactions,
  });
});

meRouter.put('/profile', requireAuth, async (req, res) => {
  const schema = z.object({
    name: z.string().min(1).optional(),
    phone: z.string().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const { name, phone } = parsed.data;

  if (typeof name === 'string') req.user.name = name;
  if (typeof phone === 'string') req.user.phone = phone;
  await req.user.save();

  return res.json({ ok: true });
});

meRouter.post('/invest', requireAuth, async (req, res) => {
  const schema = z.object({
    amount: z.number().positive(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const { amount } = parsed.data;
  const plan = await InvestmentPlan.findOne({ amount });
  if (!plan) return res.status(400).json({ error: 'Unknown plan amount' });

  if (req.user.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

  req.user.balance -= amount;
  const now = new Date();
  req.user.investments.push({
    amount: plan.amount,
    planId: plan._id,
    startDate: now,
    dailyEarning: plan.dailyEarning,
    lastAccruedAt: now,
    active: true,
  });

  await req.user.save();

  return res.json({ ok: true });
});

meRouter.put('/password', requireAuth, async (req, res) => {
  const schema = z.object({
    currentPassword: z.string(),
    newPassword: z.string(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const { currentPassword, newPassword } = parsed.data;
  const ok = await verifyPassword(currentPassword, req.user.hashedPassword);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  if (!validatePasswordStrength(newPassword)) return res.status(400).json({ error: 'Weak password' });

  req.user.hashedPassword = await hashPassword(newPassword);
  await req.user.save();

  return res.json({ ok: true });
});

meRouter.put('/wallet', requireAuth, async (req, res) => {
  const schema = z.object({
    network: z.enum(['TRC20', 'BEP20']),
    address: z.string().min(1),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const { network, address } = parsed.data;
  if (!validateWalletAddress(network, address)) return res.status(400).json({ error: 'Invalid address' });

  req.user.walletAddresses[network] = address;
  await req.user.save();

  return res.json({ ok: true });
});

meRouter.get('/is-admin', requireAuth, async (req, res) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const isAdmin = adminEmail && req.user?.email === adminEmail;
  return res.json({ isAdmin });
});
