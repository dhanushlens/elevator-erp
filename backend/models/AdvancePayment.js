import mongoose from 'mongoose';

const advancePaymentSchema = new mongoose.Schema(
  {
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', required: true },
    amount: { type: Number, required: true, min: 1 },
    date: { type: Date, default: Date.now },
    reason: { type: String },
    status: { type: String, enum: ['outstanding', 'settled'], default: 'outstanding' },
    settledInSalary: { type: mongoose.Schema.Types.ObjectId, ref: 'Salary' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('AdvancePayment', advancePaymentSchema);
