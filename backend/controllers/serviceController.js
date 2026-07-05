import Service from '../models/Service.js';
import ServiceHistory from '../models/ServiceHistory.js';
import Elevator from '../models/Elevator.js';
import Notification from '../models/Notification.js';
import * as factory from './factory.js';
import { logActivity } from '../middleware/audit.js';

const populate = [
  { path: 'customer', select: 'name phone' },
  { path: 'company', select: 'name' },
  { path: 'elevator', select: 'code building' },
  { path: 'technician', select: 'name mobile photo' },
];

export const getServices = factory.getAll(Service, {
  searchFields: ['serviceNumber', 'complaint', 'workDone'],
  populate,
});
export const getService = factory.getOne(Service, { populate });
export const deleteService = factory.deleteOne(Service, 'service');

export const createService = async (req, res, next) => {
  try {
    req.body.createdBy = req.user._id;
    const service = await Service.create(req.body);
    await ServiceHistory.create({
      service: service._id,
      elevator: service.elevator,
      customer: service.customer,
      company: service.company,
      technician: service.technician,
      action: 'created',
      toStatus: service.status,
      performedBy: req.user._id,
    });
    if (service.technician) {
      await Notification.create({
        title: 'New service assigned',
        message: `Service ${service.serviceNumber} scheduled for ${new Date(service.visitDate).toDateString()}`,
        type: 'technician-assignment',
        entity: 'service',
        entityId: service._id,
        link: `/services/${service._id}`,
      });
    }
    logActivity(req.user._id, 'create', 'service', service._id, `Created service ${service.serviceNumber}`, req.ip);
    res.status(201).json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
};

export const updateService = async (req, res, next) => {
  try {
    const existing = await Service.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Not found' });

    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (req.body.status && req.body.status !== existing.status) {
      await ServiceHistory.create({
        service: service._id,
        elevator: service.elevator,
        customer: service.customer,
        company: service.company,
        technician: service.technician,
        action: 'status-changed',
        fromStatus: existing.status,
        toStatus: service.status,
        performedBy: req.user._id,
      });
      if (service.status === 'completed') {
        await Elevator.findByIdAndUpdate(service.elevator, {
          lastService: service.visitDate,
          ...(service.nextVisit ? { nextService: service.nextVisit } : {}),
        });
      }
    }
    logActivity(req.user._id, 'update', 'service', service._id, `Updated service ${service.serviceNumber}`, req.ip);
    res.json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
};

export const getServiceHistory = async (req, res, next) => {
  try {
    const history = await ServiceHistory.find({ service: req.params.id })
      .sort('-createdAt')
      .populate('performedBy', 'name role')
      .populate('technician', 'name');
    res.json({ success: true, results: history.length, data: history });
  } catch (err) {
    next(err);
  }
};

export const getCalendar = async (req, res, next) => {
  try {
    const { month, year, technician } = req.query;
    const y = parseInt(year, 10) || new Date().getFullYear();
    const m = parseInt(month, 10) || new Date().getMonth() + 1;
    const from = new Date(y, m - 1, 1);
    const to = new Date(y, m, 0, 23, 59, 59, 999);
    const filter = { visitDate: { $gte: from, $lte: to } };
    if (technician) filter.technician = technician;
    const services = await Service.find(filter)
      .sort('visitDate')
      .populate('customer', 'name')
      .populate('elevator', 'code building')
      .populate('technician', 'name');
    res.json({ success: true, results: services.length, data: services });
  } catch (err) {
    next(err);
  }
};
