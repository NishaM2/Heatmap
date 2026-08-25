import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import validate, { validateParams, validateQuery } from "../middleware/validate.middleware";
import { insertLogSchema, idParamSchema, categoryIdParamSchema, dayParamSchema, yearQuerySchema} from "../lib/validators";
import { createLog, getOverallLog, getYearLog, getDayLog, deleteLog, deleteAllLogs } from '../controllers/log.controller'

const router = Router()

router.post('/', authMiddleware, validate(insertLogSchema), createLog)
router.get('/overall', authMiddleware, validateQuery(yearQuerySchema), getOverallLog)
router.get('/:categoryId', authMiddleware, validateParams(categoryIdParamSchema), validateQuery(yearQuerySchema), getYearLog)
router.get('/:categoryId/:date', authMiddleware, validateParams(dayParamSchema), getDayLog)
router.delete('/:id', authMiddleware, validateParams(idParamSchema), deleteLog)
router.delete('/', authMiddleware, deleteAllLogs)

export default router
