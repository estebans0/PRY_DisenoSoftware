import express from 'express'
import * as UserCtrl from '../controllers/user.controller'

const router = express.Router()

router.get('/',    UserCtrl.list)
router.get('/:id', UserCtrl.getOne)
router.post('/',   UserCtrl.create)
router.put('/:id', UserCtrl.update)
router.delete('/:id', UserCtrl.remove)
router.post('/register', UserCtrl.register);
router.post('/login', UserCtrl.login);

export default router
