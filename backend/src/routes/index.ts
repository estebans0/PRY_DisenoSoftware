// src/routes/index.ts
import { Router } from 'express';
<<<<<<< HEAD
import * as SessionCtrl from '../controllers/session.controller';
import * as settingsCtrl from '../controllers/settings.controller';
=======
>>>>>>> e81ff1d800092df0914524e1f1c984dfc5b412cc
import userRouter from './user.routes';
import sessionRouter from './session.routes';

const router = Router();

<<<<<<< HEAD
// session endpoints
router.get( '/sessions',     SessionCtrl.list);
router.post('/sessions',     SessionCtrl.create);
router.get( '/sessions/:id', SessionCtrl.getOne);

// settings endpoints
router.get('/settings', settingsCtrl.getSettings);
router.put('/settings', settingsCtrl.updateSettings);

=======
>>>>>>> e81ff1d800092df0914524e1f1c984dfc5b412cc
// user endpoints
router.use('/users', userRouter);
router.use('/sessions', sessionRouter);

export default router;
