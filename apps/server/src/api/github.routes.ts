import { Router } from 'express'
import authMiddleware from '../middleware/auth.middleware'
import { githubSync } from '../controllers/github.controllers'

const router = Router()

router.post('/sync', authMiddleware, githubSync)

export default router