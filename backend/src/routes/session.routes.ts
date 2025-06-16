import express  from "express";
import * as sessionController from '../controllers/session.controller'

const router = express.Router()

// session endpoints
router.get( '/',     sessionController.list);
router.post('/',     sessionController.create);
router.get( '/:id', sessionController.getOne);
router.put('/:id', sessionController.update);
router.delete('/:id', sessionController.remove);
router.post("/:id/start", sessionController.startSession); // Nueva ruta
router.post("/:id/end", sessionController.endSession); // Nueva ruta
router.post('/guests', sessionController.addGuest);
router.delete('/:guestId', sessionController.removeGuest);

export default router

