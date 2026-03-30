import { Router } from "express"
import { getCategoryStats } from "../controllers/stats.controller"
import authMiddleware from "../middleware/auth.middleware"

const router = Router()

router.get('/:categoryId', authMiddleware, getCategoryStats)

export default router