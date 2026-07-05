import Customer from '../models/Customer.js';
import Elevator from '../models/Elevator.js';
import Service from '../models/Service.js';
import Invoice from '../models/Invoice.js';
import * as factory from './factory.js';

const populate = [{ path: 'company', select: 'name city' }];

export const getCustomers = factory.getAll(Customer, {
  searchFields: ['name', 'phone', 'email', 'city', 'gst'],
  populate,
});
export const getCustomer = factory.getOne(Customer, { populate });
export const createCustomer = factory.createOne(Customer, 'customer');
export const updateCustomer = factory.updateOne(Customer, 'customer');
export const deleteCustomer = factory.deleteOne(Customer, 'customer');

export const getCustomerOverview = async (req, res, next) => {
  try {
    const customerId = req.params.id;
    const customer = await Customer.findById(customerId).populate('company', 'name city');
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const now = new Date();
    const [elevators, services, invoices, upcomingServices] = await Promise.all([
      Elevator.find({ customer: customerId }).populate('assignedTechnician', 'name'),
      Service.find({ customer: customerId })
        .sort('-visitDate')
        .populate('technician', 'name')
        .populate('elevator', 'code building'),
      Invoice.find({ customer: customerId }).sort('-issueDate'),
      Service.find({ customer: customerId, visitDate: { $gte: now }, status: { $in: ['scheduled', 'pending'] } })
        .sort('visitDate')
        .populate('elevator', 'code building'),
    ]);

    const pendingPayments = invoices
      .filter((i) => ['unpaid', 'partial', 'overdue', 'sent'].includes(i.status))
      .reduce((sum, i) => sum + (i.total - i.amountPaid), 0);

    const amc = elevators.map((e) => ({ elevator: e.code, building: e.building, amcExpiry: e.amcExpiry, active: e.amcExpiry ? e.amcExpiry > now : false }));
    const warranty = elevators.map((e) => ({ elevator: e.code, building: e.building, warrantyExpiry: e.warrantyExpiry, active: e.warrantyExpiry ? e.warrantyExpiry > now : false }));

    const visitTimeline = services.map((s) => ({
      _id: s._id,
      date: s.visitDate,
      time: s.visitTime,
      type: s.serviceType,
      status: s.status,
      complaint: s.complaint,
      workDone: s.workDone,
      technician: s.technician?.name,
      elevator: s.elevator?.code,
      cost: s.cost,
    }));

    res.json({
      success: true,
      data: { customer, elevators, services, invoices, amc, warranty, pendingPayments, upcomingServices, visitTimeline },
    });
  } catch (err) {
    next(err);
  }
};
