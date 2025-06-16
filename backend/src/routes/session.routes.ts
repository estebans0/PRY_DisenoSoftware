import express  from "express";
import * as SessionCtrl from '../controllers/session.controller'

const router = express.Router()

// session endpoints
router.get( '/',     SessionCtrl.list);
router.post('/',     SessionCtrl.create);
router.get( '/:id', SessionCtrl.getOne);
router.put('/:id', SessionCtrl.update);
router.delete('/:id', SessionCtrl.remove);
router.post('/guests', SessionCtrl.addGuest);
router.delete('/:guestId', SessionCtrl.removeGuest);

export default router