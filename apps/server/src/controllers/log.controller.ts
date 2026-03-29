import { NextFunction, Request, Response } from "express";
import * as logService from '../services/log.service'

export const createLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { date, effortLevel, note, categoryId } = req.body;
        const userId = req.user!.id;
        const newLog = await logService.upsertLog(userId, categoryId, date, effortLevel, note)
        return res.status(201).json(newLog)
    } catch (error) {
        next(error)
    }
}

export const getOverallLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const year = req.query.year as string || new Date().getFullYear().toString();
        const overallLog = await logService.getOverallLogs(userId, year)
        return res.status(200).json(overallLog)
    } catch (error) {
        next(error)
    }
}

export const getYearLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const categoryId = req.params.categoryId as string;
        const year = req.query.year as string || new Date().getFullYear().toString();
        const yearLog = await logService.getLogsForYear(userId, categoryId, year)
        return res.status(200).json(yearLog)
    } catch (error) {
        next(error)
    }
}

export const getDayLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const categoryId = req.params.categoryId as string;
        const date = req.params.date as string;
        const DayLog = await logService.getDayDetail(userId, categoryId, date)
        return res.status(200).json(DayLog)
    } catch (error) {
        next(error)
    }
}

