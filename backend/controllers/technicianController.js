import Technician from '../models/Technician.js';
import Elevator from '../models/Elevator.js';
import Service from '../models/Service.js';
import Salary from '../models/Salary.js';
import Attendance from '../models/Attendance.js';
import AdvancePayment from '../models/AdvancePayment.js';
import * as factory from './factory.js';

export const getTechnicians = factory.getAll(Technician, {
  searchFields: ['name', 'mobile', 'email'],
});
export const getTechnician = factory.getOne(Technician);
export const createTechnician = factory.createOne(Technician, 'technician');
export const updateTechnician = factory.updateOne(Technician, 'technician');
export const deleteTechnician = factory.deleteOne(Technician, 'technician');

export const getTechnicianOverview = async (req, res, next) => {
  try {
    const technicianId = req.params.id;
    const technician = await Technician.findById(technicianId);
    if (!technician) return res.status(404).json({ success: false, message: 'Technician not found' });

    const now = new Date();
    const [assignedElevators, jobs, salaries, advances, attendance, monthlyPerformance] = await Promise.all([
      Elevator.find({ assignedTechnician: technicianId }).populate('customer', 'name'),
      Service.find({ technician: technicianId })
        .sort('-visitDate')
        .populate('customer', 'name')
        .populate('elevator', 'code building'),
      Salary.find({ technician: technicianId }).sort('-year -month'),
      AdvancePayment.find({ technician: technicianId }).sort('-date'),
      Attendance.find({ technician: technicianId }).sort('-date').limit(366),
      Service.aggregate([
        { $match: { technician: technician._id, status: 'completed' } },
        {
          $group: {
            _id: { year: { $year: '$visitDate' }, month: { $month: '$visitDate' } },
            completed: { $sum: 1 },
            revenue: { $sum: '$cost' },
            avgDuration: { $avg: '$durationMinutes' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 },
      ]),
    ]);

    const completedJobs = jobs.filter((j) => j.status === 'completed');
    const upcomingJobs = jobs.filter((j) => j.visitDate >= now && ['scheduled', 'pending'].includes(j.status));
    const assignedJobs = jobs.filter((j) => ['scheduled', 'pending', 'in-progress'].includes(j.status));

    const advanceOutstanding = advances.filter((a) => a.status === 'outstanding').reduce((s, a) => s + a.amount, 0);
    const salaryPaid = salaries.reduce((s, x) => s + x.amountPaid, 0);
    const pendingSalary = salaries.reduce((s, x) => s + Math.max(x.netPayable - x.amountPaid, 0), 0);

    res.json({
      success: true,
      data: {
        technician,
        salary: {
          monthly: technician.monthlySalary,
          advanceGiven: advanceOutstanding,
          pending: pendingSalary,
          paid: salaryPaid,
          history: salaries,
        },
        advances,
        attendance,
        assignedElevators,
        jobs: { assigned: assignedJobs, completed: completedJobs, upcoming: upcomingJobs },
        stats: {
          serviceCount: jobs.length,
          completedCount: completedJobs.length,
          performanceRating: technician.performanceRating,
        },
        monthlyPerformance,
      },
    });
  } catch (err) {
    next(err);
  }
};
