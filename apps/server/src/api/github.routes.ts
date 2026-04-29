import { Router } from 'express'
import authMiddleware from '../middleware/auth.middleware'
import { githubSync, getGithubStatus, disconnectGithub } from '../controllers/github.controllers'

const router = Router()

router.post('/sync', authMiddleware, githubSync)
router.get('/status', authMiddleware, getGithubStatus)
router.delete('/disconnect', authMiddleware, disconnectGithub)

export default router