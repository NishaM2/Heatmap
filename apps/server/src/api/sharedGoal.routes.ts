import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import validate, { validateParams, validateQuery } from "../middleware/validate.middleware";
import { insertSharedGoalSchema, acceptSharedGoalSchema, idParamSchema, yearQuerySchema } from "../lib/validators";
import { acceptSharedGoal, createSharedGoal, declineSharedGoal, getComparison, getSharedGoals } from "../controllers/sharedGoal.controller";

const router = Router()

router.post('/', authMiddleware, validate(insertSharedGoalSchema), createSharedGoal)
router.get('/', authMiddleware, getSharedGoals)
router.patch('/:id/accept', authMiddleware, validateParams(idParamSchema), validate(acceptSharedGoalSchema), acceptSharedGoal)
router.patch('/:id/decline', authMiddleware, validateParams(idParamSchema), declineSharedGoal)
router.get('/:id/comparison', authMiddleware, validateParams(idParamSchema), validateQuery(yearQuerySchema), getComparison)

export default router
