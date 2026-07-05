import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String },
    type: {
      type: String,
      enum: ['upcoming-service', 'amc-expiry', 'warranty-expiry', 'salary-due', 'pending-payment', 'technician-assignment', 'system'],
      default: 'system',
    },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    link: { type: String },
    entity: { type: String },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
