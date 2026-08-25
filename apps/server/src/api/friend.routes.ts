import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import validate, { validateParams } from "../middleware/validate.middleware";
import { insertFriendshipSchema, idParamSchema } from "../lib/validators";
import { acceptRequest, declineRequest, getFriends, getRequests, searchUsers, sendRequest, unfriend } from "../controllers/friend.controller";

const router = Router()

router.get('/', authMiddleware, getFriends)
router.get('/requests', authMiddleware, getRequests)
router.get('/search', authMiddleware, searchUsers)
router.post('/request', authMiddleware, validate(insertFriendshipSchema), sendRequest)
router.patch('/:id/accept', authMiddleware, validateParams(idParamSchema), acceptRequest)
router.patch('/:id/decline', authMiddleware, validateParams(idParamSchema), declineRequest)
router.delete('/:id', authMiddleware, validateParams(idParamSchema), unfriend)

export default router
