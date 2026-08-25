import { Router } from 'express'
import authMiddleware from '../middleware/auth.middleware'
import validate, { validateParams } from '../middleware/validate.middleware'
import { insertCategorySchema, updateCategorySchema, idParamSchema } from '../lib/validators'
import { createCategory, deleteCategory, getCategories, updateCategory } from '../controllers/category.controller'
const router = Router()

router.post('/', authMiddleware, validate(insertCategorySchema), createCategory)
router.get('/', authMiddleware, getCategories)
router.patch('/:id', authMiddleware, validateParams(idParamSchema), validate(updateCategorySchema), updateCategory)
router.delete('/:id', authMiddleware, validateParams(idParamSchema), deleteCategory)

export default router
