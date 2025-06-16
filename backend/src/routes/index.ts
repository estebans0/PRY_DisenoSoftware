// src/routes/index.ts
import { Router } from 'express';
import sessionRoutes from './session.routes';  // Import session routes
import * as settingsCtrl from '../controllers/settings.controller';
import userRouter from './user.routes';
import sessionRouter from './session.routes';
import multer from 'multer';
const upload = multer({ dest: 'uploads/' });

const router = Router();

// Use session routes
router.use('/sessions', sessionRoutes);

// settings endpoints
router.get('/settings', settingsCtrl.getSettings);
router.put('/settings', settingsCtrl.updateSettings);

// user endpoints
router.use('/users', userRouter);
router.use('/sessions', sessionRouter);

export default router;
