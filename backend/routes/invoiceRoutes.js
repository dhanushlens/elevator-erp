import express from 'express';
import * as invoice from '../controllers/invoiceController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { auditTrail } from '../middleware/audit.js';

const router = express.Router();
router.use(protect, auditTrail);

router.route('/').get(invoice.getInvoices).post(restrictTo('admin', 'employee'), invoice.createInvoice);
router.post('/:id/payment', restrictTo('admin', 'employee'), invoice.recordPayment);
router
  .route('/:id')
  .get(invoice.getInvoice)
  .patch(restrictTo('admin', 'employee'), invoice.updateInvoice)
  .delete(restrictTo('admin'), invoice.deleteInvoice);

export default router;
