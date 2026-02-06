import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { connectDb } from './lib/db.js';
import { startEarningsScheduler } from './scheduler/earningsScheduler.js';
import { InvestmentPlan } from './models/InvestmentPlan.js';

import { authRouter } from './routes/auth.js';
import { meRouter } from './routes/me.js';
import { plansRouter } from './routes/plans.js';
import { transactionsRouter } from './routes/transactions.js';
import { adminRouter } from './routes/admin.js';

const app = express();

app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://192.168.1.198:3001', '*'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);
app.use(helmet());
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  })
);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/me', meRouter);
app.use('/api/plans', plansRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/admin', adminRouter);

const port = Number(process.env.PORT || 4000);

await connectDb();

await InvestmentPlan.updateOne({ amount: 20 }, { $set: { amount: 20, dailyEarning: 0.6 } }, { upsert: true });
await InvestmentPlan.updateOne({ amount: 40 }, { $set: { amount: 40, dailyEarning: 1 } }, { upsert: true });
await InvestmentPlan.updateOne({ amount: 60 }, { $set: { amount: 60, dailyEarning: 1.4 } }, { upsert: true });
await InvestmentPlan.updateOne({ amount: 80 }, { $set: { amount: 80, dailyEarning: 1.8 } }, { upsert: true });
await InvestmentPlan.updateOne({ amount: 100 }, { $set: { amount: 100, dailyEarning: 2.4 } }, { upsert: true });
await InvestmentPlan.updateOne({ amount: 200 }, { $set: { amount: 200, dailyEarning: 5.5 } }, { upsert: true });

startEarningsScheduler();

let server;
let attempts = 0;

function startListening() {
  attempts += 1;
  server = app.listen(port, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`Earnify API listening on :${port}`);
  });

  server.on('error', (err) => {
    if (err?.code === 'EADDRINUSE' && attempts <= 10) {
      // eslint-disable-next-line no-console
      console.warn(`Port ${port} in use, retrying... (${attempts}/10)`);
      setTimeout(startListening, 500);
      return;
    }

    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}

function shutdown() {
  if (server) {
    server.close(() => process.exit(0));
    return;
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startListening();
