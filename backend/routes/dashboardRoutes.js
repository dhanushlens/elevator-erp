import express from 'express';
import { getDashboardStats, getAnalytics, globalSearch } from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/analytics', getAnalytics);
router.get('/search', globalSearch);

export default router;
