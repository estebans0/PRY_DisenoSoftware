// src/routes/index.ts
import { Router } from 'express';
import userRouter from './user.routes';
import sessionRouter from './session.routes';

const router = Router();

// user endpoints
router.use('/users', userRouter);
router.use('/sessions', sessionRouter);

export default router;
