import mongoose from 'mongoose';

const salarySchema = new mongoose.Schema(
  {
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    baseSalary: { type: Number, required: true, min: 0 },
    bonus: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    advanceDeducted: { type: Number, default: 0 },
    netPayable: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending' },
    paidDate: { type: Date },
    paymentMethod: { type: String, enum: ['cash', 'bank-transfer', 'upi', 'cheque'], default: 'bank-transfer' },
    remarks: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

salarySchema.index({ technician: 1, month: 1, year: 1 }, { unique: true });

salarySchema.pre('save', function (next) {
  this.netPayable = this.baseSalary + this.bonus - this.deductions - this.advanceDeducted;
  if (this.amountPaid >= this.netPayable && this.netPayable > 0) this.status = 'paid';
  else if (this.amountPaid > 0) this.status = 'partial';
  next();
});

export default mongoose.model('Salary', salarySchema);
