import express from 'express';
import * as user from '../controllers/userController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { auditTrail } from '../middleware/audit.js';

const router = express.Router();
router.use(protect, auditTrail);

router.get('/activity-logs', restrictTo('admin'), user.getActivityLogs);
router.get('/audit-logs', restrictTo('admin'), user.getAuditLogs);
router.route('/settings').get(user.getSettings).patch(restrictTo('admin'), user.updateSettings);
router.route('/').get(restrictTo('admin'), user.getUsers).post(restrictTo('admin'), user.createUser);
router
  .route('/:id')
  .get(restrictTo('admin'), user.getUser)
  .patch(restrictTo('admin'), user.updateUser)
  .delete(restrictTo('admin'), user.deleteUser);

export default router;
