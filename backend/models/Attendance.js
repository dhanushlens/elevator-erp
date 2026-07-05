import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['present', 'absent', 'half-day', 'leave', 'holiday'],
      default: 'present',
    },
    checkIn: { type: String },
    checkOut: { type: String },
    notes: { type: String },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

attendanceSchema.index({ technician: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
