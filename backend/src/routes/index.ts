// src/routes/index.ts
import { Router } from 'express';
import * as SessionCtrl from '../controllers/session.controller';
import userRouter from './user.routes';

const router = Router();

// session endpoints
router.get( '/sessions',     SessionCtrl.list);
router.post('/sessions',     SessionCtrl.create);
router.get( '/sessions/:id', SessionCtrl.getOne);

// user endpoints
router.use('/users', userRouter);

export default router;
