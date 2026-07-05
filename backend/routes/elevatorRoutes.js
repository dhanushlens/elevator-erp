import express from 'express';
import * as elevator from '../controllers/elevatorController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { auditTrail } from '../middleware/audit.js';

const router = express.Router();
router.use(protect, auditTrail);

router.get('/expiring', elevator.getExpiring);
router.route('/').get(elevator.getElevators).post(restrictTo('admin', 'employee'), elevator.createElevator);
router.get('/:id/service-history', elevator.getElevatorServiceHistory);
router
  .route('/:id')
  .get(elevator.getElevator)
  .patch(restrictTo('admin', 'employee'), elevator.updateElevator)
  .delete(restrictTo('admin'), elevator.deleteElevator);

export default router;
