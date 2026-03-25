import { Router } from 'express'
import authMiddleware from '../middleware/auth.middleware'
import validate from '../middleware/validate.middleware'
import { insertCategorySchema, updateCategorySchema } from '../lib/validators'
import { createCategory, deleteCategory, getCategories, updateCategory } from '../controllers/category.controller'
const router = Router()

router.post('/', authMiddleware, validate(insertCategorySchema), createCategory)
router.get('/', authMiddleware, getCategories)
router.patch('/:id', authMiddleware, validate(updateCategorySchema), updateCategory)
router.delete('/:id', authMiddleware, deleteCategory)

export default router