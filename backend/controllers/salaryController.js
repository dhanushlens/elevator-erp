import Salary from '../models/Salary.js';
import AdvancePayment from '../models/AdvancePayment.js';
import Technician from '../models/Technician.js';
import Notification from '../models/Notification.js';
import * as factory from './factory.js';
import { logActivity } from '../middleware/audit.js';

const populate = [{ path: 'technician', select: 'name mobile photo monthlySalary' }];

export const getSalaries = factory.getAll(Salary, { populate });
export const getSalary = factory.getOne(Salary, { populate });
export const deleteSalary = factory.deleteOne(Salary, 'salary');

export const createSalary = async (req, res, next) => {
  try {
    const { technician: technicianId, month, year, settleAdvances } = req.body;
    const technician = await Technician.findById(technicianId);
    if (!technician) return res.status(404).json({ success: false, message: 'Technician not found' });

    let advanceDeducted = req.body.advanceDeducted || 0;
    let outstandingAdvances = [];
    if (settleAdvances) {
      outstandingAdvances = await AdvancePayment.find({ technician: technicianId, status: 'outstanding' });
      advanceDeducted = outstandingAdvances.reduce((s, a) => s + a.amount, 0);
    }

    const salary = await Salary.create({
      technician: technicianId,
      month,
      year,
      baseSalary: req.body.baseSalary ?? technician.monthlySalary,
      bonus: req.body.bonus || 0,
      deductions: req.body.deductions || 0,
      advanceDeducted,
      amountPaid: req.body.amountPaid || 0,
      paidDate: req.body.paidDate,
      paymentMethod: req.body.paymentMethod,
      remarks: req.body.remarks,
      createdBy: req.user._id,
    });

    if (settleAdvances && outstandingAdvances.length) {
      await AdvancePayment.updateMany(
        { _id: { $in: outstandingAdvances.map((a) => a._id) } },
        { status: 'settled', settledInSalary: salary._id }
      );
    }

    logActivity(req.user._id, 'create', 'salary', salary._id, `Salary record for ${technician.name} (${month}/${year})`, req.ip);
    res.status(201).json({ success: true, data: salary });
  } catch (err) {
    next(err);
  }
};

export const updateSalary = async (req, res, next) => {
  try {
    const salary = await Salary.findById(req.params.id);
    if (!salary) return res.status(404).json({ success: false, message: 'Not found' });
    Object.assign(salary, req.body);
    await salary.save();
    logActivity(req.user._id, 'update', 'salary', salary._id, 'Updated salary record', req.ip);
    res.json({ success: true, data: salary });
  } catch (err) {
    next(err);
  }
};

export const getSalarySlip = async (req, res, next) => {
  try {
    const salary = await Salary.findById(req.params.id).populate('technician');
    if (!salary) return res.status(404).json({ success: false, message: 'Not found' });
    const advances = await AdvancePayment.find({ settledInSalary: salary._id });
    res.json({ success: true, data: { salary, settledAdvances: advances } });
  } catch (err) {
    next(err);
  }
};

export const getAdvances = factory.getAll(AdvancePayment, {
  populate: [{ path: 'technician', select: 'name mobile photo' }],
});

export const createAdvance = async (req, res, next) => {
  try {
    req.body.approvedBy = req.user._id;
    const advance = await AdvancePayment.create(req.body);
    logActivity(req.user._id, 'create', 'advance', advance._id, `Advance of ${advance.amount} recorded`, req.ip);
    res.status(201).json({ success: true, data: advance });
  } catch (err) {
    next(err);
  }
};

export const updateAdvance = factory.updateOne(AdvancePayment, 'advance');
export const deleteAdvance = factory.deleteOne(AdvancePayment, 'advance');

export const notifySalaryDue = async (req, res, next) => {
  try {
    const due = await Salary.find({ status: { $in: ['pending', 'partial'] } }).populate('technician', 'name');
    await Promise.all(
      due.map((s) =>
        Notification.create({
          title: 'Salary due',
          message: `Salary due for ${s.technician?.name} (${s.month}/${s.year})`,
          type: 'salary-due',
          severity: 'warning',
          entity: 'salary',
          entityId: s._id,
          link: `/salary`,
        })
      )
    );
    res.json({ success: true, results: due.length });
  } catch (err) {
    next(err);
  }
};
