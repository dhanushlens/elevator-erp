import express from 'express';
import * as service from '../controllers/serviceController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { auditTrail } from '../middleware/audit.js';

const router = express.Router();
router.use(protect, auditTrail);

router.get('/calendar', service.getCalendar);
router.route('/').get(service.getServices).post(service.createService);
router.get('/:id/history', service.getServiceHistory);
router
  .route('/:id')
  .get(service.getService)
  .patch(service.updateService)
  .delete(restrictTo('admin'), service.deleteService);

export default router;
