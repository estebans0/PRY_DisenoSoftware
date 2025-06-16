import { Router } from 'express';
import * as SessionController from '../controllers/session.controller';
import multer from 'multer';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = Router();

// Basic session operations (no parameters)
router.get('/', SessionController.list);
router.post('/', SessionController.create);

// FIRST: Session operations by number (specific routes)
router.get('/number/:number', SessionController.getOneByNumber);
router.put('/number/:number', SessionController.updateByNumber);
router.delete('/number/:number', SessionController.removeByNumber);

// SECOND: Agenda operations by session number (specific routes)
router.post('/number/:number/agenda', SessionController.addAgendaItemsByNumber);
router.put('/number/:number/agenda', SessionController.updateAgendaByNumber);
router.delete('/number/:number/agenda/:itemId', SessionController.removeAgendaItemByNumber);

// THIRD: ID-based session operations (general routes - these should come last)
router.get('/:id', SessionController.getOne);
router.put('/:id', SessionController.update);
router.delete('/:id', SessionController.remove);

// FOURTH: ID-based agenda operations (general routes - these should come last)
router.post('/:id/agenda', SessionController.addAgendaItems);
router.put('/:id/agenda', SessionController.updateAgenda);
router.delete('/:id/agenda/:itemId', SessionController.removeAgendaItem);

// session endpoints
router.get( '/',     SessionController.list);
router.post('/',     SessionController.create);
router.get( '/:id', SessionController.getOne);
router.put('/:id', SessionController.update);
router.delete('/:id', SessionController.remove);
router.post("/:id/start", SessionController.startSession); // Nueva ruta
router.post("/:id/end", SessionController.endSession); // Nueva ruta
router.post('/guests', SessionController.addGuest);
router.delete('/:guestId', SessionController.removeGuest);

export default router;
