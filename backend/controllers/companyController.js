import Company from '../models/Company.js';
import Customer from '../models/Customer.js';
import Elevator from '../models/Elevator.js';
import Service from '../models/Service.js';
import Invoice from '../models/Invoice.js';
import * as factory from './factory.js';

export const getCompanies = factory.getAll(Company, {
  searchFields: ['name', 'city', 'email', 'gst'],
});
export const getCompany = factory.getOne(Company);
export const createCompany = factory.createOne(Company, 'company');
export const updateCompany = factory.updateOne(Company, 'company');
export const deleteCompany = factory.deleteOne(Company, 'company');

export const getCompanyHistory = async (req, res, next) => {
  try {
    const companyId = req.params.id;
    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    const now = new Date();
    const [customers, elevators, visits, revenueAgg] = await Promise.all([
      Customer.find({ company: companyId }).select('name phone email city'),
      Elevator.find({ company: companyId }).populate('assignedTechnician', 'name'),
      Service.find({ company: companyId })
        .sort('-visitDate')
        .populate('technician', 'name photo')
        .populate('elevator', 'code building')
        .populate('customer', 'name'),
      Invoice.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $lookup: { from: 'customers', localField: 'customer', foreignField: '_id', as: 'cust' } },
        { $unwind: '$cust' },
        { $match: { 'cust.company': company._id } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } },
      ]),
    ]);

    const pendingServices = visits.filter((v) => ['pending', 'scheduled', 'in-progress'].includes(v.status));
    const amcActive = elevators.filter((e) => e.amcExpiry && e.amcExpiry > now).length;
    const warrantyActive = elevators.filter((e) => e.warrantyExpiry && e.warrantyExpiry > now).length;

    const visitHistory = visits.map((v) => ({
      _id: v._id,
      serviceNumber: v.serviceNumber,
      date: v.visitDate,
      time: v.visitTime,
      reason: v.serviceType,
      complaint: v.complaint,
      technician: v.technician ? { name: v.technician.name, photo: v.technician.photo } : null,
      partsReplaced: v.partsUsed,
      workDone: v.workDone,
      photos: [...(v.beforePhotos || []), ...(v.afterPhotos || [])],
      serviceCost: v.cost,
      customerSignature: v.customerSignature,
      remarks: v.remarks,
      status: v.status,
      durationMinutes: v.durationMinutes,
      elevator: v.elevator?.code,
      customer: v.customer?.name,
    }));

    res.json({
      success: true,
      data: {
        company,
        customers,
        elevators,
        totals: {
          customers: customers.length,
          elevators: elevators.length,
          visits: visits.length,
          revenue: revenueAgg[0]?.total || 0,
          pendingServices: pendingServices.length,
          amcActive,
          warrantyActive,
        },
        visitHistory,
      },
    });
  } catch (err) {
    next(err);
  }
};
