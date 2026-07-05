import mongoose from 'mongoose';

const elevatorSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    building: { type: String, trim: true },
    address: { type: String, trim: true },
    elevatorType: {
      type: String,
      enum: ['passenger', 'freight', 'hospital', 'home', 'hydraulic', 'traction', 'mrl', 'dumbwaiter'],
      default: 'passenger',
    },
    capacity: { type: String, trim: true },
    floors: { type: Number, min: 1 },
    installationDate: { type: Date },
    warrantyExpiry: { type: Date },
    amcExpiry: { type: Date },
    lastService: { type: Date },
    nextService: { type: Date },
    assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician' },
    status: {
      type: String,
      enum: ['operational', 'under-maintenance', 'breakdown', 'decommissioned'],
      default: 'operational',
    },
    photos: [{ type: String }],
    documents: [{ name: String, url: String }],
    qrCode: { type: String },
    barcode: { type: String },
    notes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

elevatorSchema.pre('save', async function (next) {
  if (!this.code) {
    const count = await this.constructor.countDocuments();
    this.code = `ELV-${String(count + 1).padStart(5, '0')}`;
  }
  if (!this.qrCode) this.qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${this.code}`;
  if (!this.barcode) this.barcode = this.code;
  next();
});

elevatorSchema.index({ code: 'text', building: 'text', address: 'text' });

export default mongoose.model('Elevator', elevatorSchema);
