import mongoose from 'mongoose';

const serviceHistorySchema = new mongoose.Schema(
  {
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    elevator: { type: mongoose.Schema.Types.ObjectId, ref: 'Elevator' },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician' },
    action: { type: String, required: true },
    fromStatus: { type: String },
    toStatus: { type: String },
    notes: { type: String },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('ServiceHistory', serviceHistorySchema);
