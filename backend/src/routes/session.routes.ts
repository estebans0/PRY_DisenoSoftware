import { Router } from 'express';
import * as SessionController from '../controllers/session.controller';

const router = Router();

// Get all sessions
router.get('/', SessionController.list);

// Create a new session
router.post('/', SessionController.create);

// Get a specific session by ID
router.get('/:id', SessionController.getOne);

// Update a session
router.put('/:id', SessionController.update);

// Delete a session
router.delete('/:id', SessionController.remove);

export default router;