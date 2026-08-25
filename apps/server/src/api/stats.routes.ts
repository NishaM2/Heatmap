import { Router } from "express"
import { getCategoryStats } from "../controllers/stats.controller"
import authMiddleware from "../middleware/auth.middleware"
import { validateParams, validateQuery } from "../middleware/validate.middleware"
import { categoryIdParamSchema, yearQuerySchema } from "../lib/validators"

const router = Router()

router.get('/:categoryId', authMiddleware, validateParams(categoryIdParamSchema), validateQuery(yearQuerySchema), getCategoryStats)

export default router
