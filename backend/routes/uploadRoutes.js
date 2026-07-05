import express from 'express';
import { upload } from '../middleware/upload.js';
import { uploadFiles } from '../controllers/uploadController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.post('/', upload.array('files', 10), uploadFiles);

export default router;
