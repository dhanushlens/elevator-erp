import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    serviceNumber: { type: String, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    elevator: { type: mongoose.Schema.Types.ObjectId, ref: 'Elevator', required: true },
    complaint: { type: String, trim: true },
    serviceType: {
      type: String,
      enum: ['maintenance', 'repair', 'installation', 'inspection', 'breakdown', 'amc-visit', 'modernization'],
      default: 'maintenance',
    },
    visitDate: { type: Date, required: true },
    visitTime: { type: String },
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician' },
    workDone: { type: String },
    partsUsed: [
      {
        name: { type: String, trim: true },
        quantity: { type: Number, default: 1 },
        cost: { type: Number, default: 0 },
      },
    ],
    beforePhotos: [{ type: String }],
    afterPhotos: [{ type: String }],
    customerSignature: { type: String },
    remarks: { type: String },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'pending', 'cancelled'],
      default: 'scheduled',
    },
    durationMinutes: { type: Number, min: 0 },
    cost: { type: Number, default: 0, min: 0 },
    paymentStatus: { type: String, enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' },
    nextVisit: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

serviceSchema.pre('save', async function (next) {
  if (!this.serviceNumber) {
    const count = await this.constructor.countDocuments();
    this.serviceNumber = `SRV-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

serviceSchema.index({ serviceNumber: 'text', complaint: 'text', workDone: 'text' });

export default mongoose.model('Service', serviceSchema);
