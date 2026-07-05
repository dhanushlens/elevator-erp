import express from 'express';
import * as attendance from '../controllers/attendanceController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { auditTrail } from '../middleware/audit.js';

const router = express.Router();
router.use(protect, auditTrail);

router.get('/monthly', attendance.getMonthlyAttendance);
router.route('/').get(attendance.getAttendance).post(restrictTo('admin', 'employee'), attendance.markAttendance);
router
  .route('/:id')
  .get(attendance.getAttendanceRecord)
  .patch(restrictTo('admin', 'employee'), attendance.updateAttendance)
  .delete(restrictTo('admin'), attendance.deleteAttendance);

export default router;
