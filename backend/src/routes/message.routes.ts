import { Router } from 'express';
import {
  listMessages,
  markRead,
  deleteOne,
  clearInbox
} from '../controllers/message.controller';

const router = Router();

router.get('/', listMessages);
router.patch('/:id/read', markRead);
router.delete('/:id', deleteOne);
router.delete('/', clearInbox);

export default router;