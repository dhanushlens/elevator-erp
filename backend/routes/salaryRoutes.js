import express from 'express';
import * as salary from '../controllers/salaryController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { auditTrail } from '../middleware/audit.js';

const router = express.Router();
router.use(protect, auditTrail);

router
  .route('/advances')
  .get(salary.getAdvances)
  .post(restrictTo('admin'), salary.createAdvance);
router
  .route('/advances/:id')
  .patch(restrictTo('admin'), salary.updateAdvance)
  .delete(restrictTo('admin'), salary.deleteAdvance);
router.post('/notify-due', restrictTo('admin'), salary.notifySalaryDue);
router.route('/').get(salary.getSalaries).post(restrictTo('admin'), salary.createSalary);
router.get('/:id/slip', salary.getSalarySlip);
router
  .route('/:id')
  .get(salary.getSalary)
  .patch(restrictTo('admin'), salary.updateSalary)
  .delete(restrictTo('admin'), salary.deleteSalary);

export default router;
