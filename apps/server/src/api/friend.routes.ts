import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import validate from "../middleware/validate.middleware";
import { insertFriendshipSchema } from "../lib/validators";

const router = Router()

router.get('/', authMiddleware)
router.get('/requests', authMiddleware)
router.get('/search', authMiddleware)
router.post('/request', authMiddleware, validate(insertFriendshipSchema))
router.patch('/:id/accept', authMiddleware)
router.patch('/:id/decline', authMiddleware)
router.delete('/:id', authMiddleware)

export default router