import express from 'express';
import * as company from '../controllers/companyController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { auditTrail } from '../middleware/audit.js';

const router = express.Router();
router.use(protect, auditTrail);

router.route('/').get(company.getCompanies).post(restrictTo('admin', 'employee'), company.createCompany);
router.get('/:id/history', company.getCompanyHistory);
router
  .route('/:id')
  .get(company.getCompany)
  .patch(restrictTo('admin', 'employee'), company.updateCompany)
  .delete(restrictTo('admin'), company.deleteCompany);

export default router;
