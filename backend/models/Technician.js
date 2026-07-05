import mongoose from 'mongoose';

const technicianSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Technician name is required'], trim: true },
    photo: { type: String },
    mobile: { type: String, required: [true, 'Mobile is required'], trim: true },
    email: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
    address: { type: String, trim: true },
    joiningDate: { type: Date, default: Date.now },
    monthlySalary: { type: Number, default: 0, min: 0 },
    performanceRating: { type: Number, min: 0, max: 5, default: 0 },
    skills: [{ type: String }],
    isActive: { type: Boolean, default: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

technicianSchema.index({ name: 'text', mobile: 'text', email: 'text' });

export default mongoose.model('Technician', technicianSchema);
