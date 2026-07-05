import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ['customers', 'companies', 'elevators', 'services', 'technicians', 'salary', 'attendance', 'payments', 'revenue', 'amc', 'warranty'],
      required: true,
    },
    dateRange: {
      from: { type: Date },
      to: { type: Date },
      label: { type: String },
    },
    filters: { type: mongoose.Schema.Types.Mixed },
    data: { type: mongoose.Schema.Types.Mixed },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Report', reportSchema);
