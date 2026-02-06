import mongoose from 'mongoose';

const InvestmentPlanSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, unique: true, index: true },
    dailyEarning: { type: Number, required: true },
  },
  { timestamps: true }
);

InvestmentPlanSchema.virtual('hourlyEarning').get(function hourlyEarning() {
  return this.dailyEarning / 24;
});

export const InvestmentPlan = mongoose.model('InvestmentPlan', InvestmentPlanSchema);
