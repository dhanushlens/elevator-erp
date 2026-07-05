import express from 'express';
import * as notification from '../controllers/notificationController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', notification.getNotifications);
router.post('/generate', restrictTo('admin'), notification.generateAutomaticNotifications);
router.patch('/read-all', notification.markAllRead);
router.patch('/:id/read', notification.markRead);

export default router;
