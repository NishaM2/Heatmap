import { Router } from 'express'
import authMiddleware from '../middleware/auth.middleware'
import validate from '../middleware/validate.middleware'
import { setPasswordSchema } from '../lib/validators'
import { getAccountStatus, setPassword } from '../controllers/account.controller'

const router = Router()

router.get('/status', authMiddleware, getAccountStatus)
router.post('/set-password', authMiddleware, validate(setPasswordSchema), setPassword)

export default router
