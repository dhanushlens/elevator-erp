import Customer from '../models/Customer.js';
import Company from '../models/Company.js';
import Elevator from '../models/Elevator.js';
import Technician from '../models/Technician.js';
import Service from '../models/Service.js';
import Salary from '../models/Salary.js';
import Attendance from '../models/Attendance.js';
import Invoice from '../models/Invoice.js';
import Report from '../models/Report.js';
import { resolveDateRange } from '../utils/dateRange.js';

const REPORT_BUILDERS = {
  customers: async ({ from, to }) =>
    Customer.find({ createdAt: { $gte: from, $lte: to } }).populate('company', 'name').lean(),
  companies: async ({ from, to }) =>
    Company.find({ createdAt: { $gte: from, $lte: to } }).lean(),
  elevators: async ({ from, to }) =>
    Elevator.find({ createdAt: { $gte: from, $lte: to } })
      .populate('customer', 'name')
      .populate('company', 'name')
      .populate('assignedTechnician', 'name')
      .lean(),
  services: async ({ from, to }) =>
    Service.find({ visitDate: { $gte: from, $lte: to } })
      .populate('customer', 'name')
      .populate('company', 'name')
      .populate('elevator', 'code building')
      .populate('technician', 'name')
      .lean(),
  technicians: async ({ from, to }) => {
    const technicians = await Technician.find().lean();
    const services = await Service.aggregate([
      { $match: { visitDate: { $gte: from, $lte: to }, technician: { $ne: null } } },
      { $group: { _id: '$technician', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }, revenue: { $sum: '$cost' } } },
    ]);
    const map = new Map(services.map((s) => [String(s._id), s]));
    return technicians.map((t) => ({ ...t, stats: map.get(String(t._id)) || { total: 0, completed: 0, revenue: 0 } }));
  },
  salary: async ({ from, to }) =>
    Salary.find({ createdAt: { $gte: from, $lte: to } }).populate('technician', 'name mobile').lean(),
  attendance: async ({ from, to }) =>
    Attendance.find({ date: { $gte: from, $lte: to } }).populate('technician', 'name').lean(),
  payments: async ({ from, to }) =>
    Invoice.find({ issueDate: { $gte: from, $lte: to }, amountPaid: { $gt: 0 } })
      .populate('customer', 'name')
      .lean(),
  revenue: async ({ from, to }) =>
    Invoice.aggregate([
      { $match: { issueDate: { $gte: from, $lte: to }, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: { year: { $year: '$issueDate' }, month: { $month: '$issueDate' } },
          billed: { $sum: '$total' },
          collected: { $sum: '$amountPaid' },
          invoices: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  amc: async ({ from, to }) =>
    Elevator.find({ amcExpiry: { $gte: from, $lte: to } })
      .populate('customer', 'name phone')
      .populate('company', 'name')
      .select('code building amcExpiry status customer company')
      .lean(),
  warranty: async ({ from, to }) =>
    Elevator.find({ warrantyExpiry: { $gte: from, $lte: to } })
      .populate('customer', 'name phone')
      .populate('company', 'name')
      .select('code building warrantyExpiry status customer company')
      .lean(),
};

export const generateReport = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { range = 'this-month', from, to, save } = req.query;
    const builder = REPORT_BUILDERS[type];
    if (!builder) {
      return res.status(400).json({ success: false, message: `Unknown report type: ${type}` });
    }
    const dateRange = resolveDateRange(range, from, to);
    const data = await builder(dateRange);

    if (save === 'true') {
      await Report.create({
        title: `${type} report (${range})`,
        type,
        dateRange: { ...dateRange, label: range },
        data: { count: Array.isArray(data) ? data.length : 0 },
        generatedBy: req.user._id,
      });
    }

    res.json({
      success: true,
      results: Array.isArray(data) ? data.length : undefined,
      dateRange: { ...dateRange, label: range },
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const listSavedReports = async (req, res, next) => {
  try {
    const reports = await Report.find().sort('-createdAt').limit(100).populate('generatedBy', 'name');
    res.json({ success: true, results: reports.length, data: reports });
  } catch (err) {
    next(err);
  }
};
