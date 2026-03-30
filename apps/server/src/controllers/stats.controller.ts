import { NextFunction, Request, Response } from "express";
import * as statsService from '../services/stats.service'

export const getCategoryStats = async(req: Request, res: Response, next: NextFunction) => {
    try {
        const categoryId = req.params.categoryId as string;
        const year = req.query.year as string || new Date().getFullYear().toString();
        const userId = req.user!.id;
        const stats = await statsService.getCategoryStats(userId, categoryId, year)
        return res.status(200).json(stats)
    } catch (error) {
        next(error)
    }
}