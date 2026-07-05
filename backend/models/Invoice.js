import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    items: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        rate: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
      },
    ],
    subtotal: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 18 },
    taxAmount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'sent', 'unpaid', 'partial', 'paid', 'overdue', 'cancelled'], default: 'unpaid' },
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date },
    notes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

invoiceSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const count = await this.constructor.countDocuments();
    this.invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
  }
  this.items.forEach((item) => (item.amount = item.quantity * item.rate));
  this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0);
  this.taxAmount = ((this.subtotal - this.discount) * this.taxPercent) / 100;
  this.total = this.subtotal - this.discount + this.taxAmount;
  if (this.amountPaid >= this.total && this.total > 0) this.status = 'paid';
  else if (this.amountPaid > 0) this.status = 'partial';
  next();
});

export default mongoose.model('Invoice', invoiceSchema);
