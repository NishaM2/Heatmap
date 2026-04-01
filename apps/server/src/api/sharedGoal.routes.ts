import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import validate from "../middleware/validate.middleware";
import { insertSharedGoalSchema } from "../lib/validators";
import { acceptSharedGoal, createSharedGoal, declineSharedGoal, getComparison, getSharedGoals } from "../controllers/sharedGoal.controller";

const router = Router()

router.post('/', authMiddleware, validate(insertSharedGoalSchema), createSharedGoal)
router.get('/', authMiddleware, getSharedGoals)
router.patch('/:id/accept', authMiddleware, acceptSharedGoal)
router.patch('/:id/decline', authMiddleware, declineSharedGoal)
router.get('/:id/comparison', authMiddleware, getComparison)

export default router