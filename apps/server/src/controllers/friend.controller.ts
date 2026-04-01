import { NextFunction, Request, Response } from "express";
import * as friendService from '../services/friend.service'

export const getFriends = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId  = req.user!.id;
        const friends = await friendService.getFriends(userId)
        return res.status(200).json(friends)
    } catch (error) {
        next(error)
    }
}

export const getRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId  = req.user!.id;
        const pendingRequests = await friendService.getPendingRequests(userId)
        return res.status(200).json(pendingRequests)
    } catch (error) {
        next(error)
    }
}

export const searchUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId  = req.user!.id;
        const username = req.query.username as string;
        const search = await friendService.searchUsers(userId, username)
        return res.status(200).json(search)
    } catch (error) {
        next(error)
    }
}

export const sendRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId  = req.user!.id;
        const receiverId = req.body.receiverId;
        const sentRequests = await friendService.sendRequest(userId, receiverId)
        return res.status(201).json(sentRequests)
    } catch (error) {
        next(error)
    }
}

export const acceptRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId  = req.user!.id;
        const friendshipId = req.params.id as string;
        const accept = await friendService.acceptRequest(userId, friendshipId)
        return res.status(200).json(accept)
    } catch (error) {
        next(error)
    }
}

export const declineRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId  = req.user!.id;
        const friendshipId = req.params.id as string;
        const decline = await friendService.declineRequest(userId, friendshipId)
        return res.status(200).json(decline)
    } catch (error) {
        next(error)
    }
}

export const unfriend = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId  = req.user!.id;
        const friendshipId = req.params.id as string;
        const unfriend = await friendService.unfriend(userId, friendshipId)
        return res.status(200).json(unfriend)
    } catch (error) {
        next(error)
    }
}