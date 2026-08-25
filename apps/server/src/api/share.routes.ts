import { Router } from 'express'
import authMiddleware from '../middleware/auth.middleware'
import { validateParams, validateQuery } from '../middleware/validate.middleware'
import { categoryIdParamSchema, yearQuerySchema } from '../lib/validators'
import { generateHeatmapImage } from '../services/image.service'

const router = Router()

router.get('/:categoryId', authMiddleware, validateParams(categoryIdParamSchema), validateQuery(yearQuerySchema), async (req, res, next) => {
  try {
    const userId = req.user!.id
    const categoryId = req.params.categoryId as string
    const year = req.query.year as string || new Date().getFullYear().toString()

    const imageBuffer = await generateHeatmapImage(userId, categoryId, year)

    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Content-Disposition', 'attachment; filename=heatmap.png')
    res.send(imageBuffer)
  } catch (error) {
    next(error)
  }
})

export default router