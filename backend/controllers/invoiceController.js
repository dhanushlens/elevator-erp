import Invoice from '../models/Invoice.js';
import * as factory from './factory.js';
import { logActivity } from '../middleware/audit.js';

const populate = [
  { path: 'customer', select: 'name phone email address city gst' },
  { path: 'company', select: 'name gst' },
  { path: 'service', select: 'serviceNumber serviceType visitDate' },
];

export const getInvoices = factory.getAll(Invoice, {
  searchFields: ['invoiceNumber'],
  populate,
});
export const getInvoice = factory.getOne(Invoice, { populate });
export const createInvoice = factory.createOne(Invoice, 'invoice');
export const deleteInvoice = factory.deleteOne(Invoice, 'invoice');

export const updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Not found' });
    Object.assign(invoice, req.body);
    await invoice.save();
    logActivity(req.user._id, 'update', 'invoice', invoice._id, `Updated invoice ${invoice.invoiceNumber}`, req.ip);
    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
};

export const recordPayment = async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'A positive payment amount is required' });
    }
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Not found' });
    invoice.amountPaid += amount;
    await invoice.save();
    logActivity(req.user._id, 'payment', 'invoice', invoice._id, `Payment of ${amount} recorded on ${invoice.invoiceNumber}`, req.ip);
    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
};
