// src/routes/index.ts
import { Router } from 'express';
import * as SessionCtrl from '../controllers/session.controller';
import * as AgendaCtrl from '../controllers/Agenda.controller';
import userRouter from './user.routes';

const router = Router();

// session endpoints
router.get( '/sessions',     SessionCtrl.list);
router.post('/sessions',     SessionCtrl.create);
router.get( '/sessions/:id', SessionCtrl.getOne);
router.put( '/sessions/:id', SessionCtrl.update);
router.delete('/sessions/:id', SessionCtrl.remove);

// agenda endpoints
router.get(   '/agenda/session/:sessionId',           AgendaCtrl.getAgenda);
router.put(   '/agenda/session/:sessionId',           AgendaCtrl.createOrUpdateAgenda);
router.post(  '/agenda/session/:sessionId/item',      AgendaCtrl.addAgendaItem);
router.put(   '/agenda/session/:sessionId/item/:order', AgendaCtrl.updateAgendaItem);
router.delete('/agenda/session/:sessionId/item/:order', AgendaCtrl.deleteAgendaItem);
router.delete('/agenda/session/:sessionId',           AgendaCtrl.deleteAgenda);

// user endpoints
router.use('/users', userRouter);

export default router;
