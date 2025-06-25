import express from 'express';
import * as JDMemberCtrl from '../controllers/JDMember.controller';

const router = express.Router();

router.get('/', JDMemberCtrl.list);
router.get('/:email', JDMemberCtrl.getOne);
router.post('/', JDMemberCtrl.create);
router.put('/:email', JDMemberCtrl.update);
router.delete('/:email', JDMemberCtrl.remove);

export default router;