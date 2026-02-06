import { Router } from 'express';
import { z } from 'zod';

import { requireAuth } from '../middleware/auth.js';
import { validateWalletAddress } from '../lib/validation.js';
import { sendAdminDepositEmail, sendAdminWithdrawEmail } from '../lib/mailer.js';
import { Transaction } from '../models/Transaction.js';

export const transactionsRouter = Router();

transactionsRouter.get('/', requireAuth, async (req, res) => {
  const txns = await Transaction.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(100);
  return res.json({ transactions: txns });
});

transactionsRouter.post('/deposit', requireAuth, async (req, res) => {
  const schema = z.object({
    amount: z.number().positive(),
    network: z.enum(['TRC20', 'BEP20']),
    walletAddress: z.string().min(1),
    txid: z.string().min(6),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const { amount, network, walletAddress, txid } = parsed.data;
  if (!validateWalletAddress(network, walletAddress)) return res.status(400).json({ error: 'Invalid address' });

  const txn = await Transaction.create({
    userId: req.user._id,
    type: 'deposit',
    amount,
    currency: 'USD',
    network,
    walletAddress,
    txid,
    status: 'pending',
  });

  try {
    await sendAdminDepositEmail({ transaction: txn, user: req.user });
  } catch {
    // ignore
  }

  return res.json({ transaction: txn });
});

transactionsRouter.post('/withdraw', requireAuth, async (req, res) => {
  const schema = z.object({
    amount: z.number().positive(),
    network: z.enum(['TRC20', 'BEP20']),
    walletAddress: z.string().min(1),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const { amount, network, walletAddress } = parsed.data;
  if (!validateWalletAddress(network, walletAddress)) return res.status(400).json({ error: 'Invalid address' });

  const minWithdrawal = 5;
  if (amount < minWithdrawal) return res.status(400).json({ error: `Minimum withdrawal is $${minWithdrawal}` });
  if (req.user.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

  req.user.balance -= amount;
  await req.user.save();

  const txn = await Transaction.create({
    userId: req.user._id,
    type: 'withdraw',
    amount,
    currency: 'USD',
    network,
    walletAddress,
    status: 'pending',
  });

  try {
    await sendAdminWithdrawEmail({ transaction: txn, user: req.user });
  } catch {
    // ignore
  }

  return res.json({ transaction: txn });
});
