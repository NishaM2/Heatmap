import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import validate from "../middleware/validate.middleware";
import { insertLogSchema } from "../lib/validators";
import { createLog, getOverallLog, getYearLog, getDayLog, deleteLog, deleteAllLogs } from '../controllers/log.controller'

const router = Router()

router.post('/', authMiddleware, validate(insertLogSchema), createLog)
router.get('/overall', authMiddleware, getOverallLog)
router.get('/:categoryId', authMiddleware, getYearLog)
router.get('/:categoryId/:date', authMiddleware, getDayLog)
router.delete('/:id', authMiddleware, deleteLog)
router.delete('/', authMiddleware, deleteAllLogs)

export default router