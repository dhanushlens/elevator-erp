import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import AuditLog from '../models/AuditLog.js';
import Settings from '../models/Settings.js';
import * as factory from './factory.js';

export const getUsers = factory.getAll(User, { searchFields: ['name', 'email'] });
export const getUser = factory.getOne(User);
export const deleteUser = factory.deleteOne(User, 'user');

export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, technician } = req.body;
    const existing = await User.findOne({ email: (email || '').toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A user with this email already exists' });
    }
    const user = await User.create({ name, email, password, role, phone, technician });
    user.password = undefined;
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { password, ...rest } = req.body;
    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'Not found' });
    Object.assign(user, rest);
    if (password) user.password = password;
    await user.save();
    user.password = undefined;
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const getActivityLogs = factory.getAll(ActivityLog, {
  populate: [{ path: 'user', select: 'name role' }],
});

export const getAuditLogs = factory.getAll(AuditLog, {
  populate: [{ path: 'user', select: 'name role' }],
});

export const getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSingleton();
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSingleton();
    Object.assign(settings, req.body);
    await settings.save();
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};
