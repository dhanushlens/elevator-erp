import Elevator from '../models/Elevator.js';
import Service from '../models/Service.js';
import * as factory from './factory.js';

const populate = [
  { path: 'customer', select: 'name phone' },
  { path: 'company', select: 'name' },
  { path: 'assignedTechnician', select: 'name mobile photo' },
];

export const getElevators = factory.getAll(Elevator, {
  searchFields: ['code', 'building', 'address', 'capacity'],
  populate,
});
export const getElevator = factory.getOne(Elevator, { populate });
export const createElevator = factory.createOne(Elevator, 'elevator');
export const updateElevator = factory.updateOne(Elevator, 'elevator');
export const deleteElevator = factory.deleteOne(Elevator, 'elevator');

export const getElevatorServiceHistory = async (req, res, next) => {
  try {
    const services = await Service.find({ elevator: req.params.id })
      .sort('-visitDate')
      .populate('technician', 'name photo')
      .populate('customer', 'name');
    res.json({ success: true, results: services.length, data: services });
  } catch (err) {
    next(err);
  }
};

export const getExpiring = async (req, res, next) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 30, 365);
    const now = new Date();
    const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const [amc, warranty] = await Promise.all([
      Elevator.find({ amcExpiry: { $gte: now, $lte: until } }).populate('customer', 'name phone').populate('company', 'name'),
      Elevator.find({ warrantyExpiry: { $gte: now, $lte: until } }).populate('customer', 'name phone').populate('company', 'name'),
    ]);
    res.json({ success: true, data: { amc, warranty } });
  } catch (err) {
    next(err);
  }
};
