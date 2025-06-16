// backend/src/routes/session.routes.ts
import { Router } from 'express';
import * as SessionController from '../controllers/session.controller';
import { upload }               from '../controllers/session.controller';

const router = Router();

// Core CRUD
router.get('/',              SessionController.list);
router.post('/',             SessionController.create);
router.get('/:id',           SessionController.getOne);
router.put('/:id',           SessionController.update);
router.delete('/:id',        SessionController.remove);

// Start / End
router.post('/:id/start',    SessionController.startSession);
router.post('/:id/end',      SessionController.endSession);

// Agenda by ID
router.post('/:id/agenda',            SessionController.addAgendaItems);
router.put('/:id/agenda',             SessionController.updateAgenda);
router.delete('/:id/agenda/:itemId',  SessionController.removeAgendaItem);

// Agenda by Number
router.get('/number/:number',                    SessionController.getOneByNumber);
router.put('/number/:number',                    SessionController.updateByNumber);
router.delete('/number/:number',                 SessionController.removeByNumber);
router.post('/number/:number/agenda',            SessionController.addAgendaItemsByNumber);
router.put('/number/:number/agenda',             SessionController.updateAgendaByNumber);
router.delete('/number/:number/agenda/:itemId',  SessionController.removeAgendaItemByNumber);

// Guests
router.post('/:sessionId/guests',         SessionController.addGuest);
router.delete('/:sessionId/guests/:guestId', SessionController.removeGuest);

// Upload PDFs for an agenda item
router.post(
  '/:id/agenda/:order/documents',
  upload.array('files'),
  SessionController.uploadDocuments[1]    // mount the async handler
);

export default router;
