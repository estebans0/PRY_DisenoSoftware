// src/routes/index.ts
import { Router } from 'express';
import * as SessionCtrl from '../controllers/session.controller';
import * as settingsCtrl from '../controllers/settings.controller';
import userRouter from './user.routes';

const router = Router();

// session endpoints
router.get( '/sessions',     SessionCtrl.list);
router.post('/sessions',     SessionCtrl.create);
router.get( '/sessions/:id', SessionCtrl.getOne);

// settings endpoints
router.get('/settings', settingsCtrl.getSettings);
router.put('/settings', settingsCtrl.updateSettings);

// user endpoints
router.use('/users', userRouter);

export default router;
