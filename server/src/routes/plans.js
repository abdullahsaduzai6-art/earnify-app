import { Router } from 'express';
import { InvestmentPlan } from '../models/InvestmentPlan.js';

export const plansRouter = Router();

plansRouter.get('/', async (_req, res) => {
  const plans = await InvestmentPlan.find({}).sort({ amount: 1 });
  return res.json({ plans });
});
