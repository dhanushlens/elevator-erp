import express from 'express';
import { generateReport, listSavedReports } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/saved', listSavedReports);
router.get('/:type', generateReport);

export default router;
