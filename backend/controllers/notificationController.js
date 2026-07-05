import Notification from '../models/Notification.js';
import Elevator from '../models/Elevator.js';
import Service from '../models/Service.js';
import Salary from '../models/Salary.js';
import Invoice from '../models/Invoice.js';
import Settings from '../models/Settings.js';

export const getNotifications = async (req, res, next) => {
  try {
    const filter = { $or: [{ user: req.user._id }, { user: null }] };
    if (req.query.unread === 'true') filter.isRead = false;
    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter).sort('-createdAt').limit(limit),
      Notification.countDocuments({ ...filter, isRead: false }),
    ]);
    res.json({ success: true, results: notifications.length, unreadCount, data: notifications });
  } catch (err) {
    next(err);
  }
};

export const markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!notification) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: notification });
  } catch (err) {
    next(err);
  }
};

export const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ $or: [{ user: req.user._id }, { user: null }], isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

// Scans the database and generates automatic notifications for expiring AMC / warranty,
// upcoming services, salary dues and pending payments. Intended to be triggered on a
// schedule (cron) or manually from the admin UI.
export const generateAutomaticNotifications = async (req, res, next) => {
  try {
    const settings = await Settings.getSingleton();
    const now = new Date();
    const amcUntil = new Date(now.getTime() + settings.amcReminderDays * 24 * 60 * 60 * 1000);
    const warrantyUntil = new Date(now.getTime() + settings.warrantyReminderDays * 24 * 60 * 60 * 1000);
    const serviceUntil = new Date(now.getTime() + settings.serviceReminderDays * 24 * 60 * 60 * 1000);

    const [amcExpiring, warrantyExpiring, upcomingServices, salaryDue, pendingInvoices] = await Promise.all([
      Elevator.find({ amcExpiry: { $gte: now, $lte: amcUntil } }).populate('customer', 'name'),
      Elevator.find({ warrantyExpiry: { $gte: now, $lte: warrantyUntil } }).populate('customer', 'name'),
      Service.find({ visitDate: { $gte: now, $lte: serviceUntil }, status: { $in: ['scheduled', 'pending'] } }).populate('customer', 'name'),
      Salary.find({ status: { $in: ['pending', 'partial'] } }).populate('technician', 'name'),
      Invoice.find({ status: { $in: ['unpaid', 'partial', 'overdue'] } }).populate('customer', 'name'),
    ]);

    const created = [];
    const pushUnique = async (payload) => {
      const exists = await Notification.findOne({
        type: payload.type,
        entityId: payload.entityId,
        isRead: false,
      });
      if (!exists) {
        const n = await Notification.create(payload);
        created.push(n);
      }
    };

    for (const e of amcExpiring) {
      await pushUnique({
        title: 'AMC expiring soon',
        message: `AMC for elevator ${e.code} (${e.customer?.name || 'N/A'}) expires on ${e.amcExpiry.toDateString()}`,
        type: 'amc-expiry',
        severity: 'warning',
        entity: 'elevator',
        entityId: e._id,
        link: `/elevators/${e._id}`,
      });
    }
    for (const e of warrantyExpiring) {
      await pushUnique({
        title: 'Warranty expiring soon',
        message: `Warranty for elevator ${e.code} (${e.customer?.name || 'N/A'}) expires on ${e.warrantyExpiry.toDateString()}`,
        type: 'warranty-expiry',
        severity: 'warning',
        entity: 'elevator',
        entityId: e._id,
        link: `/elevators/${e._id}`,
      });
    }
    for (const s of upcomingServices) {
      await pushUnique({
        title: 'Upcoming service',
        message: `Service ${s.serviceNumber} for ${s.customer?.name || 'N/A'} on ${s.visitDate.toDateString()}`,
        type: 'upcoming-service',
        entity: 'service',
        entityId: s._id,
        link: `/services/${s._id}`,
      });
    }
    for (const s of salaryDue) {
      await pushUnique({
        title: 'Salary due',
        message: `Salary due for ${s.technician?.name || 'N/A'} (${s.month}/${s.year})`,
        type: 'salary-due',
        severity: 'warning',
        entity: 'salary',
        entityId: s._id,
        link: `/salary`,
      });
    }
    for (const i of pendingInvoices) {
      await pushUnique({
        title: 'Pending payment',
        message: `Invoice ${i.invoiceNumber} for ${i.customer?.name || 'N/A'} has a pending balance`,
        type: 'pending-payment',
        severity: 'critical',
        entity: 'invoice',
        entityId: i._id,
        link: `/invoices/${i._id}`,
      });
    }

    res.json({ success: true, created: created.length });
  } catch (err) {
    next(err);
  }
};
