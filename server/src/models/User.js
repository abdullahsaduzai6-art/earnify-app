import mongoose from 'mongoose';

const UserInvestmentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'InvestmentPlan', required: true },
    startDate: { type: Date, required: true },
    dailyEarning: { type: Number, required: true },
    lastAccruedAt: { type: Date, required: true },
    active: { type: Boolean, default: true },
  },
  { _id: false }
);

const WalletAddressesSchema = new mongoose.Schema(
  {
    TRC20: { type: String, default: '' },
    BEP20: { type: String, default: '' },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    phone: { type: String, default: '' },
    hashedPassword: { type: String, required: true },
    walletAddresses: { type: WalletAddressesSchema, default: () => ({}) },
    investments: { type: [UserInvestmentSchema], default: [] },
    balance: { type: Number, default: 0 },
    referralCode: { type: String, required: true, unique: true, index: true },
    referredUsers: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', UserSchema);
