import Customer from '../models/Customer.js';
import Company from '../models/Company.js';
import Elevator from '../models/Elevator.js';
import Technician from '../models/Technician.js';
import Service from '../models/Service.js';
import Salary from '../models/Salary.js';
import Invoice from '../models/Invoice.js';
import ActivityLog from '../models/ActivityLog.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [
      totalCustomers,
      totalCompanies,
      totalElevators,
      todaysServices,
      upcomingServices,
      completedServices,
      pendingServices,
      techniciansWorking,
      revenueAgg,
      pendingPaymentsAgg,
      salaryDueAgg,
      warrantyExpiring,
      amcExpiring,
      recentActivities,
      monthlyRevenue,
      monthlyServices,
    ] = await Promise.all([
      Customer.countDocuments({ isActive: true }),
      Company.countDocuments({ isActive: true }),
      Elevator.countDocuments(),
      Service.countDocuments({ visitDate: { $gte: todayStart, $lte: todayEnd } }),
      Service.countDocuments({ visitDate: { $gt: todayEnd }, status: { $in: ['scheduled', 'pending'] } }),
      Service.countDocuments({ status: 'completed' }),
      Service.countDocuments({ status: { $in: ['pending', 'scheduled', 'in-progress'] } }),
      Service.distinct('technician', { status: 'in-progress' }).then((t) => t.filter(Boolean).length),
      Invoice.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } },
      ]),
      Invoice.aggregate([
        { $match: { status: { $in: ['unpaid', 'partial', 'overdue', 'sent'] } } },
        { $group: { _id: null, total: { $sum: { $subtract: ['$total', '$amountPaid'] } } } },
      ]),
      Salary.aggregate([
        { $match: { status: { $in: ['pending', 'partial'] } } },
        { $group: { _id: null, total: { $sum: { $subtract: ['$netPayable', '$amountPaid'] } } } },
      ]),
      Elevator.countDocuments({ warrantyExpiry: { $gte: now, $lte: in30Days } }),
      Elevator.countDocuments({ amcExpiry: { $gte: now, $lte: in30Days } }),
      ActivityLog.find().sort('-createdAt').limit(10).populate('user', 'name role'),
      Invoice.aggregate([
        { $match: { issueDate: { $gte: yearStart }, status: { $ne: 'cancelled' } } },
        { $group: { _id: { $month: '$issueDate' }, revenue: { $sum: '$amountPaid' }, billed: { $sum: '$total' } } },
        { $sort: { _id: 1 } },
      ]),
      Service.aggregate([
        { $match: { visitDate: { $gte: yearStart } } },
        {
          $group: {
            _id: { month: { $month: '$visitDate' }, status: '$status' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.month': 1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totals: {
          customers: totalCustomers,
          companies: totalCompanies,
          elevators: totalElevators,
          todaysServices,
          upcomingServices,
          completedServices,
          pendingServices,
          techniciansWorking,
          revenue: revenueAgg[0]?.total || 0,
          pendingPayments: pendingPaymentsAgg[0]?.total || 0,
          salaryDue: salaryDueAgg[0]?.total || 0,
          warrantyExpiring,
          amcExpiring,
        },
        charts: { monthlyRevenue, monthlyServices },
        recentActivities,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const [
      customerGrowth,
      companyGrowth,
      technicianPerformance,
      complaintTypes,
      serviceTypes,
      salaryExpenses,
      amcRevenue,
    ] = await Promise.all([
      Customer.aggregate([
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 24 },
      ]),
      Company.aggregate([
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 24 },
      ]),
      Service.aggregate([
        { $match: { status: 'completed', technician: { $ne: null } } },
        { $group: { _id: '$technician', completed: { $sum: 1 }, revenue: { $sum: '$cost' }, avgDuration: { $avg: '$durationMinutes' } } },
        { $sort: { completed: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'technicians', localField: '_id', foreignField: '_id', as: 'technician' } },
        { $unwind: '$technician' },
        { $project: { completed: 1, revenue: 1, avgDuration: 1, 'technician.name': 1, 'technician.performanceRating': 1 } },
      ]),
      Service.aggregate([
        { $match: { complaint: { $nin: [null, ''] } } },
        { $group: { _id: '$serviceType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Service.aggregate([
        { $group: { _id: '$serviceType', count: { $sum: 1 }, revenue: { $sum: '$cost' } } },
        { $sort: { count: -1 } },
      ]),
      Salary.aggregate([
        { $group: { _id: { year: '$year', month: '$month' }, total: { $sum: '$amountPaid' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 24 },
      ]),
      Service.aggregate([
        { $match: { serviceType: 'amc-visit', visitDate: { $gte: yearStart } } },
        { $group: { _id: { $month: '$visitDate' }, revenue: { $sum: '$cost' }, visits: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: { customerGrowth, companyGrowth, technicianPerformance, complaintTypes, serviceTypes, salaryExpenses, amcRevenue },
    });
  } catch (err) {
    next(err);
  }
};

export const globalSearch = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ success: true, data: {} });
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const limit = 5;

    const [customers, companies, elevators, technicians, invoices, services] = await Promise.all([
      Customer.find({ $or: [{ name: regex }, { phone: regex }, { email: regex }, { city: regex }] }).limit(limit).select('name phone email city'),
      Company.find({ $or: [{ name: regex }, { city: regex }, { email: regex }] }).limit(limit).select('name city email'),
      Elevator.find({ $or: [{ code: regex }, { building: regex }, { address: regex }] }).limit(limit).select('code building address status'),
      Technician.find({ $or: [{ name: regex }, { mobile: regex }, { email: regex }] }).limit(limit).select('name mobile email'),
      Invoice.find({ invoiceNumber: regex }).limit(limit).select('invoiceNumber total status issueDate').populate('customer', 'name'),
      Service.find({ $or: [{ serviceNumber: regex }, { complaint: regex }, { workDone: regex }] }).limit(limit).select('serviceNumber complaint status visitDate').populate('customer', 'name'),
    ]);

    res.json({ success: true, data: { customers, companies, elevators, technicians, invoices, services } });
  } catch (err) {
    next(err);
  }
};
