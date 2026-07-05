import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Company name is required'], trim: true, unique: true },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    gst: { type: String, trim: true, uppercase: true },
    website: { type: String, trim: true },
    logo: { type: String },
    buildings: [
      {
        name: { type: String, trim: true },
        address: { type: String, trim: true },
        floors: { type: Number },
      },
    ],
    notes: { type: String },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

companySchema.index({ name: 'text', city: 'text', email: 'text' });

export default mongoose.model('Company', companySchema);
