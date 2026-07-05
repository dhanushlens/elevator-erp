import express from 'express';
import * as technician from '../controllers/technicianController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { auditTrail } from '../middleware/audit.js';

const router = express.Router();
router.use(protect, auditTrail);

router.route('/').get(technician.getTechnicians).post(restrictTo('admin'), technician.createTechnician);
router.get('/:id/overview', technician.getTechnicianOverview);
router
  .route('/:id')
  .get(technician.getTechnician)
  .patch(restrictTo('admin'), technician.updateTechnician)
  .delete(restrictTo('admin'), technician.deleteTechnician);

export default router;
