import { Router } from 'express';
import * as AgendaController from '../controllers/Agenda.controller';

const router = Router();

// Get agenda for a session
router.get('/session/:sessionId', AgendaController.getAgenda);

// Create or update an entire agenda
router.put('/session/:sessionId', AgendaController.createOrUpdateAgenda);

// Add a new agenda item
router.post('/session/:sessionId/item', AgendaController.addAgendaItem);

// Update an agenda item
router.put('/session/:sessionId/item/:order', AgendaController.updateAgendaItem);

// Delete an agenda item
router.delete('/session/:sessionId/item/:order', AgendaController.deleteAgendaItem);

// Delete entire agenda
router.delete('/session/:sessionId', AgendaController.deleteAgenda);

export default router;