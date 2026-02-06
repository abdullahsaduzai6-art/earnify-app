import cron from 'node-cron';
import { User } from '../models/User.js';

export function startEarningsScheduler() {
  // Every hour on the hour
  cron.schedule('0 * * * *', async () => {
    const now = new Date();

    const users = await User.find({ 'investments.0': { $exists: true } });

    for (const user of users) {
      let delta = 0;
      for (const inv of user.investments) {
        if (!inv.active) continue;

        const hours = Math.floor((now.getTime() - new Date(inv.lastAccruedAt).getTime()) / (60 * 60 * 1000));
        if (hours <= 0) continue;

        const hourly = inv.dailyEarning / 24;
        delta += hours * hourly;
        inv.lastAccruedAt = new Date(inv.lastAccruedAt.getTime() + hours * 60 * 60 * 1000);
      }

      if (delta > 0) {
        user.balance += Number(delta.toFixed(8));
        await user.save();
      }
    }
  });
}
