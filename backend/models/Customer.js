import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Customer name is required'], trim: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    phone: { type: String, required: [true, 'Phone is required'], trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    gst: { type: String, trim: true, uppercase: true },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

customerSchema.index({ name: 'text', phone: 'text', email: 'text', city: 'text' });

export default mongoose.model('Customer', customerSchema);
