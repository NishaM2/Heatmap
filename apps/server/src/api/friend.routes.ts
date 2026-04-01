import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import validate from "../middleware/validate.middleware";
import { insertFriendshipSchema } from "../lib/validators";
import { acceptRequest, declineRequest, getFriends, getRequests, searchUsers, sendRequest, unfriend } from "../controllers/friend.controller";

const router = Router()

router.get('/', authMiddleware, getFriends)
router.get('/requests', authMiddleware, getRequests)
router.get('/search', authMiddleware, searchUsers)
router.post('/request', authMiddleware, validate(insertFriendshipSchema), sendRequest)
router.patch('/:id/accept', authMiddleware, acceptRequest)
router.patch('/:id/decline', authMiddleware, declineRequest)
router.delete('/:id', authMiddleware, unfriend)

export default router