import { NextFunction, Request, Response } from "express";
import * as sharedGoalService from '../services/sharedGoal.service'

export const createSharedGoal = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const initiatorCategoryId = req.body.initiatorCategoryId;
        const receiverId = req.body.receiverId;
        const newGoal = await sharedGoalService.createSharedGoal(userId, initiatorCategoryId, receiverId)
        return res.status(201).json(newGoal)
    } catch (error) {
        next(error)
    }
}

export const getSharedGoals = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const getGoal = await sharedGoalService.getSharedGoals(userId)
        return res.status(200).json(getGoal)
    } catch (error) {
        next(error)
    }
}

export const acceptSharedGoal = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const id = req.params.id as string;
        const receiverCategoryId = req.body.receiverCategoryId;
        const accepted = await sharedGoalService.acceptSharedGoal(userId, id, receiverCategoryId)
        return res.status(200).json(accepted)
    } catch (error) {
        next(error)
    }
}

export const declineSharedGoal = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const id = req.params.id as string;
        const declined = await sharedGoalService.declineSharedGoal(userId, id)
        return res.status(200).json(declined)
    } catch (error) {
        next(error)
    }
}

export const getComparison = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const id = req.params.id as string;
        const year = req.query.year as string || new Date().getFullYear().toString();
        const comparision = await sharedGoalService.getComparison(userId, id, year)
        return res.status(200).json(comparision)
    } catch (error) {
        next(error)
    }
}