import { Router } from 'express';
import { z } from 'zod';

import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { InvestmentPlan } from '../models/InvestmentPlan.js';

export const adminRouter = Router();

adminRouter.use(requireAuth);
adminRouter.use(requireAdmin);

adminRouter.get('/stats', async (_req, res) => {
  const [totalDeposits, totalWithdrawals, usersCount] = await Promise.all([
    Transaction.aggregate([
      { $match: { type: 'deposit', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: { type: 'withdraw', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    User.countDocuments({}),
  ]);

  return res.json({
    totalDeposits: totalDeposits[0]?.total || 0,
    totalWithdrawals: totalWithdrawals[0]?.total || 0,
    activeUsers: usersCount,
  });
});

adminRouter.get('/users', async (_req, res) => {
  const users = await User.find({}).sort({ createdAt: -1 }).limit(200);
  return res.json({ users });
});

adminRouter.get('/transactions', async (_req, res) => {
  const txns = await Transaction.find({}).sort({ createdAt: -1 }).limit(500);
  return res.json({ transactions: txns });
});

adminRouter.post('/transactions/:id/status', async (req, res) => {
  const schema = z.object({ status: z.enum(['pending', 'completed', 'failed']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const txn = await Transaction.findById(req.params.id);
  if (!txn) return res.status(404).json({ error: 'Not found' });

  const prevStatus = txn.status;
  const nextStatus = parsed.data.status;

  if (prevStatus !== nextStatus) {
    const user = await User.findById(txn.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (txn.type === 'deposit' && prevStatus !== 'completed' && nextStatus === 'completed') {
      user.balance += txn.amount;
      await user.save();
    }

    if (txn.type === 'withdraw' && prevStatus !== 'failed' && nextStatus === 'failed') {
      user.balance += txn.amount;
      await user.save();
    }
  }

  txn.status = nextStatus;
  await txn.save();

  return res.json({ transaction: txn });
});

adminRouter.get('/plans', async (_req, res) => {
  const plans = await InvestmentPlan.find({}).sort({ amount: 1 });
  return res.json({ plans });
});

adminRouter.post('/plans', async (req, res) => {
  const schema = z.object({ amount: z.number().positive(), dailyEarning: z.number().positive() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const existing = await InvestmentPlan.findOne({ amount: parsed.data.amount });
  if (existing) {
    existing.dailyEarning = parsed.data.dailyEarning;
    await existing.save();
    return res.json({ plan: existing });
  }

  const plan = await InvestmentPlan.create(parsed.data);
  return res.json({ plan });
});

adminRouter.delete('/plans/:id', async (req, res) => {
  const plan = await InvestmentPlan.findByIdAndDelete(req.params.id);
  if (!plan) return res.status(404).json({ error: 'Not found' });
  return res.json({ ok: true });
});
