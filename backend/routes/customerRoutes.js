import express from 'express';
import * as customer from '../controllers/customerController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { auditTrail } from '../middleware/audit.js';

const router = express.Router();
router.use(protect, auditTrail);

router.route('/').get(customer.getCustomers).post(restrictTo('admin', 'employee'), customer.createCustomer);
router.get('/:id/overview', customer.getCustomerOverview);
router
  .route('/:id')
  .get(customer.getCustomer)
  .patch(restrictTo('admin', 'employee'), customer.updateCustomer)
  .delete(restrictTo('admin'), customer.deleteCustomer);

export default router;
