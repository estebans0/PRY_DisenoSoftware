import express from 'express'
import * as UserCtrl from '../controllers/user.controller'

const router = express.Router()

router.get('/', UserCtrl.list)
router.get('/:email', UserCtrl.getOne)  // Changed from :id to :email
router.post('/', UserCtrl.create)
router.put('/:email', UserCtrl.update)  // Changed from :id to :email
router.delete('/:email', UserCtrl.remove)  // Changed from :id to :email
router.post('/register', UserCtrl.register);
router.post('/login', UserCtrl.login);

export default router
