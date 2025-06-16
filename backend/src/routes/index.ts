// src/routes/index.ts
import { Router } from 'express';
import sessionRoutes from './session.routes';  // Import session routes
import userRouter from './user.routes';
import multer from 'multer';
const upload = multer({ dest: 'uploads/' });

const router = Router();

// Use session routes
router.use('/sessions', sessionRoutes);

// user endpoints
router.use('/users', userRouter);

export default router;
