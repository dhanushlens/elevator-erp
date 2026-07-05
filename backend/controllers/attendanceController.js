import Attendance from '../models/Attendance.js';
import * as factory from './factory.js';
import { logActivity } from '../middleware/audit.js';

const populate = [{ path: 'technician', select: 'name photo mobile' }];

export const getAttendance = factory.getAll(Attendance, { populate });
export const getAttendanceRecord = factory.getOne(Attendance, { populate });
export const updateAttendance = factory.updateOne(Attendance, 'attendance');
export const deleteAttendance = factory.deleteOne(Attendance, 'attendance');

export const markAttendance = async (req, res, next) => {
  try {
    const { technician, date, status, checkIn, checkOut, notes } = req.body;
    const day = new Date(date);
    const normalized = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const record = await Attendance.findOneAndUpdate(
      { technician, date: normalized },
      { status, checkIn, checkOut, notes, markedBy: req.user._id },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    logActivity(req.user._id, 'mark', 'attendance', record._id, `Marked ${status}`, req.ip);
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

export const getMonthlyAttendance = async (req, res, next) => {
  try {
    const { technician, month, year } = req.query;
    const y = parseInt(year, 10) || new Date().getFullYear();
    const m = parseInt(month, 10) || new Date().getMonth() + 1;
    const from = new Date(y, m - 1, 1);
    const to = new Date(y, m, 0, 23, 59, 59, 999);
    const filter = { date: { $gte: from, $lte: to } };
    if (technician) filter.technician = technician;
    const records = await Attendance.find(filter).populate('technician', 'name photo').sort('date');
    res.json({ success: true, results: records.length, data: records });
  } catch (err) {
    next(err);
  }
};
