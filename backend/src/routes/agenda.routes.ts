import { Router } from 'express';
import * as AgendaCtrl from '../controllers/Agenda.controller';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/' }); // Configure multer as needed

// Get agenda for a session
router.get('/session/:sessionId', AgendaCtrl.getAgenda);

// Create or update an entire agenda
router.put('/session/:sessionId', AgendaCtrl.createOrUpdateAgenda);

// Add a new agenda item
router.post('/session/:sessionId/item', AgendaCtrl.addAgendaItem);

// Update an agenda item
router.put('/session/:sessionId/item/:order', AgendaCtrl.updateAgendaItem);

// Delete an agenda item
router.delete('/session/:sessionId/item/:order', AgendaCtrl.deleteAgendaItem);

// Delete entire agenda
router.delete('/session/:sessionId', AgendaCtrl.deleteAgenda);

// Add these new routes for document handling
router.post(
  '/session/:sessionId/item/:order/documents',
  upload.array('documents'), // Middleware to handle file uploads
  AgendaCtrl.uploadDocuments
);

router.delete(
  '/session/:sessionId/item/:order/documents/:docId',
  AgendaCtrl.deleteDocument
);

export default router;