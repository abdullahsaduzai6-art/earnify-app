import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['deposit', 'withdraw'], required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    network: { type: String, enum: ['TRC20', 'BEP20'], required: true },
    walletAddress: { type: String, required: true },
    txid: { type: String },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending', index: true },
  },
  { timestamps: true }
);

export const Transaction = mongoose.model('Transaction', TransactionSchema);
